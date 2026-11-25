import os
import re
import shutil
import zipfile

with open(r"d:\token-mark1\tokenos_report_single.tex", "r", encoding="utf-8") as f:
    text = f.read()

# 1. Preamble replacement
doc_start = text.find(r"\documentclass")
body_start = text.find(r"\begin{document}")

new_preamble = r"""\documentclass[11pt,a4paper,oneside]{report}

% -------------------------------------------------------------------------
% Academic Typography, Fast Fonts & Page Layout Standards (Target <= 52 Pages)
% -------------------------------------------------------------------------
\usepackage[utf8]{inputenc}
\usepackage[T1]{fontenc}
\usepackage{mathptmx} % Standard Times New Roman typography for academic thesis
\usepackage{geometry}
\geometry{
    top=0.72in,
    bottom=0.72in,
    left=0.95in, % Standard binding margin
    right=0.72in
}
\usepackage{setspace}
\setstretch{1.10} % Optimal 1.10 line spacing: compact & highly readable
\usepackage{microtype} % Prevents bad line breaks and overfull boxes

% -------------------------------------------------------------------------
% Mathematical, Tabular, and Graphic Packages
% -------------------------------------------------------------------------
\usepackage{graphicx}
\usepackage{float}
\usepackage{amsmath,amssymb,amsfonts}
\usepackage{booktabs}
\usepackage{array}
\usepackage{tabularx}
\usepackage{longtable}
\usepackage{multirow}
\usepackage{enumitem}
\setlist{topsep=1.5pt, itemsep=0.5pt, parsep=0pt, partopsep=0pt}
\setlength{\parindent}{1.5em}
\setlength{\parskip}{0pt}

% Float placement optimization: allow multiple figures and text per page
\renewcommand{\topfraction}{0.92}
\renewcommand{\bottomfraction}{0.92}
\renewcommand{\textfraction}{0.08}
\renewcommand{\floatpagefraction}{0.80}
\setlength{\floatsep}{5pt plus 2pt minus 1pt}
\setlength{\textfloatsep}{7pt plus 2pt minus 2pt}
\setlength{\intextsep}{5pt plus 2pt minus 1pt}
\renewcommand{\arraystretch}{1.02}

% -------------------------------------------------------------------------
% Fast Native TikZ Charting Engine (Lightweight, No PGFPlots Overhead)
% -------------------------------------------------------------------------
\usepackage{tikz}
\usetikzlibrary{shapes.geometric, arrows, positioning, fit, calc, backgrounds, matrix}

% -------------------------------------------------------------------------
% Color Palette Matching TokenOS Engineering Architecture
% -------------------------------------------------------------------------
\usepackage{xcolor}
\definecolor{tokenosOrange}{RGB}{217, 119, 87}
\definecolor{tokenosDark}{RGB}{15, 23, 42}
\definecolor{tokenosEmerald}{RGB}{16, 185, 129}
\definecolor{tokenosRed}{RGB}{239, 68, 68}
\definecolor{slateGray}{RGB}{100, 116, 139}

% -------------------------------------------------------------------------
% Code Listing Environment Setup (with JSON Definition)
% -------------------------------------------------------------------------
\usepackage{listings}
\lstdefinelanguage{json}{
    basicstyle=\ttfamily\scriptsize,
    showstringspaces=false,
    breaklines=true,
    frame=single
}
\lstset{
    basicstyle=\ttfamily\scriptsize,
    keywordstyle=\color{blue}\bfseries,
    stringstyle=\color{tokenosOrange},
    commentstyle=\color{slateGray}\textit,
    numbers=left,
    numberstyle=\tiny\color{slateGray},
    stepnumber=1,
    numbersep=5pt,
    showstringspaces=false,
    breaklines=true,
    frame=single,
    rulecolor=\color{black!30},
    backgroundcolor=\color{black!2},
    tabsize=2,
    aboveskip=4pt,
    belowskip=4pt
}

% -------------------------------------------------------------------------
% Running Headers & Footers
% -------------------------------------------------------------------------
\usepackage{fancyhdr}
\pagestyle{fancy}
\fancyhf{}
\fancyhead[L]{\fontsize{8.5}{10}\selectfont\textit{TokenOS: Intent-Aware AI Execution Control Platform}}
\fancyhead[R]{\fontsize{8.5}{10}\selectfont\textit{ADCET, Ashta}}
\fancyfoot[C]{\fontsize{9}{11}\selectfont\thepage}
\renewcommand{\headrulewidth}{0.4pt}
\renewcommand{\footrulewidth}{0.4pt}

\fancypagestyle{plain}{
    \fancyhf{}
    \fancyfoot[C]{\fontsize{9}{11}\selectfont\thepage}
    \renewcommand{\headrulewidth}{0pt}
    \renewcommand{\footrulewidth}{0.4pt}
}

% -------------------------------------------------------------------------
% Chapter and Section Heading Styling (Compact)
% -------------------------------------------------------------------------
\usepackage{titlesec}
\titleformat{\chapter}[display]
  {\normalfont\large\bfseries\centering}
  {\fontsize{12}{14}\selectfont\bfseries Chapter -- 0\thechapter}
  {2pt}
  {\Large\bfseries}
\titlespacing*{\chapter}{0pt}{-25pt}{12pt}

\titleformat{name=\chapter,numberless}[hang]
  {\normalfont\Large\bfseries\centering}
  {}{0pt}{\Large\bfseries}
\titlespacing*{name=\chapter,numberless}{0pt}{-20pt}{12pt}

\titleformat{\section}{\normalfont\large\bfseries}{\thesection}{0.8em}{}
\titleformat{\subsection}{\normalfont\normalsize\bfseries}{\thesubsection}{0.8em}{}
\titleformat{\subsubsection}{\normalfont\small\bfseries}{\thesubsubsection}{0.8em}{}

\titlespacing*{\section}{0pt}{7pt plus 2pt minus 1pt}{2pt plus 1pt minus 1pt}
\titlespacing*{\subsection}{0pt}{5pt plus 1pt minus 1pt}{2pt plus 1pt minus 1pt}
\titlespacing*{\subsubsection}{0pt}{4pt plus 1pt minus 1pt}{1pt plus 1pt minus 1pt}

% -------------------------------------------------------------------------
% Table of Contents Formatting & Citations
% -------------------------------------------------------------------------
\usepackage{tocloft}
\setlength{\cftbeforechapskip}{1.5pt}
\setlength{\cftbeforesecskip}{0.5pt}
\setlength{\cftbeforesubsecskip}{0pt}
\setlength{\cftbeforefigskip}{1pt}
\setlength{\cftbeforetabskip}{1pt}
\usepackage{cite}

% -------------------------------------------------------------------------
% Hyperlink Configuration
% -------------------------------------------------------------------------
\usepackage[hidelinks,pdfa]{hyperref}
\hypersetup{
    pdftitle={TOKENOS: Intent-Aware AI Execution Control Platform},
    pdfauthor={Prajwal Kole, Rupesh Gurav, Anannya Borkar, Farhan Ibushe},
    pdfsubject={B.Tech Final Year Computer Science and Engineering Project Report},
    pdfkeywords={TokenOS, LLM, Intent Contract, AST Pruning, Multi-Model Routing, Quality Gate, IPAR}
}
"""

