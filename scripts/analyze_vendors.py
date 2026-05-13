import re
import json

def extract_vd_raw(filepath):
    with open(filepath, 'r') as f:
        content = f.read()

    # Find the start and end of VD_RAW array
    match = re.search(r'const VD_RAW\s*=\s*(\[.*?\]);', content, re.DOTALL)
    if not match:
        return None

    try:
        return json.loads(match.group(1))
    except json.JSONDecodeError:
        # If standard JSON fails, try a more permissive approach or just regex what we need
        return None

def analyze_vendors(vd_raw):
    # Sort by total sales
    sorted_vendors = sorted(vd_raw, key=lambda x: x.get('sl', {}).get('t', 0), reverse=True)

    print("Top 20 Vendors by Total Sales:")
    print("Name, Total Sales, LightsAm Score, Web Listing Score")
    for v in sorted_vendors[:20]:
        name = v.get('n', 'Unknown')
        sales = v.get('sl', {}).get('t', 0)
        scores = v.get('s', {})
        lights_am = scores.get('lightsAm', {}).get('v', 'N/A')
        web_listing = scores.get('webListing', {}).get('v', 'N/A')
        print(f"{name}, {sales}, {lights_am}, {web_listing}")

if __name__ == "__main__":
    # Since VD_RAW is huge and may not be valid JSON (might have JS comments or trailing commas),
    # let's use a simpler regex to extract names and sales directly.
    with open('index.html', 'r') as f:
        content = f.read()

    # Pattern to find "n":"Name" and "t":12345.67
    pattern = re.compile(r'\{"id":\d+,"n":"(?P<name>[^"]+)".*?"sl":\{.*?"t":(?P<total>[0-9.]+)\}', re.DOTALL)
    vendors = []
    for match in pattern.finditer(content):
        vendors.append({
            'name': match.group('name'),
            'total': float(match.group('total'))
        })

    sorted_vendors = sorted(vendors, key=lambda x: x['total'], reverse=True)
    for v in sorted_vendors[:30]:
        print(f"{v['name']}: ${v['total']:,.2f}")
