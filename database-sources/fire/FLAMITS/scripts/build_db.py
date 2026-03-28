"""
Import FLAMITS CSV files into a SQLite database for easier querying.

Source: Ocampo-Zuleta, Korina; Pausas, Juli G.; Paula, Susana (2023).
        FLAMITS: FLAMmability plant traiTS database [Dataset]. Dryad.
        https://doi.org/10.5061/dryad.h18931zr3

CSVs are semicolon-delimited.
"""

import csv
import os
import sqlite3

SCRIPT_DIR = os.path.dirname(os.path.abspath(__file__))
DATA_DIR = os.path.dirname(SCRIPT_DIR)
SOURCES_DIR = os.path.join(DATA_DIR, "Sources")


def import_csv(cur, table_name, csv_path):
    """Import a semicolon-delimited CSV into a SQLite table."""
    with open(csv_path, "r", encoding="latin-1") as f:
        reader = csv.reader(f, delimiter=";")
        headers = next(reader)
        # Clean header names (remove spaces, lowercase)
        clean_headers = [h.strip().replace(" ", "_").lower() for h in headers]

        # Create table
        cols = ", ".join(f'"{h}" TEXT' for h in clean_headers)
        cur.execute(f"DROP TABLE IF EXISTS {table_name}")
        cur.execute(f"CREATE TABLE {table_name} ({cols})")

        # Insert rows
        placeholders = ", ".join("?" for _ in clean_headers)
        num_cols = len(clean_headers)
        rows = 0
        for row in reader:
            # Pad or truncate to match column count
            if len(row) < num_cols:
                row.extend([""] * (num_cols - len(row)))
            elif len(row) > num_cols:
                row = row[:num_cols]
            cur.execute(f"INSERT INTO {table_name} VALUES ({placeholders})", row)
            rows += 1

    return clean_headers, rows


def main():
    db_path = os.path.join(DATA_DIR, "flamits.db")
    if os.path.exists(db_path):
        os.remove(db_path)

    conn = sqlite3.connect(db_path)
    cur = conn.cursor()

    files = {
        "data": "data_file.csv",
        "taxon": "taxon_file.csv",
        "site": "site_file.csv",
        "source": "source_file.csv",
        "synonymy": "synonymy__file.csv",
    }

    for table_name, filename in files.items():
        csv_path = os.path.join(SOURCES_DIR, filename)
        headers, rows = import_csv(cur, table_name, csv_path)
        print(f"{table_name}: {rows} rows, {len(headers)} columns")
        print(f"  Columns: {', '.join(headers[:10])}{'...' if len(headers) > 10 else ''}")

    # Add indexes for common queries
    cur.execute("CREATE INDEX idx_data_taxon ON data(taxon_name)")
    cur.execute("CREATE INDEX idx_data_var ON data(var_name)")
    cur.execute("CREATE INDEX idx_data_flam ON data(flam_dimension)")
    cur.execute("CREATE INDEX idx_taxon_family ON taxon(family)")
    cur.execute("CREATE INDEX idx_taxon_genus ON taxon(genus)")
    cur.execute("CREATE INDEX idx_taxon_species ON taxon(species)")

    conn.commit()

    # Summary stats
    print("\n--- Summary ---")
    cur.execute("SELECT COUNT(DISTINCT taxon_name) FROM data")
    print(f"Unique taxa in data: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(DISTINCT family) FROM taxon")
    print(f"Families: {cur.fetchone()[0]}")

    cur.execute("SELECT COUNT(DISTINCT genus) FROM taxon")
    print(f"Genera: {cur.fetchone()[0]}")

    cur.execute("SELECT flam_dimension, COUNT(*) FROM data GROUP BY flam_dimension ORDER BY COUNT(*) DESC")
    print("\nFlammability dimensions:")
    for dim, count in cur.fetchall():
        print(f"  {dim}: {count}")

    cur.execute("SELECT var_name, COUNT(*) FROM data GROUP BY var_name ORDER BY COUNT(*) DESC LIMIT 15")
    print("\nTop 15 variables measured:")
    for var, count in cur.fetchall():
        print(f"  {var}: {count}")

    cur.execute("SELECT growth_form, COUNT(*) FROM taxon WHERE growth_form != '' GROUP BY growth_form ORDER BY COUNT(*) DESC")
    print("\nGrowth forms:")
    for gf, count in cur.fetchall():
        print(f"  {gf}: {count}")

    conn.close()
    print(f"\nWrote {db_path}")


if __name__ == "__main__":
    main()