body = text[body_start:]

# Title page part
title_idx = body.find(r"\end{titlepage}")
title_part = body[:title_idx]
rest_body = body[title_idx:]

# In rest_body, replace [H] with [!htbp] for figures and tables
rest_body = rest_body.replace(r"\begin{figure}[H]", r"\begin{figure}[!htbp]")
rest_body = rest_body.replace(r"\begin{table}[H]", r"\begin{table}[!htbp]")

# Replace large figure widths with compact heights
for scr in ["dashboard.png", "workbench.png", "execution_control.png", "verification.png", "refinement.png", "analytics.png", "anomaly_detection.png"]:
    pattern = rf"\\includegraphics\[[^\]]+\]\{{figures/{re.escape(scr)}\}}"
    repl = rf"\\includegraphics[width=0.68\\textwidth, height=4.3cm, keepaspectratio]{{figures/{scr}}}"
    rest_body = re.sub(pattern, lambda m, r=repl: r, rest_body)

for diag in ["architecture.png", "workflow.png", "intent_contract_flow.png", "policy_decision_pipeline.png", "model_provider_selection.png", "mcp_tool_execution.png", "verification_evidence_pipeline.png", "adaptive_refinement_loop.png", "database_schema.png", "frontend_backend_interaction.png", "ml_anomaly_pipeline.png"]:
    pattern = rf"\\includegraphics\[[^\]]+\]\{{figures/{re.escape(diag)}\}}"
    repl = rf"\\includegraphics[width=0.68\\textwidth, height=4.8cm, keepaspectratio]{{figures/{diag}}}"
    rest_body = re.sub(pattern, lambda m, r=repl: r, rest_body)

