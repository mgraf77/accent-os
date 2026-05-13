import re

def analyze_vendors_raw():
    with open('index.html', 'r') as f:
        content = f.read()

    # Extract the whole VD_RAW content
    start_marker = 'const VD_RAW=['
    start_idx = content.find(start_marker)
    if start_idx == -1:
        print("VD_RAW not found")
        return

    # Find the end of the array (basic brace matching)
    depth = 0
    end_idx = -1
    for i in range(start_idx + len(start_marker) - 1, len(content)):
        if content[i] == '[':
            depth += 1
        elif content[i] == ']':
            depth -= 1
            if depth == -1:
                end_idx = i + 1
                break

    if end_idx == -1:
        print("End of VD_RAW not found")
        return

    vd_raw_str = content[start_idx:end_idx]

    # Use regex to find vendor blocks
    vendor_pattern = re.compile(r'\{"id":(\d+),"n":"([^"]+)"(.*?)\}(?=\{|\s*\])', re.DOTALL)
    sales_pattern = re.compile(r'"sl":\{"t":([0-9.]+)\}') # Simplified sales extraction

    # Sometimes sl is like "sl":{"2021":...,"t":...}
    sales_complex_pattern = re.compile(r'"sl":\{.*?"t":([0-9.]+).*?\}')

    results = []
    for match in vendor_pattern.finditer(vd_raw_str):
        vid = match.group(1)
        name = match.group(2)
        body = match.group(3)

        sales = 0
        s_match = sales_complex_pattern.search(body)
        if s_match:
            sales = float(s_match.group(1))

        # Check if they are on Lights America
        on_la = '"lightsAm":{"v":10' in body

        results.append({
            'name': name,
            'sales': sales,
            'on_la': on_la
        })

    sorted_results = sorted(results, key=lambda x: x['sales'], reverse=True)

    print("Name, Total Sales, On LightsAm")
    for r in sorted_results[:50]:
        print(f"{r['name']}, {r['sales']}, {r['on_la']}")

if __name__ == "__main__":
    analyze_vendors_raw()
