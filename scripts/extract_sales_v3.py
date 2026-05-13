import re

def extract_sales():
    with open('index.html', 'r') as f:
        content = f.read()

    # Find VD_RAW start
    start_marker = 'const VD_RAW=['
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("VD_RAW not found")
        return

    # Use a simpler approach: find all occurrences of "n":"..." followed by "sl":{"t":...}
    # This is slightly risky if the structures vary, but let's try.
    # Pattern: "n":"([^"]+)".*?"sl":\{.*?"t":([0-9.]+)
    # We'll use a non-greedy .*? to find the nearest sales data

    pattern = re.compile(r'"n":"(?P<name>[^"]+)".*?"sl":\{[^}]*?"t":(?P<total>[0-9.]+)', re.DOTALL)

    vendors = []
    # We restrict searching to the part of the file that likely contains VD_RAW
    # to avoid false positives in other scripts/modules.
    # For now, let's just search the whole thing but start from start_idx.

    for match in pattern.finditer(content, start_idx):
        vendors.append({
            'name': match.group('name'),
            'total': float(match.group('total'))
        })

    # Sort and filter
    sorted_vendors = sorted(vendors, key=lambda x: x['total'], reverse=True)

    print("Name, Total Sales")
    for v in sorted_vendors[:50]:
        print(f"{v['name']}, {v['total']}")

if __name__ == "__main__":
    extract_sales()