# Replace the 4 PGFPlots graphs with lightweight native TikZ (scale=0.80)
g1_pattern = r"\\begin\{figure\}\[!htbp\]\s*\\centering\s*\\begin\{tikzpicture\}\s*\\begin\{axis\}\[\s*width=0\.88\\textwidth.*?\\end\{axis\}\s*\\end\{tikzpicture\}\s*\\caption\{Comparative Scaling of Input Token Context: Unoptimized Baseline vs\. TokenOS AST Pruning\.\}\s*\\label\{fig:token_growth_curve\}\s*\\end\{figure\}"

g1_replacement = r"""\begin{figure}[!htbp]
\centering
\begin{tikzpicture}[scale=0.80]
    \draw[->, thick] (0,0) -- (8.5,0) node[below right, font=\scriptsize] {\textbf{Input Context (Tokens)}};
    \draw[->, thick] (0,0) -- (0,5.2) node[above left, font=\scriptsize] {\textbf{Total Processed Tokens}};
    \draw[help lines, color=gray!25] (0,0) grid (8,4.8);
    
    \foreach \x/\val in {0.8/1k, 2.0/2k, 4.0/4k, 8.0/8k}
        \draw (\x,1pt) -- (\x,-2pt) node[below, font=\tiny] {\val};
    \foreach \y/\val in {1.0/5k, 2.0/10k, 4.8/25k}
        \draw (1pt,\y) -- (-2pt,\y) node[left, font=\tiny] {\val};

    % Unoptimized Baseline (Red)
    \draw[thick, red!70!black, mark=square*, mark size=1.8pt] 
        plot coordinates {(0.2,0.08) (0.5,0.22) (1.0,0.49) (2.0,1.04) (4.0,2.24) (8.0,4.80)};
    
    % TokenOS AST Pruned (Blue)
    \draw[thick, blue!70!black, mark=triangle*, mark size=2.2pt] 
        plot coordinates {(0.2,0.04) (0.5,0.08) (1.0,0.16) (2.0,0.33) (4.0,0.62) (8.0,1.18)};

    % Legend
    \node[draw=black!50, fill=white, font=\tiny, anchor=north west] at (0.3,5.0) {
        \begin{tabular}{ll}
            \textcolor{red!70!black}{$\blacksquare$} & Unoptimized Baseline (Raw Context) \\
            \textcolor{blue!70!black}{$\blacktriangle$} & TokenOS AST Pruned (Mean 68.4\% Savings)
        \end{tabular}
    };
\end{tikzpicture}
\caption{Comparative Scaling of Input Token Context: Unoptimized Baseline vs. TokenOS AST Pruning.}
\label{fig:token_growth_curve}
\end{figure}"""

rest_body = re.sub(g1_pattern, lambda m: g1_replacement, rest_body, flags=re.DOTALL)

