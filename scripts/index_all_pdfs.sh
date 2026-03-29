#!/usr/bin/env bash
#
# Batch-index all PDFs in a directory using index_pdf.py.
# Usage: ./scripts/index_all_pdfs.sh [pdf_directory] [output_directory] [parallelism]
#
# Defaults:
#   pdf_directory:    knowledge-base/
#   output_directory: knowledge-base/indexes/
#   parallelism:      2 (conservative for Anthropic rate limits)
#
# Features:
#   - Logs per-PDF status (success/fail/skip) to a timestamped log file
#   - Skips PDFs that already have a corresponding JSON in the output directory
#   - Supports parallel indexing via GNU parallel, xargs, or sequential fallback
#   - Writes a manifest of all completed indexes
#   - Exits with non-zero status if any PDF failed
#
set -euo pipefail

# Resolve repo root (parent of scripts/)
REPO_ROOT="$(cd "$(dirname "$0")/.." && pwd)"
SCRIPT_DIR="$(cd "$(dirname "$0")" && pwd)"

PDF_DIR="${1:-${REPO_ROOT}/knowledge-base}"
OUTPUT_DIR="${2:-${REPO_ROOT}/knowledge-base/indexes}"
PARALLEL="${3:-2}"
LOG_DIR="${SCRIPT_DIR}/pageindex/logs"
TIMESTAMP=$(date +%Y%m%d_%H%M%S)
LOG_FILE="${LOG_DIR}/batch_index_${TIMESTAMP}.log"
MANIFEST_FILE="${OUTPUT_DIR}/manifest.json"

# Validate inputs
if [ ! -d "$PDF_DIR" ]; then
    echo "ERROR: PDF directory does not exist: $PDF_DIR" >&2
    exit 1
fi

mkdir -p "$OUTPUT_DIR" "$LOG_DIR"

