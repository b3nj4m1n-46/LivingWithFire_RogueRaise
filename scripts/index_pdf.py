"""
CLI entry point for indexing a single PDF into a hierarchical JSON structure.

Usage:
    python scripts/index_pdf.py --pdf knowledge-base/SomeDocument.pdf
    python scripts/index_pdf.py --pdf knowledge-base/SomeDocument.pdf --output knowledge-base/indexes/

Outputs:
    - <output_dir>/<pdf_stem>_structure.json  (hierarchical index)
    - Updates <output_dir>/manifest.json with the new entry
    - Prints JSON result summary to stdout (for bridge consumption)
"""

import argparse
import json
import os
import sys

# Allow running from repo root: python scripts/index_pdf.py
sys.path.insert(0, os.path.dirname(os.path.abspath(__file__)))

from pageindex import page_index_main
from pageindex.utils import ConfigLoader


def update_manifest(output_dir: str, index_file: str, result: dict) -> int:
    """Append a new entry to manifest.json (or create it). Returns new total."""
    manifest_path = os.path.join(output_dir, "manifest.json")

    if os.path.exists(manifest_path):
        with open(manifest_path, "r", encoding="utf-8") as f:
            manifest = json.load(f)
    else:
        manifest = {"total": 0, "indexes": []}

    # Remove existing entry for this doc if re-indexing
    manifest["indexes"] = [
        entry for entry in manifest["indexes"]
        if entry["file"] != os.path.basename(index_file)
    ]

    # Add new entry
    manifest["indexes"].append({
        "file": os.path.basename(index_file),
        "doc_name": result["doc_name"],
        "top_level_sections": len(result.get("structure", [])),
        "size_bytes": os.path.getsize(index_file),
    })
    manifest["total"] = len(manifest["indexes"])

    # Sort by filename for consistent ordering
    manifest["indexes"].sort(key=lambda e: e["file"])

    with open(manifest_path, "w", encoding="utf-8") as f:
        json.dump(manifest, f, indent=2)

    return manifest["total"]


def count_nodes(structure) -> int:
    """Count total nodes in the hierarchical structure."""
    count = 0
    if isinstance(structure, list):
        for node in structure:
            count += 1
            if "nodes" in node:
                count += count_nodes(node["nodes"])
    elif isinstance(structure, dict):
        count += 1
        if "nodes" in structure:
            count += count_nodes(structure["nodes"])
    return count


def main():
    parser = argparse.ArgumentParser(description="Index a PDF into a hierarchical JSON structure")
    parser.add_argument("--pdf", required=True, help="Path to the PDF file")
    parser.add_argument("--output", default=None,
                        help="Output directory (default: knowledge-base/indexes/)")
    parser.add_argument("--model", default=None, help="Override LLM model")
    args = parser.parse_args()

    # Resolve paths
    pdf_path = os.path.abspath(args.pdf)
    if not os.path.isfile(pdf_path):
        print(json.dumps({"error": f"PDF not found: {pdf_path}"}), file=sys.stderr)
        sys.exit(1)

    # Default output dir: knowledge-base/indexes/ relative to repo root
    if args.output:
        output_dir = os.path.abspath(args.output)
    else:
        repo_root = os.path.dirname(os.path.dirname(os.path.abspath(__file__)))
        output_dir = os.path.join(repo_root, "knowledge-base", "indexes")

    os.makedirs(output_dir, exist_ok=True)

    # Build config
    user_opt = {}
    if args.model:
        user_opt["model"] = args.model
    opt = ConfigLoader().load(user_opt if user_opt else None)

    # Run indexing
    print(f"Indexing: {os.path.basename(pdf_path)}", file=sys.stderr)
    result = page_index_main(pdf_path, opt)

    # Save index
    pdf_stem = os.path.splitext(os.path.basename(pdf_path))[0]
    index_file = os.path.join(output_dir, f"{pdf_stem}_structure.json")
    with open(index_file, "w", encoding="utf-8") as f:
        json.dump(result, f, indent=2)

    # Update manifest
    new_total = update_manifest(output_dir, index_file, result)

    # Print result summary to stdout (for bridge consumption)
    summary = {
        "docName": result["doc_name"],
        "topLevelSections": len(result.get("structure", [])),
        "nodeCount": count_nodes(result.get("structure", [])),
        "indexFile": os.path.basename(index_file),
        "manifestTotal": new_total,
    }
    print(json.dumps(summary))


if __name__ == "__main__":
    main()