g2_pattern = r"\\begin\{figure\}\[!htbp\]\s*\\centering\s*\\begin\{tikzpicture\}\s*\\begin\{axis\}\[\s*width=0\.85\\textwidth.*?\\end\{axis\}\s*\\end\{tikzpicture\}\s*\\caption\{Token Compression Percentage by Context Window Size\.\}\s*\\label\{fig:token_reduction_bar\}\s*\\end\{figure\}"

g2_replacement = r"""\begin{figure}[!htbp]
\centering
\begin{tikzpicture}[scale=0.80]
    \draw[->, thick] (0,0) -- (7.8,0) node[below right, font=\scriptsize] {\textbf{Context Category}};
    \draw[->, thick] (0,0) -- (0,5.0) node[above left, font=\scriptsize] {\textbf{Reduction (\%)}};
    \draw[help lines, color=gray!25] (0,0) grid (7.5,4.6);

    \foreach \i/\label/\val in {1/200/57.1, 2/500/62.7, 3/1000/66.5, 4/2000/68.5, 5/4000/72.3, 6/8000/75.9, 7/Mean/68.4} {
        \pgfmathsetmacro{\h}{(\val - 40)*0.11}
        \draw[fill=blue!60, draw=blue!80!black] (\i-0.28,0) rectangle (\i+0.28,\h);
        \node[above, font=\tiny] at (\i,\h) {\val\%};
        \node[below, font=\tiny] at (\i,0) {\label};
    }
\end{tikzpicture}
\caption{Token Compression Percentage by Context Window Size.}
\label{fig:token_reduction_bar}
\end{figure}"""

rest_body = re.sub(g2_pattern, lambda m: g2_replacement, rest_body, flags=re.DOTALL)

g3_pattern = r"\\begin\{figure\}\[!htbp\]\s*\\centering\s*\\begin\{tikzpicture\}\s*\\begin\{axis\}\[\s*width=0\.88\\textwidth.*?\\end\{axis\}\s*\\end\{tikzpicture\}\s*\\caption\{Benchmarked Median Response Latency Across Multi-Model Providers\.\}\s*\\label\{fig:latency_horizontal_bar\}\s*\\end\{figure\}"

g3_replacement = r"""\begin{figure}[!htbp]
\centering
\begin{tikzpicture}[scale=0.80]
    \draw[->, thick] (0,0) -- (8.8,0) node[right, font=\scriptsize] {\textbf{Median Latency P50 (ms)}};
    \draw[->, thick] (0,0) -- (0,6.6);
    \draw[help lines, color=gray!25] (0,0) grid (8.2,6.2);

    \foreach \y/\name/\val/\vlabel in {
        1/Local Ollama 7B/1.0/180 ms,
        2/Groq Llama 3.3 70B/1.22/220 ms,
        3/NVIDIA NIM Nemotron/2.28/410 ms,
        4/Google Gemini 3.5 Flash/2.33/420 ms,
        5/OpenRouter DeepSeek R1/3.61/650 ms,
        6/Frontier GPT-4o/8.05/1450 ms
    } {
        \draw[fill=orange!70!red, draw=orange!90!black] (0,\y-0.25) rectangle (\val,\y+0.25);
        \node[left, font=\tiny] at (0,\y) {\name};
        \node[right, font=\tiny] at (\val,\y) {\vlabel};
    }
\end{tikzpicture}
\caption{Benchmarked Median Response Latency Across Multi-Model Providers.}
\label{fig:latency_horizontal_bar}
\end{figure}"""

rest_body = re.sub(g3_pattern, lambda m: g3_replacement, rest_body, flags=re.DOTALL)

g4_pattern = r"\\begin\{figure\}\[!htbp\]\s*\\centering\s*\\begin\{tikzpicture\}\s*\\begin\{axis\}\[\s*width=0\.88\\textwidth.*?\\end\{axis\}\s*\\end\{tikzpicture\}\s*\\caption\{Quality Gate Performance Metrics Across 500 Empirical Verification Trials\.\}\s*\\label\{fig:quality_metrics_chart\}\s*\\end\{figure\}"

