"""Extract all tables from the PostgreSQL dump to individual CSV files."""

import re
import csv
import os
import sys

sys.stdout.reconfigure(encoding="utf-8")

DUMP_PATH = os.path.join(os.path.dirname(os.path.dirname(os.path.abspath(__file__))),
                         "Sources", "living-with-fire-dump.sql")
OUT_DIR = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))

with open(DUMP_PATH, "r", encoding="utf-8") as f:
    content = f.read()

# Extract COPY data blocks
pattern = r'COPY public\.("?\w+"?) \(([^)]+)\) FROM stdin;\n(.*?)\\\.\n'
copies = re.findall(pattern, content, re.DOTALL)

print(f"Tables found: {len(copies)}")

for table_name, columns_str, data in copies:
    table_clean = table_name.strip('"')
    columns = [c.strip().strip('"') for c in columns_str.split(",")]
    rows = data.strip().split("\n")

    csv_path = os.path.join(OUT_DIR, f"{table_clean}.csv")
    with open(csv_path, "w", newline="", encoding="utf-8") as f:
        writer = csv.writer(f)
        writer.writerow(columns)
        for row in rows:
            if row:
                fields = row.split("\t")
                # Replace PostgreSQL NULL marker with empty string
                fields = ["" if f == "\\N" else f for f in fields]
                writer.writerow(fields)

    row_count = len([r for r in rows if r])
    print(f"  {table_clean:30s} {row_count:>8,} rows  -> {table_clean}.csv ({len(columns)} cols)")

print(f"\nAll CSVs written to {OUT_DIR}")
