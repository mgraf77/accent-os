#!/usr/bin/env node
// auto-categorize.js — Fetches vendor homepages and uses Claude to map them to PRODUCT_TAXONOMY keys.

const fs = require('fs');
const path = require('path');

// ── CONFIG ────────────────────────────────────────────────
const ANTHROPIC_API_KEY = process.env.ANTHROPIC_API_KEY;
if (!ANTHROPIC_API_KEY) { console.error('ANTHROPIC_API_KEY not set'); process.exit(1); }

const CONCURRENCY = 3;
const BATCH_DELAY_MS = 500;
const FETCH_TIMEOUT_MS = 8000;

// ── PRODUCT TAXONOMY ──────────────────────────────────────
const PRODUCT_TAXONOMY = {
  'Indoor Lighting': {
    'Chandeliers': ['Mini Chandelier','Mid Chandelier','Large Chandelier','Linear / Island','Multi-System / Modular'],
    'Pendants': ['Mini Pendant','Standard Pendant','Multi-Light Pendant'],
    'Flush & Semi-Flush': ['Flush Mount','Semi-Flush Mount'],
    'Sconces': ['Wall Sconce / Indoor','Bath / Vanity Bar','Foyer / Hall Lantern'],
    'Recessed': ['Recessed Can / Trim','LED Wafer / Retrofit'],
    'Lamps': ['Table Lamp','Floor Lamp','Desk / Task Lamp','Buffet / Accent Lamp','Torchiere / Arc','Cordless / Portable'],
  },
  'Exterior': {
    'Wall-Mounted': ['Wall Sconce / Outdoor','Wall Mount / Flush','Wall Mount + Flush Combo'],
    'Ceiling / Hanging': ['Ceiling Mount (Exterior)','Hanging / Pendant (Exterior)','Exterior Chandelier'],
    'Post & Pier': ['Post / Pole','Post / Pier Head','Pier Mount'],
    'Landscape': ['Path / Ground Light','Spot / Well Light','Flood / Security','Step / Brick Light','Solar'],
    'Exterior Décor': ['Decor / Furniture / Mailbox'],
    'Specialty Exterior': ['Patio / Garden Lamp'],
  },
  'Fans': {
    'Standard Fans': ['Standard Ceiling Fan','Hugger / Low-Profile','Fandelier (Fan + Light)'],
    'Location-Rated Fans': ['Damp Location Fan','Wet Location Fan'],
    'Fan Accessories': ['Fan Blade','Light Kit','Fan Control / Remote','Fan Fitter','Portable / Wall Fan'],
  },
  'More Categories': {
    'Bulbs & Lamps': ['LED Bulb','Specialty / Decorative Bulb','Smart Bulb','Fluorescent / CFL'],
    'Mirrors': ['Decorative Mirror','Lighted Mirror / Electric Mirror'],
    'Décor & Furniture': ['Furniture','Home Accents / Décor','Holiday / Seasonal'],
    'Plumbing': ['Plumbing Fixture / Accessory'],
  },
  'Commercial': {
    'Linear & Troffer': ['LED Troffer','Linear Strip / High-Output','Architectural Linear'],
    'Track & Recessed': ['Track Head / Rail','Recessed Commercial','Monorail'],
    'Industrial': ['High Bay','Low Bay','Warehouse / Outdoor Area'],
    'Controls & Safety': ['Emergency / Exit','Occupancy Sensor / Timer','Dimmer / Control'],
  },
  'Controls & Accessories': {
    'Controls': ['Dimmer Switch','Smart / Wi-Fi Control','Fan Control / Remote','Sensor / Timer','Transformer'],
    'Hardware': ['Canopy / Extension Rod','Mounting Hardware','Replacement Glass / Shade','Lamp Parts / Fittings'],
    'LED & Power': ['LED Strip / Tape','Driver / Power Supply','Under Cabinet LED'],
  }
};

// Build flat list of valid taxonomy keys "Category>Subcategory>Type"
const VALID_KEYS = [];
for (const [cat, subs] of Object.entries(PRODUCT_TAXONOMY)) {
  for (const [sub, types] of Object.entries(subs)) {
    for (const t of types) {
      VALID_KEYS.push(`${cat}>${sub}>${t}`);
    }
  }
}

