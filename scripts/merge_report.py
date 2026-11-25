import os
import re
import shutil
import zipfile

report_dir = r"d:\token-mark1\tokenos_report"
output_dir = r"d:\token-mark1\tokenos_single_file_report"
zip_path = r"d:\token-mark1\tokenos_single_code_report.zip"

if os.path.exists(output_dir):
    shutil.rmtree(output_dir)
os.makedirs(output_dir)

# Read main.tex
with open(os.path.join(report_dir, "main.tex"), "r", encoding="utf-8") as f:
    main_content = f.read()

# Read references.bib
with open(os.path.join(report_dir, "references.bib"), "r", encoding="utf-8") as f:
    bib_content = f.read()

# Files to inline in order of appearance
inputs = [
    "chapters/preliminary.tex",
    "chapters/chapter1_introduction.tex",
    "chapters/chapter2_literature_review.tex",
    "chapters/chapter3_project_feasibility.tex",
    "chapters/chapter4_system_design_and_methodology.tex",
    "chapters/chapter5_facilities_required.tex",
    "chapters/chapter6_project_timeline.tex",
    "chapters/chapter7_results_and_output.tex",
    "chapters/chapter8_conclusion_and_future_scope.tex",
    "chapters/author_biography.tex",
    "chapters/annexure.tex"
]

# We will inline references.bib using filecontents* at the very top of main.tex
# and also replace each \input{...} with its exact raw content without altering any code.
filecontents_header = "% =========================================================================\n" \
                      "% EMBEDDED BIBLIOGRAPHY (Overleaf / LaTeX standalone self-generation)\n" \
                      "% =========================================================================\n" \
                      "\\begin{filecontents*}{references.bib}\n" + \
                      bib_content.strip() + "\n" + \
                      "\\end{filecontents*}\n\n"

merged = filecontents_header + main_content

for inp in inputs:
    p = os.path.join(report_dir, inp)
    with open(p, "r", encoding="utf-8") as f:
        c = f.read()
    pattern = rf"\\input\{{{re.escape(inp)}\}}"
    if not re.search(pattern, merged):
        raise ValueError(f"Pattern {pattern} not found in main.tex!")
    header = f"% =========================================================================\n" \
             f"% INLINED SOURCE: {inp}\n" \
             f"% =========================================================================\n"
    merged = re.sub(pattern, lambda m, h=header, body=c: h + body, merged, count=1)

# Verify no remaining \input statements
remaining_inputs = re.findall(r"\\input\{([^}]+)\}", merged)
if remaining_inputs:
    print("Warning: remaining inputs found:", remaining_inputs)
else:
    print("Verification passed: All \\input statements have been replaced!")

# Write merged main.tex
single_main_path = os.path.join(output_dir, "main.tex")
with open(single_main_path, "w", encoding="utf-8") as f:
    f.write(merged)

# Copy figures folder
shutil.copytree(os.path.join(report_dir, "figures"), os.path.join(output_dir, "figures"))

# Also copy references.bib to output directory for maximum compatibility
shutil.copy(os.path.join(report_dir, "references.bib"), os.path.join(output_dir, "references.bib"))

# Create the zip file
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    # Add main.tex
    zipf.write(single_main_path, arcname="main.tex")
    # Add references.bib
    zipf.write(os.path.join(output_dir, "references.bib"), arcname="references.bib")
    # Add figures/
    figures_dir = os.path.join(output_dir, "figures")
    for root, dirs, files in os.walk(figures_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, output_dir)
            zipf.write(full_path, arcname=rel_path)

print("Zip file successfully created at:", zip_path)
print("Zip file size in bytes:", os.path.getsize(zip_path))
print("Listing files inside zip:")
with zipfile.ZipFile(zip_path, "r") as zipf:
    for info in zipf.infolist():
        print(f"  {info.filename} ({info.file_size} bytes)")
