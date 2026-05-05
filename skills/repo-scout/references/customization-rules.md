# Customization Rules for repo-scout
# Applied when generating adapted installs for AccentOS context.

---

## Universal substitutions

Generic | AccentOS replacement
generic paths | /workspaces/accent-os/ in Codespace
"your project" | AccentOS or Accent Lighting (specific)
generic store | BigCommerce store-cwqiwcjxes
generic DB | Supabase hsyjcrrazrzqngwkqsqa
generic user | Michael

---

## Install snippet format (always single block)

# [Tool Name] — AccentOS install
# Paste in Codespace terminal at https://jubilant-meme-6966xvqw6594f59gp.github.dev/
[command 1]
[command 2]
# Verify:
[verification command]

For MCP servers also include the settings.json snippet:
"[server-name]": {
  "command": "...",
  "args": [...],
  "env": { "[KEY]": "YOUR_VALUE" }
}

---

## Quality bar

Customization is complete when:
- All paths are Codespace-compatible
- At least one AccentOS-specific example substituted
- Install is single-block, paste-ready
- No "read the docs" instructions
- Trigger description includes AccentOS-specific phrases