// ── EXTRACT VD_RAW FROM index.html ────────────────────────
function loadVendors() {
  const html = fs.readFileSync(path.join(__dirname, '..', 'index.html'), 'utf8');

  // Extract VD_RAW
  const vdMatch = html.match(/const VD_RAW\s*=\s*(\[[\s\S]*?\]);?\s*\n/);
  if (!vdMatch) throw new Error('Could not find VD_RAW in index.html');
  const VD_RAW = JSON.parse(vdMatch[1]);

  // Extract REP_DIRECTORY
  const repMatch = html.match(/const REP_DIRECTORY\s*=\s*(\[[\s\S]*?\]);?\s*\n/);
  let REP_DIRECTORY = [];
  if (repMatch) {
    try { REP_DIRECTORY = JSON.parse(repMatch[1]); } catch {}
  }

  return { VD_RAW, REP_DIRECTORY };
}

// ── DERIVE VENDOR WEBSITE ─────────────────────────────────
function deriveWebsite(vendorName) {
  // Normalize: lowercase, strip suffixes like INC., LLC, CO., LTD, etc.
  let slug = vendorName
    .toLowerCase()
    .replace(/['']/g, '')
    .replace(/\b(inc|llc|co|ltd|corp|corporation|company|group|enterprises?|international|intl|usa|america)\b\.?/gi, '')
    .replace(/&/g, 'and')
    .replace(/[^a-z0-9]+/g, '')
    .trim();

  if (!slug || slug.length < 2) return null;

  return `https://www.${slug}.com`;
}

// ── FETCH PAGE TEXT ───────────────────────────────────────
async function fetchPageText(url) {
  const controller = new AbortController();
  const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
  try {
    const res = await fetch(url, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (AccentOS Auto-Categorizer)' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return null;
    const html = await res.text();
    // Strip tags, get text content (rough)
    return html
      .replace(/<script[^>]*>[\s\S]*?<\/script>/gi, '')
      .replace(/<style[^>]*>[\s\S]*?<\/style>/gi, '')
      .replace(/<[^>]+>/g, ' ')
      .replace(/\s+/g, ' ')
      .slice(0, 6000); // limit to ~6k chars for Claude
  } catch {
    clearTimeout(timer);
    return null;
  }
}

// ── TRY TO FIND PRODUCT/CATEGORY PAGES ────────────────────
async function fetchCategoryPages(baseUrl, homepageHtml) {
  // Look for links to product or category pages in the raw homepage HTML
  const pages = [];
  if (!homepageHtml) return pages;

  // Re-fetch raw HTML to find links
  try {
    const controller = new AbortController();
    const timer = setTimeout(() => controller.abort(), FETCH_TIMEOUT_MS);
    const res = await fetch(baseUrl, {
      signal: controller.signal,
      headers: { 'User-Agent': 'Mozilla/5.0 (AccentOS Auto-Categorizer)' },
      redirect: 'follow',
    });
    clearTimeout(timer);
    if (!res.ok) return pages;
    const html = await res.text();

    // Find product/category links
    const linkRe = /href=["']([^"']*(?:product|categor|collection|shop|lighting|fan|outdoor|indoor|pendant|chandelier|sconce|lamp)[^"']*)["']/gi;
    const seen = new Set();
    let m;
    while ((m = linkRe.exec(html)) !== null && seen.size < 2) {
      let href = m[1];
      if (href.startsWith('/')) href = new URL(href, baseUrl).href;
      else if (!href.startsWith('http')) continue;
      if (seen.has(href)) continue;
      seen.add(href);
    }

    for (const url of seen) {
      const text = await fetchPageText(url);
      if (text) pages.push(text);
    }
  } catch {}

  return pages;
}

// ── CALL CLAUDE HAIKU ─────────────────────────────────────
async function classifyVendor(vendorName, pageTexts) {
  const combinedText = pageTexts.join('\n---PAGE BREAK---\n').slice(0, 10000);

  const body = {
    model: 'claude-haiku-4-5-20251001',
    max_tokens: 500,
    messages: [{
      role: 'user',
      content: `You are classifying a lighting/home vendor into product taxonomy categories.

Vendor name: ${vendorName}

Website content:
${combinedText}

Valid taxonomy keys (format "Category>Subcategory>Type"):
${VALID_KEYS.join('\n')}

Based on the website content, return a JSON array of matching taxonomy keys that this vendor's products fall into. Only include categories where you have evidence from the page content. Return ONLY the JSON array, no other text. Example: ["Indoor Lighting>Chandeliers>Large Chandelier","Exterior>Landscape>Path / Ground Light"]`
    }]
  };

  try {
    const res = await fetch('https://api.anthropic.com/v1/messages', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-key': ANTHROPIC_API_KEY,
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(body),
    });

    if (!res.ok) {
      const errText = await res.text();
      console.error(`  Claude API error: ${res.status} ${errText.slice(0, 200)}`);
      return [];
    }

    const data = await res.json();
    const text = data.content?.[0]?.text || '[]';
    // Extract JSON array from response
    const arrMatch = text.match(/\[[\s\S]*\]/);
    if (!arrMatch) return [];
    const arr = JSON.parse(arrMatch[0]);
    // Validate keys
    return arr.filter(k => VALID_KEYS.includes(k));
  } catch (e) {
    console.error(`  Claude classify error: ${e.message}`);
    return [];
  }
}