# Collect all PDFs
mapfile -t PDF_FILES < <(find "$PDF_DIR" -maxdepth 1 -name "*.pdf" -type f | sort)
TOTAL=${#PDF_FILES[@]}

if [ "$TOTAL" -eq 0 ]; then
    echo "ERROR: No PDF files found in $PDF_DIR" >&2
    exit 1
fi

echo "=== Batch Indexing Started: $(date) ===" | tee "$LOG_FILE"
echo "PDF directory: $PDF_DIR" | tee -a "$LOG_FILE"
echo "Output directory: $OUTPUT_DIR" | tee -a "$LOG_FILE"
echo "Parallelism: $PARALLEL" | tee -a "$LOG_FILE"
echo "Total PDFs found: $TOTAL" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

# Count skippable PDFs first
SKIPPED=0
TO_INDEX=()
for PDF_PATH in "${PDF_FILES[@]}"; do
    PDF_NAME=$(basename "$PDF_PATH" .pdf)
    OUTPUT_FILE="${OUTPUT_DIR}/${PDF_NAME}_structure.json"
    if [ -f "$OUTPUT_FILE" ]; then
        echo "SKIP (exists): $PDF_NAME" | tee -a "$LOG_FILE"
        SKIPPED=$(( SKIPPED + 1 ))
    else
        TO_INDEX+=("$PDF_PATH")
    fi
done

REMAINING=${#TO_INDEX[@]}
echo "" | tee -a "$LOG_FILE"
echo "Skipped: $SKIPPED | To index: $REMAINING" | tee -a "$LOG_FILE"
echo "" | tee -a "$LOG_FILE"

if [ "$REMAINING" -eq 0 ]; then
    echo "All PDFs already indexed. Nothing to do." | tee -a "$LOG_FILE"
else
    # Function to index a single PDF
    export OUTPUT_DIR LOG_FILE SCRIPT_DIR
    index_one() {
        local PDF_PATH="$1"
        local PDF_NAME
        PDF_NAME=$(basename "$PDF_PATH" .pdf)
        local OUTPUT_FILE="${OUTPUT_DIR}/${PDF_NAME}_structure.json"
        local START_TIME
        START_TIME=$(date +%s)

        if python "${SCRIPT_DIR}/index_pdf.py" --pdf "$PDF_PATH" --output "$OUTPUT_DIR" 2>>"${LOG_FILE}.${PDF_NAME}" ; then
            local END_TIME
            END_TIME=$(date +%s)
            local ELAPSED=$(( END_TIME - START_TIME ))

            # Validate the JSON is parseable
            if python -c "import json, sys; json.load(open('${OUTPUT_FILE}'))" 2>/dev/null; then
                echo "OK (${ELAPSED}s): $PDF_NAME" | tee -a "$LOG_FILE"
                return 0
            else
                echo "FAIL (invalid JSON): $PDF_NAME" | tee -a "$LOG_FILE"
                rm -f "$OUTPUT_FILE"
                return 1
            fi
        else
            local END_TIME
            END_TIME=$(date +%s)
            local ELAPSED=$(( END_TIME - START_TIME ))
            echo "FAIL (${ELAPSED}s): $PDF_NAME" | tee -a "$LOG_FILE"
            return 1
        fi
    }
    export -f index_one

    if [ "$PARALLEL" -gt 1 ] && command -v parallel &>/dev/null; then
        # GNU parallel available — use it
        printf '%s\n' "${TO_INDEX[@]}" | parallel -j "$PARALLEL" --halt soon,fail=30% index_one {}
        PARALLEL_EXIT=$?
    elif [ "$PARALLEL" -gt 1 ]; then
        # Fallback: xargs-based parallelism
        printf '%s\n' "${TO_INDEX[@]}" | xargs -P "$PARALLEL" -I {} bash -c 'index_one "$@"' _ {}
        PARALLEL_EXIT=$?
    else
        # Sequential
        PARALLEL_EXIT=0
        for PDF_PATH in "${TO_INDEX[@]}"; do
            index_one "$PDF_PATH" || PARALLEL_EXIT=1
        done
    fi
fi

# Count results
SUCCEEDED=$(find "$OUTPUT_DIR" -maxdepth 1 -name "*_structure.json" -type f | wc -l)
FAILED=$(( TOTAL - SUCCEEDED ))

# Write summary
echo "" | tee -a "$LOG_FILE"
echo "=== Batch Indexing Complete: $(date) ===" | tee -a "$LOG_FILE"
echo "Succeeded (total on disk): $SUCCEEDED" | tee -a "$LOG_FILE"
echo "Missing:                   $FAILED" | tee -a "$LOG_FILE"
echo "Total PDFs:                $TOTAL" | tee -a "$LOG_FILE"

# Regenerate manifest from all index files on disk
python -c "
import json, os, glob
output_dir = '${OUTPUT_DIR}'
manifest = []
for f in sorted(glob.glob(os.path.join(output_dir, '*_structure.json'))):
    try:
        with open(f) as fh:
            data = json.load(fh)
        manifest.append({
            'file': os.path.basename(f),
            'doc_name': data.get('doc_name', ''),
            'top_level_sections': len(data.get('structure', [])),
            'size_bytes': os.path.getsize(f),
        })
    except Exception:
        pass
with open('${MANIFEST_FILE}', 'w') as fh:
    json.dump({'total': len(manifest), 'indexes': manifest}, fh, indent=2)
print(f'Manifest written: ${MANIFEST_FILE} ({len(manifest)} indexes)')
" 2>>"$LOG_FILE" | tee -a "$LOG_FILE"

# Exit with error if any missing
if [ "$FAILED" -gt 0 ]; then
    echo "" | tee -a "$LOG_FILE"
    echo "Missing indexes (re-run to retry):" | tee -a "$LOG_FILE"
    for PDF_PATH in "${PDF_FILES[@]}"; do
        PDF_NAME=$(basename "$PDF_PATH" .pdf)
        if [ ! -f "${OUTPUT_DIR}/${PDF_NAME}_structure.json" ]; then
            echo "  - $PDF_NAME" | tee -a "$LOG_FILE"
        fi
    done
    exit 1
fi