g4_replacement = r"""\begin{figure}[!htbp]
\centering
\begin{tikzpicture}[scale=0.80]
    \draw[->, thick] (0,0) -- (7.2,0) node[below right, font=\scriptsize] {\textbf{Evaluation Metric}};
    \draw[->, thick] (0,0) -- (0,5.0) node[above left, font=\scriptsize] {\textbf{Score (\%)}};
    \draw[help lines, color=gray!25] (0,0) grid (6.8,4.6);

    \foreach \i/\label/\val in {1/Accuracy/95.20, 2/Precision/96.07, 3/Recall/97.16, 4/Specificity/90.54, 5/F1-Score/96.61, 6/ROC-AUC/97.20} {
        \pgfmathsetmacro{\h}{(\val - 80)*0.23}
        \draw[fill=green!60!black, draw=green!80!black] (\i-0.25,0) rectangle (\i+0.25,\h);
        \node[above, font=\tiny] at (\i,\h) {\val\%};
        \node[below, font=\tiny, rotate=25, anchor=north east] at (\i,0) {\label};
    }
\end{tikzpicture}
\caption{Quality Gate Performance Metrics Across 500 Empirical Verification Trials.}
\label{fig:quality_metrics_chart}
\end{figure}"""

rest_body = re.sub(g4_pattern, lambda m: g4_replacement, rest_body, flags=re.DOTALL)

# Adjust Confusion Matrix TikZ scale
rest_body = rest_body.replace(r"\begin{tikzpicture}[", r"\begin{tikzpicture}[scale=0.80, transform shape, ")

# Preliminary spacing cleanups
rest_body = rest_body.replace("thresholds.\\\\[1.2cm]", "thresholds.\\par\\vspace{0.6cm}")
rest_body = rest_body.replace("/ 2026\\\\[1.5cm]", "/ 2026\\par\\vspace{0.6cm}")
rest_body = rest_body.replace("the bibliography.\\\\[1.0cm]", "the bibliography.\\par\\vspace{0.6cm}")
rest_body = rest_body.replace("engineering undertaking.\\\\[1.5cm]", "engineering undertaking.\\par\\vspace{0.6cm}")
rest_body = rest_body.replace("contract governance.\\\\[0.6cm]", "contract governance.\\par\\vspace{0.3cm}")

# Compact bibliography
rest_body = rest_body.replace(
    "\\bibliographystyle{IEEEtran}\n\\bibliography{references}",
    "\\begingroup\n\\small\n\\setlength{\\itemsep}{0pt plus 1pt}\n\\bibliographystyle{IEEEtran}\n\\bibliography{references}\n\\endgroup"
)

final_tex = text[:doc_start] + new_preamble + title_part + rest_body

output_dir = r"d:\token-mark1\tokenos_single_file_report"
single_main_path = os.path.join(output_dir, "main.tex")
with open(single_main_path, "w", encoding="utf-8") as f:
    f.write(final_tex)

# Rebuild single code report zip
zip_path = r"d:\token-mark1\tokenos_single_code_report.zip"
if os.path.exists(zip_path):
    os.remove(zip_path)

with zipfile.ZipFile(zip_path, "w", zipfile.ZIP_DEFLATED) as zipf:
    zipf.write(single_main_path, arcname="main.tex")
    zipf.write(os.path.join(output_dir, "references.bib"), arcname="references.bib")
    figures_dir = os.path.join(output_dir, "figures")
    for root, dirs, files in os.walk(figures_dir):
        for file in files:
            full_path = os.path.join(root, file)
            rel_path = os.path.relpath(full_path, output_dir)
            zipf.write(full_path, arcname=rel_path)

# Also update tokenos_report_single.tex
with open(r"d:\token-mark1\tokenos_report_single.tex", "w", encoding="utf-8") as f:
    f.write(final_tex)

print("Success! Generated compact main.tex and rebuilt zip.")
print("main.tex size:", os.path.getsize(single_main_path), "bytes, lines:", len(final_tex.splitlines()))
print("zip size:", os.path.getsize(zip_path), "bytes")