// ── CONCURRENCY POOL ──────────────────────────────────────
async function processInBatches(tasks, concurrency, delayMs) {
  const results = [];
  for (let i = 0; i < tasks.length; i += concurrency) {
    const batch = tasks.slice(i, i + concurrency);
    const batchResults = await Promise.all(batch.map(fn => fn()));
    results.push(...batchResults);
    if (i + concurrency < tasks.length) {
      await new Promise(r => setTimeout(r, delayMs));
    }
  }
  return results;
}

// ── MAIN ──────────────────────────────────────────────────
async function main() {
  console.log('Loading vendors from index.html...');
  const { VD_RAW, REP_DIRECTORY } = loadVendors();
  console.log(`Found ${VD_RAW.length} vendors, ${REP_DIRECTORY.length} rep groups`);

  // Build rep website lookup
  const repWebsites = {};
  for (const rep of REP_DIRECTORY) {
    if (rep['Rep Company'] && rep['Website']) {
      repWebsites[rep['Rep Company']] = rep['Website'];
    }
  }

  // Prepare vendor list with derived URLs
  const vendors = VD_RAW.map(r => {
    const website = deriveWebsite(r.n);
    return {
      id: r.id,
      name: r.n,
      rep: r.rg || '',
      repWebsite: r.rg ? (repWebsites[r.rg] || null) : null,
      website,
    };
  });

  const withUrl = vendors.filter(v => v.website);
  const withoutUrl = vendors.filter(v => !v.website);
  console.log(`${withUrl.length} vendors with derived URLs, ${withoutUrl.length} without`);

  const output = {};

  // Mark vendors without URLs
  for (const v of withoutUrl) {
    output[v.id] = { name: v.name, categories: [], note: 'No website URL could be derived from vendor name' };
  }

  let categorized = 0;
  let skipped = withoutUrl.length;
  let fetchFailed = 0;
  let processed = 0;

  // Build task functions
  const tasks = withUrl.map(v => async () => {
    processed++;
    const pct = ((processed / withUrl.length) * 100).toFixed(0);
    process.stdout.write(`\r[${processed}/${withUrl.length}] (${pct}%) Processing: ${v.name.slice(0, 40).padEnd(40)}`);

    // Fetch homepage
    const homepageText = await fetchPageText(v.website);
    if (!homepageText) {
      fetchFailed++;
      output[v.id] = { name: v.name, website: v.website, categories: [], note: `Homepage fetch failed (${v.website})` };
      return;
    }

    // Try to find category pages
    const catPages = await fetchCategoryPages(v.website, homepageText);
    const allPages = [homepageText, ...catPages];

    // Classify with Claude
    const categories = await classifyVendor(v.name, allPages);
    output[v.id] = { name: v.name, website: v.website, categories };
    if (categories.length > 0) categorized++;
    else {
      output[v.id].note = 'Claude could not determine categories from page content';
    }
  });

  console.log(`\nStarting categorization (concurrency=${CONCURRENCY}, delay=${BATCH_DELAY_MS}ms)...\n`);
  await processInBatches(tasks, CONCURRENCY, BATCH_DELAY_MS);

  // Write output
  const outPath = path.join(__dirname, 'vendor-categories.json');
  fs.writeFileSync(outPath, JSON.stringify(output, null, 2));
  console.log(`\n\nResults written to ${outPath}`);

  // Summary
  const total = VD_RAW.length;
  const noUrl = withoutUrl.length;
  console.log(`\n═══ SUMMARY ═══`);
  console.log(`Total vendors:        ${total}`);
  console.log(`Categorized:          ${categorized}`);
  console.log(`Fetch failed:         ${fetchFailed}`);
  console.log(`No URL (skipped):     ${noUrl}`);
  console.log(`No categories found:  ${total - categorized - noUrl - fetchFailed}`);

  // First 10 results
  console.log(`\n═══ FIRST 10 RESULTS ═══`);
  const entries = Object.entries(output).slice(0, 10);
  for (const [id, data] of entries) {
    const cats = data.categories.length ? data.categories.join(', ') : (data.note || 'none');
    console.log(`  [${id}] ${data.name}: ${cats}`);
  }
}

main().catch(e => { console.error(e); process.exit(1); });
