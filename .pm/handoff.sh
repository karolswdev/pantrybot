#!/bin/bash

# ==============================================================================
# create-ui-handoff.sh
#
# This script concatenates key project documentation into a single markdown file
# to provide comprehensive context for a UI-focused LLM agent.
#
# Usage:
#   Run from the project root directory: ./create-ui-handoff.sh
# ==============================================================================

# --- Configuration ---
set -e # Exit immediately if a command exits with a non-zero status.
OUTPUT_FILE="llm-ui-handoff.md"

# --- Helper Function ---

# Appends a file's content to the output file, wrapped in a clear
# markdown header and footer.
# Arguments:
#   $1: The path to the file to append.
append_file() {
    local file_path="$1"
    
    if [ ! -f "$file_path" ]; then
        echo "Warning: File not found, skipping: $file_path"
        return
    fi

    echo "Appending: $file_path"
    
    # Prepend a header indicating the start of the file content
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "### THIS IS \`$file_path\`" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
    
    # Append the actual file content
    cat "$file_path" >> "$OUTPUT_FILE"
    
    # Append a closing break for readability
    echo "" >> "$OUTPUT_FILE"
    echo "---" >> "$OUTPUT_FILE"
    echo "" >> "$OUTPUT_FILE"
}

# --- Main Execution ---

# 1. Initialize the output file with a master header.
echo "Initializing handoff file: $OUTPUT_FILE"
echo "# CONTEXT FOR FRIDGR FRONT-END UI ENGINEER" > "$OUTPUT_FILE"
echo "" >> "$OUTPUT_FILE"
echo "This document is a concatenation of all relevant project files required to execute the front-end development phases for the Fridgr MVP. Review all sections to understand the full scope of requirements, designs, and API contracts before beginning implementation." >> "$OUTPUT_FILE"

# 2. Define the list of primary files to include.
#    The order is intentional: from visual design and contracts to user needs and architecture.
primary_files=(
    "ui-ux-specifications.md"
    "api-specifications.md"
    "system/common/ICD.md"
    "user-stories.md"
    "system/mvp/SRS.md"
    "technical-architecture.md"
)

# 3. Append primary files to the output file.
echo ""
echo "Processing primary specification documents..."
for file in "${primary_files[@]}"; do
    append_file "$file"
done

# 4. Append all front-end execution phase plans.
#    This uses a glob pattern to find all phase files automatically.
echo ""
echo "Processing front-end execution plans..."
for file in execution-plan/front-end/phase-fe-*.md; do
    append_file "$file"
done

# 5. Finalize the script.
echo ""
echo "✅ Handoff document successfully created at '$OUTPUT_FILE'"
echo "This file contains the combined context of all specified documents."