"""
TokenOS Blackbook Visual Reconstruction Engine
Generates publication-quality, readable, editable vector diagrams for all 13 core technical figures.
Removes conflicting embedded titles, eliminates text/arrow collisions, and ensures clean vector PDF output.
"""

import os
import subprocess
import shutil
import sys

sys.stdout.reconfigure(encoding='utf-8')

SOURCE_DIR = r"D:\token-mark1\reports\TokenOS_Blackbook\04_DIAGRAMS\source"
RENDERED_DIR = r"D:\token-mark1\reports\TokenOS_Blackbook\04_DIAGRAMS\rendered"
LATEX_FIG_DIR = r"D:\token-mark1\reports\TokenOS_Blackbook\05_LATEX\figures"

os.makedirs(SOURCE_DIR, exist_ok=True)
os.makedirs(RENDERED_DIR, exist_ok=True)
os.makedirs(LATEX_FIG_DIR, exist_ok=True)

diagrams = {}

# =============================================================================
# FIGURE 4.1: Proposed Methodology Flowchart (11-Stage Governed Pipeline)
# =============================================================================
diagrams["diagram_01_methodology_block.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes.geometric,arrows.meta,positioning,fit,backgrounds,shadows}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\definecolor{lightslate}{RGB}{248,250,252}
\definecolor{borderblue}{RGB}{2,132,199}
\definecolor{bgblue}{RGB}{240,249,255}
\definecolor{borderamber}{RGB}{217,119,6}
\definecolor{bgamber}{RGB}{254,243,199}
\definecolor{bordergreen}{RGB}{22,163,74}
\definecolor{bggreen}{RGB}{240,253,244}
\definecolor{borderrose}{RGB}{225,29,72}
\definecolor{bgrose}{RGB}{255,241,242}
\definecolor{borderpurple}{RGB}{147,51,234}
\definecolor{bgpurple}{RGB}{250,245,255}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    node distance=0.8cm and 0.8cm,
    stepbox/.style 2 args={
        rectangle, draw=#1, line width=1.2pt, fill=#2,
        rounded corners=5pt, align=center, inner sep=6pt,
        minimum width=3.4cm, minimum height=1.5cm,
        font=\fontsize{8.5}{11}\selectfont
    },
    stepnum/.style={
        circle, fill=#1, text=white, font=\bfseries\scriptsize,
        inner sep=2pt, minimum size=0.55cm
    },
    arr/.style={-{Stealth[length=2.5mm]}, line width=1.1pt, draw=darkslate},
    condarr/.style={-{Stealth[length=2.5mm]}, line width=1.1pt, draw=borderrose, dashed}
]

    % Row 1: Stages 1 to 4
    \node[stepbox={borderblue}{bgblue}] (s1) {
        \textbf{1. Intent Compilation}\\[2pt]
        \scriptsize Deconstruct prompt to\\
        \scriptsize typed IntentContract
    };

    \node[stepbox={borderamber}{bgamber}, right=0.9cm of s1] (s2) {
        \textbf{2. Policy Evaluation}\\[2pt]
        \scriptsize Pre-flight budget gating\\
        \scriptsize ($C_{\max} \le \$0.05, L_{\max} \le 5\text{s}$)
    };

    \node[stepbox={bordergreen}{bggreen}, right=0.9cm of s2] (s3) {
        \textbf{3. Context Pruning}\\[2pt]
        \scriptsize AST redundancy removal\\
        \scriptsize \textbf{--68.4\% Token Savings}
    };

    \node[stepbox={borderpurple}{bgpurple}, right=0.9cm of s3] (s4) {
        \textbf{4. Prompt Lab}\\[2pt]
        \scriptsize 3-stage prompt diffing:\\
        \scriptsize Raw $\to$ Schema $\to$ Pruned
    };

    % Row 2: Stages 5 to 8 (Reversed or right-to-left layout for clean wrap)
    \node[stepbox={borderblue}{bgblue}, below=1.3cm of s4] (s5) {
        \textbf{5. Model Selection}\\[2pt]
        \scriptsize Multi-criteria router\\
        \scriptsize ($U = \alpha Q - \beta C - \gamma L$)
    };

    \node[stepbox={bordergreen}{bggreen}, left=0.9cm of s5] (s6) {
        \textbf{6. Streaming Inference}\\[2pt]
        \scriptsize Async token chunking\\
        \scriptsize (Ollama / Groq / Gemini)
    };

    \node[stepbox={borderamber}{bgamber}, left=0.9cm of s6] (s7) {
        \textbf{7. MCP Tool Hub}\\[2pt]
        \scriptsize Sandboxed tools \&\\
        \scriptsize JSON-RPC execution
    };

    \node[stepbox={borderpurple}{bgpurple}, left=0.9cm of s7] (s8) {
        \textbf{8. Quality Gate}\\[2pt]
        \scriptsize 6-state Evidence Ledger\\
        \scriptsize ($Q_{\text{gate}}$ score evaluation)
    };

    % Row 3: Stages 9 to 11
    \node[stepbox={borderrose}{bgrose}, below=1.3cm of s8] (s9) {
        \textbf{9. IPAR Self-Repair}\\[2pt]
        \scriptsize Targeted AST diff patch\\
        \scriptsize (490 tok, \textbf{96.8\% PRPR})
    };

    \node[stepbox={borderblue}{bgblue}, right=0.9cm of s9] (s10) {
        \textbf{10. Telemetry \& Audit}\\[2pt]
        \scriptsize Rolling Z-score anomaly\\
        \scriptsize \& token provenance tags
    };

    \node[stepbox={bordergreen}{bggreen}, right=0.9cm of s10] (s11) {
        \textbf{11. Final Response}\\[2pt]
        \scriptsize Verified code delivery\\
        \scriptsize \& Supabase RLS sync
    };

    % External Start and End
    \node[circle, draw=darkslate, line width=1.5pt, fill=white, left=0.8cm of s1, align=center, font=\scriptsize\bfseries] (start) {User\\Input};
    \node[double, circle, draw=darkslate, line width=1.5pt, fill=darkslate, text=white, right=0.9cm of s11, align=center, font=\scriptsize\bfseries] (end) {Verified\\Output};

    % Connections Row 1
    \draw[arr] (start) -- (s1);
    \draw[arr] (s1) -- (s2);
    \draw[arr] (s2) -- (s3);
    \draw[arr] (s3) -- (s4);

    % Connect Row 1 to Row 2
    \draw[arr] (s4.south) -- (s5.north);

    % Connections Row 2
    \draw[arr] (s5) -- (s6);
    \draw[arr] (s6) -- (s7);
    \draw[arr] (s7) -- (s8);

    % Connect Row 2 to Row 3 (Conditional vs Direct)
    \draw[condarr] (s8.south) -- node[left, font=\scriptsize\bfseries, text=borderrose] {Gaps ($Q < 85$)} (s9.north);
    \draw[arr] (s8.south east) -- node[above, sloped, font=\scriptsize\bfseries, text=bordergreen] {Pass ($Q \ge 85$)} (s10.north west);

    % Connect Row 3
    \draw[arr] (s9) -- node[above, font=\scriptsize] {Patch Applied} (s10);
    \draw[arr] (s10) -- (s11);
    \draw[arr] (s11) -- (end);

    % Legend Box
    \node[rectangle, draw=darkslate!40, fill=white, rounded corners=3pt, inner sep=5pt, font=\scriptsize, anchor=north west] at (s11.south west |- 0,-4.5) (legend) {
        \textbf{Legend:} \quad
        \tikz\draw[-{Stealth[length=2mm]}, line width=1pt, draw=darkslate] (0,0) -- (0.6,0); Standard Sequential Flow \quad
        \tikz\draw[-{Stealth[length=2mm]}, line width=1pt, draw=borderrose, dashed] (0,0) -- (0.6,0); Conditional IPAR Self-Repair
    };

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.2: Layered System Architecture of TokenOS
# =============================================================================
diagrams["diagram_02_system_architecture.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{c1}{RGB}{240,249,255}
\definecolor{b1}{RGB}{2,132,199}
\definecolor{c2}{RGB}{254,243,199}
\definecolor{b2}{RGB}{217,119,6}
\definecolor{c3}{RGB}{255,241,242}
\definecolor{b3}{RGB}{225,29,72}
\definecolor{c4}{RGB}{240,253,244}
\definecolor{b4}{RGB}{22,163,74}
\definecolor{c5}{RGB}{250,245,255}
\definecolor{b5}{RGB}{147,51,234}
\definecolor{darkslate}{RGB}{15,23,42}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    layer/.style 2 args={rectangle, draw=#1, line width=1.4pt, fill=#2, rounded corners=6pt, inner sep=7pt},
    comp/.style={rectangle, draw=#1, line width=0.9pt, fill=white, rounded corners=3pt, align=center, inner sep=4pt, font=\fontsize{7.8}{10}\selectfont},
    title/.style={font=\bfseries\footnotesize, text=darkslate}
]

    % Layer 1: Presentation & Reactive Studio
    \node[comp=b1] (w1) {Workbench Intent\\Contract Editor};
    \node[comp=b1, right=0.25cm of w1] (w2) {Execution Telemetry\\Stepper \& Clocks};
    \node[comp=b1, right=0.25cm of w2] (w3) {Quality Gate \&\\Evidence Ledger};
    \node[comp=b1, right=0.25cm of w3] (w4) {IPAR Refinement\\\& Self-Repair};
    \node[comp=b1, right=0.25cm of w4] (w5) {Observability \&\\Trace Insights};
    \node[layer={b1}{c1}, fit=(w1) (w2) (w3) (w4) (w5), label={[title]above:Layer 1: Presentation \& Reactive UI (React 18 + Vite 5 + Tailwind CSS)}] (l1) {};

    % Layer 2: Client-Side Security Guard
    \node[comp=b2, below=0.75cm of w1] (s1) {Sliding-Window Rate\\Limiter (60s Lockout)};
    \node[comp=b2, right=0.45cm of s1] (s2) {Honeypot Bot\\Trap Detector};
    \node[comp=b2, right=0.45cm of s2] (s3) {Password Entropy\\Policy Evaluator};
    \node[comp=b2, right=0.45cm of s3] (s4) {Client Key Vault\\(Master PIN / PBKDF2)};
    \node[layer={b2}{c2}, fit=(s1) (s2) (s3) (s4), label={[title]above:Layer 2: Zero-Trust Client Defense \& Cryptographic Key Vault}] (l2) {};

    % Layer 3: Pre-Flight Governance Plane
    \node[comp=b3, below=0.75cm of s1] (g1) {Prompt Deconstruction\\Engine};
    \node[comp=b3, right=0.45cm of g1] (g2) {IntentContract Schema\\Serializer};
    \node[comp=b3, right=0.45cm of g2] (g3) {SLA Hard Budget Gating\\($C_{\max} \le \$0.05, L_{\max} \le 5\text{s}$)};
    \node[comp=b3, right=0.45cm of g3] (g4) {AST Redundancy Pruner\\(\textbf{--68.4\% Token Savings})};
    \node[layer={b3}{c3}, fit=(g1) (g2) (g3) (g4), label={[title]above:Layer 3: Pre-Flight Intent \& Policy Governance Plane (aiEngine.ts)}] (l3) {};

    % Layer 4: Multi-Model Gateway
    \node[comp=b4, below=0.75cm of g1] (p1) {Local Ollama Adapter\\(Mistral / Llama-3)};
    \node[comp=b4, right=0.45cm of p1] (p2) {Google Gemini Studio\\(Gemini 2.5 Flash)};
    \node[comp=b4, right=0.45cm of p2] (p3) {Groq Cloud LPU\\(Llama 3.3 70B)};
    \node[comp=b4, right=0.45cm of p3] (p4) {Deterministic Browser\\Synthesizer (Offline)};
    \node[layer={b4}{c4}, fit=(p1) (p2) (p3) (p4), label={[title]above:Layer 4: Multi-Model Inference Gateway \& Dynamic Provider Adapters}] (l4) {};

    % Layer 5: Dual Persistence
    \node[comp=b5, below=0.75cm of p1] (d1) {Deterministic AST\\Quality Gate};
    \node[comp=b5, right=0.25cm of d1] (d2) {6-State Evidence\\Ledger Auditor};
    \node[comp=b5, right=0.25cm of d2] (d3) {IPAR Targeted Patch\\Generator};
    \node[comp=b5, right=0.25cm of d3] (d4) {Supabase PostgreSQL\\(Cryptographic RLS)};
    \node[comp=b5, right=0.25cm of d4] (d5) {Sovereign Browser\\LocalStorage Mirror};
    \node[layer={b5}{c5}, fit=(d1) (d2) (d3) (d4) (d5), label={[title]above:Layer 5: Verification, Self-Healing \& Dual-Persistence Layer}] (l5) {};

    % Inter-Layer Connectors
    \draw[-{Stealth[length=2.2mm]}, line width=1.2pt, draw=darkslate!80] (l1) -- (l2);
    \draw[-{Stealth[length=2.2mm]}, line width=1.2pt, draw=darkslate!80] (l2) -- (l3);
    \draw[-{Stealth[length=2.2mm]}, line width=1.2pt, draw=darkslate!80] (l3) -- (l4);
    \draw[-{Stealth[length=2.2mm]}, line width=1.2pt, draw=darkslate!80] (l4) -- (l5);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.3: UML Use Case Diagram of TokenOS Platform
# =============================================================================
diagrams["diagram_04_use_case.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{borderblue}{RGB}{2,132,199}
\definecolor{bgblue}{RGB}{240,249,255}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    actor/.style={
        align=center, font=\bfseries\scriptsize, text=darkslate
    },
    usecase/.style={
        ellipse, draw=borderblue, line width=1pt, fill=bgblue,
        align=center, inner sep=4pt, minimum width=3.2cm, minimum height=0.9cm,
        font=\fontsize{7.5}{9.5}\selectfont
    },
    boundary/.style={
        rectangle, draw=primary, line width=1.3pt, rounded corners=8pt,
        inner sep=14pt, fill=primary!2
    }
]

    % Use Cases (Vertical Column)
    \node[usecase] (uc1) {UC-01: Deconstruct Intent\\\& Compile SLA Contract};
    \node[usecase, below=0.35cm of uc1] (uc2) {UC-02: Run Prompt Laboratory\\(3-Stage Comparative Diff)};
    \node[usecase, below=0.35cm of uc2] (uc3) {UC-03: Prune Context AST\\(\textbf{--68.4\% Token Savings})};
    \node[usecase, below=0.35cm of uc3] (uc4) {UC-04: Execute Streaming Inference\\(Ollama / Groq / Gemini)};
    \node[usecase, below=0.35cm of uc4] (uc5) {UC-05: Inspect 6-State\\Evidence Ledger};
    \node[usecase, below=0.35cm of uc5] (uc6) {UC-06: Apply Targeted IPAR Patch\\(\textbf{96.8\% PRPR Non-Regression})};
    \node[usecase, below=0.35cm of uc6] (uc7) {UC-07: Monitor Anomaly Z-Scores\\\& Token Surges};
    \node[usecase, below=0.35cm of uc7] (uc8) {UC-08: Manage Client Key Vault\\\& Master PIN};
    \node[usecase, below=0.35cm of uc8] (uc9) {UC-09: Export Machine-Readable\\Audit Certificate (JSON)};

    % Boundary Box
    \node[boundary, fit=(uc1) (uc9), label={[font=\bfseries\small, text=primary]above:TokenOS Execution \& Governance Boundary}] (box) {};

    % Actors
    % 1. Student / Software Engineer (Left Top)
    \node[actor, left=2.8cm of uc2] (dev) {
        \begin{tikzpicture}[scale=0.45]
            \draw[line width=1.2pt] (0,1.2) circle (0.4);
            \draw[line width=1.2pt] (0,0.8) -- (0,-0.4);
            \draw[line width=1.2pt] (-0.7,0.4) -- (0.7,0.4);
            \draw[line width=1.2pt] (0,-0.4) -- (-0.6,-1.4);
            \draw[line width=1.2pt] (0,-0.4) -- (0.6,-1.4);
        \end{tikzpicture}\\[3pt]
        Software Engineer\\/ Student Operator
    };

    % 2. AI Researcher / Evaluator (Left Bottom)
    \node[actor, left=2.8cm of uc7] (eval) {
        \begin{tikzpicture}[scale=0.45]
            \draw[line width=1.2pt] (0,1.2) circle (0.4);
            \draw[line width=1.2pt] (0,0.8) -- (0,-0.4);
            \draw[line width=1.2pt] (-0.7,0.4) -- (0.7,0.4);
            \draw[line width=1.2pt] (0,-0.4) -- (-0.6,-1.4);
            \draw[line width=1.2pt] (0,-0.4) -- (0.6,-1.4);
        \end{tikzpicture}\\[3pt]
        AI Researcher\\/ Model Evaluator
    };

    % 3. System Architect / SecOps (Right Center)
    \node[actor, right=2.8cm of uc5] (admin) {
        \begin{tikzpicture}[scale=0.45]
            \draw[line width=1.2pt] (0,1.2) circle (0.4);
            \draw[line width=1.2pt] (0,0.8) -- (0,-0.4);
            \draw[line width=1.2pt] (-0.7,0.4) -- (0.7,0.4);
            \draw[line width=1.2pt] (0,-0.4) -- (-0.6,-1.4);
            \draw[line width=1.2pt] (0,-0.4) -- (0.6,-1.4);
        \end{tikzpicture}\\[3pt]
        System Architect\\/ SecOps Lead
    };

    % Association Lines
    % Developer associations
    \draw[line width=0.9pt, draw=darkslate!80] (dev) -- (uc1.west);
    \draw[line width=0.9pt, draw=darkslate!80] (dev) -- (uc2.west);
    \draw[line width=0.9pt, draw=darkslate!80] (dev) -- (uc3.west);
    \draw[line width=0.9pt, draw=darkslate!80] (dev) -- (uc4.west);
    \draw[line width=0.9pt, draw=darkslate!80] (dev) -- (uc6.west);

    % Researcher associations
    \draw[line width=0.9pt, draw=darkslate!80] (eval) -- (uc2.west);
    \draw[line width=0.9pt, draw=darkslate!80] (eval) -- (uc5.west);
    \draw[line width=0.9pt, draw=darkslate!80] (eval) -- (uc6.west);
    \draw[line width=0.9pt, draw=darkslate!80] (eval) -- (uc7.west);

    % Admin associations
    \draw[line width=0.9pt, draw=darkslate!80] (admin) -- (uc4.east);
    \draw[line width=0.9pt, draw=darkslate!80] (admin) -- (uc7.east);
    \draw[line width=0.9pt, draw=darkslate!80] (admin) -- (uc8.east);
    \draw[line width=0.9pt, draw=darkslate!80] (admin) -- (uc9.east);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.4: Context Lifecycle Management Model in TokenOS
# =============================================================================
diagrams["diagram_08_context_lifecycle.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{borderblue}{RGB}{2,132,199}
\definecolor{bgblue}{RGB}{240,249,255}
\definecolor{bordergreen}{RGB}{22,163,74}
\definecolor{bggreen}{RGB}{240,253,244}
\definecolor{borderpurple}{RGB}{147,51,234}
\definecolor{bgpurple}{RGB}{250,245,255}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    op/.style 2 args={
        rectangle, draw=#1, line width=1.2pt, fill=#2,
        rounded corners=5pt, align=center, inner sep=6pt,
        minimum width=3.8cm, minimum height=1.3cm,
        font=\fontsize{8.5}{11}\selectfont
    },
    prop/.style 2 args={
        rectangle, draw=#1, line width=1.2pt, dashed, fill=#2,
        rounded corners=5pt, align=center, inner sep=6pt,
        minimum width=3.8cm, minimum height=1.3cm,
        font=\fontsize{8.5}{11}\selectfont
    },
    arr/.style={-{Stealth[length=2.5mm]}, line width=1.1pt, draw=darkslate}
]

    % Column 1: Client Ingestion & Pruning
    \node[op={borderblue}{bgblue}] (ingest) {
        \textbf{1. Context Ingestion}\\[2pt]
        \scriptsize Codebase files, schemas,\\
        \scriptsize and multi-turn history
    };

    \node[op={bordergreen}{bggreen}, below=1.0cm of ingest] (ast) {
        \textbf{2. AST Context Pruning}\\[2pt]
        \scriptsize Non-semantic node removal\\
        \scriptsize \textbf{--68.4\% Token Reduction}
    };

    \node[op={borderblue}{bgblue}, below=1.0cm of ast] (assemble) {
        \textbf{3. Prompt Assembly}\\[2pt]
        \scriptsize Structured IntentContract\\
        \scriptsize + SLA safety constraints
    };

    % Column 2: Execution & Persistence
    \node[op={borderpurple}{bgpurple}, right=2.0cm of assemble] (infer) {
        \textbf{4. Inference Delivery}\\[2pt]
        \scriptsize Streaming payload dispatch\\
        \scriptsize (Ollama / Groq / Gemini)
    };

    \node[op={bordergreen}{bggreen}, right=2.0cm of ast] (persist) {
        \textbf{5. Sovereign Storage}\\[2pt]
        \scriptsize Dual persistence: LocalStorage\\
        \scriptsize + Supabase PostgreSQL RLS
    };

    \node[prop={primary}{primary!5}, right=2.0cm of ingest] (vector) {
        \textbf{6. Semantic Vector Cache}\\[2pt]
        \scriptsize \textit{(Proposed Architecture)}\\
        \scriptsize Embedded HNSW index
    };

    % Connecting Flow
    \draw[arr] (ingest) -- node[left, font=\scriptsize] {Raw Buffer} (ast);
    \draw[arr] (ast) -- node[left, font=\scriptsize] {Pruned Syntax} (assemble);
    \draw[arr] (assemble) -- node[below, font=\scriptsize] {Packaged Payload} (infer);
    \draw[arr] (infer) -- node[right, font=\scriptsize] {Completions \& Audit} (persist);
    \draw[arr, dashed] (persist) -- node[right, font=\scriptsize] {Cache Seed} (vector);
    \draw[arr, dashed] (vector) -- node[above, font=\scriptsize] {Fast Lookup} (ingest);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.5: UML Class & Component Diagram
# =============================================================================
diagrams["diagram_05_class_component.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{headerblue}{RGB}{2,132,199}
\definecolor{headeramber}{RGB}{217,119,6}
\definecolor{headergreen}{RGB}{22,163,74}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    classbox/.style={
        rectangle, draw=darkslate!80, line width=1pt, fill=white,
        rounded corners=2pt, align=left, inner sep=4pt,
        font=\fontsize{7.2}{9.5}\selectfont
    },
    servicebox/.style={
        rectangle, draw=headerblue, line width=1.1pt, fill=white,
        rounded corners=2pt, align=left, inner sep=4pt,
        font=\fontsize{7.2}{9.5}\selectfont
    },
    arrow/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80}
]

    % Class: IntentContract
    \node[classbox] (contract) {
        \textbf{\color{darkslate}IntentContract}\\
        \hline
        + id: string (UUID)\\
        + taskType: TaskType\\
        + objective: string\\
        + requirements: RequirementItem[]\\
        + hardConstraints: HardConstraints\\
        + confidenceThreshold: number\\
        + privacyLevel: PrivacyMode\\
        \hline
        + serialize(): string\\
        + validateSchema(): boolean
    };

    % Class: ExecutionRun
    \node[classbox, right=1.2cm of contract] (run) {
        \textbf{\color{darkslate}ExecutionRun}\\
        \hline
        + id: string (UUID)\\
        + contractId: string\\
        + provider: ProviderType\\
        + model: string\\
        + inputTokens: number\\
        + outputTokens: number\\
        + totalCostUsd: number\\
        + provenance: ProvenanceType\\
        + status: ExecutionStatus\\
        \hline
        + getDurationMs(): number\\
        + exportAuditJson(): object
    };

    % Class: EvidenceItem
    \node[classbox, below=1.0cm of contract] (evidence) {
        \textbf{\color{darkslate}EvidenceItem}\\
        \hline
        + claimId: string\\
        + targetRequirement: string\\
        + status: EvidenceState\\
        + assertionProof: string\\
        + astGrammarValid: boolean\\
        + timestamp: string\\
        \hline
        + verifyAssertion(): boolean
    };

    % Class: RepairCandidate (IPAR)
    \node[classbox, below=1.0cm of run] (repair) {
        \textbf{\color{darkslate}RepairCandidate}\\
        \hline
        + id: string (UUID)\\
        + targetRequirements: string[]\\
        + beforeSnippet: string\\
        + afterPatchSnippet: string\\
        + predictedQualityGain: number\\
        + prprScore: number (0.968)\\
        + repairTokens: number (490)\\
        \hline
        + applyDiffPatch(): string
    };

    % Class: aiEngine (Singleton Service)
    \node[servicebox, below=1.2cm of evidence] (aiEngine) {
        \textbf{\color{headerblue}<<service>> aiEngine}\\
        \hline
        + deconstructPrompt(prompt): IntentContract\\
        + pruneAstContext(code): string\\
        + analyzePromptAndAutoRoute(prompt): RoutePlan\\
        + executeTokenPipeline(config): ExecutionRun\\
        + generateIparPatch(run): RepairCandidate
    };

    % Class: securityGuard (Singleton Service)
    \node[servicebox, below=1.2cm of repair] (security) {
        \textbf{\color{headerblue}<<service>> securityGuard}\\
        \hline
        + checkRateLimit(ip): RateLimitResult\\
        + evaluatePasswordEntropy(pwd): EntropyScore\\
        + validateMasterPin(pin): PinValidation\\
        + detectHoneypot(input): boolean\\
        + logSecurityIncident(event): void
    };

    % Relationships
    \draw[arrow] (run) -- node[above, font=\scriptsize] {1..* tracks} (contract);
    \draw[arrow] (contract) -- node[right, font=\scriptsize] {1..* validates} (evidence);
    \draw[arrow] (run) -- node[right, font=\scriptsize] {0..* triggers} (repair);
    \draw[arrow] (repair) -- node[above, font=\scriptsize] {heals} (evidence);
    \draw[arrow, dashed] (aiEngine) -- (contract);
    \draw[arrow, dashed] (aiEngine) -- (run);
    \draw[arrow, dashed] (security) -- (aiEngine);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.6: UML Activity and Workflow Diagram of TokenOS Execution
# =============================================================================
diagrams["diagram_03_end_to_end_workflow.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{successgreen}{RGB}{22,163,74}
\definecolor{failred}{RGB}{220,38,38}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    node distance=0.7cm and 1.2cm,
    startstop/.style={circle, fill=darkslate, text=white, inner sep=4pt, font=\bfseries\scriptsize},
    act/.style={
        rectangle, draw=darkslate!80, line width=1pt, fill=white,
        rounded corners=4pt, align=center, inner sep=5pt,
        font=\fontsize{7.8}{10}\selectfont
    },
    decision/.style={
        diamond, draw=primary, line width=1.1pt, fill=primary!8,
        aspect=1.9, align=center, inner sep=3pt,
        font=\fontsize{7.5}{9.5}\selectfont
    },
    arrow/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80}
]

    \node[startstop] (start) {Start};
    \node[act, below=0.5cm of start] (input) {Receive User Prompt \& Raw Context};
    \node[act, below=0.5cm of input] (decon) {Deconstruct Prompt to \textbf{IntentContract}\\(Objective, Typed Needs, Hard SLA Bounds)};
    \node[decision, below=0.6cm of decon] (budget) {Estimated $C_{\text{est}} \le C_{\max}$ \&\\$T_{\text{est}} \le K_{\max}$?};
    
    \node[act, right=1.2cm of budget, draw=failred] (reject) {Halt Execution \&\\Display SLA Violation Alert};
    
    \node[act, below=0.6cm of budget] (prune) {Deterministic AST Context Pruning\\(Strip Comments, Whitespace; \textbf{--68.4\% Tokens})};
    \node[act, below=0.5cm of prune] (route) {Evaluate Multi-Criteria Utility Function\\($U = \alpha Q - \beta C - \gamma L$)};
    \node[act, below=0.5cm of route] (stream) {Stream Tokens via Provider Adapter\\(Capture Chunk Latencies \& Provenance)};
    \node[act, below=0.5cm of stream] (verify) {Run Quality Gate \& AST Linting\\(Categorize into 6 Evidence States)};
    \node[decision, below=0.6cm of verify] (check) {All Requirements\\Satisfied ($Q_{\text{gate}} \ge 85$)?};
    
    \node[act, right=1.2cm of check, draw=primary] (ipar) {Synthesize IPAR Patch\\(\textbf{490 tokens, 96.8\% PRPR})};
    
    \node[act, below=0.6cm of check, draw=successgreen] (persist) {Dual Persistence: Supabase PostgreSQL\\(Row-Level Security) + LocalStorage};
    \node[startstop, below=0.5cm of persist] (end) {End};
    
    % Flow Routing
    \draw[arrow] (start) -- (input);
    \draw[arrow] (input) -- (decon);
    \draw[arrow] (decon) -- (budget);
    \draw[arrow] (budget) -- node[left, font=\scriptsize\bfseries] {Yes} (prune);
    \draw[arrow] (budget) -- node[above, font=\scriptsize\bfseries, text=failred] {No} (reject);
    \draw[arrow] (reject) |- (input);
    
    \draw[arrow] (prune) -- (route);
    \draw[arrow] (route) -- (stream);
    \draw[arrow] (stream) -- (verify);
    \draw[arrow] (verify) -- (check);
    \draw[arrow] (check) -- node[left, font=\scriptsize\bfseries, text=successgreen] {Yes} (persist);
    \draw[arrow] (check) -- node[above, font=\scriptsize\bfseries, text=primary] {No} (ipar);
    \draw[arrow] (ipar) |- node[right, pos=0.25, font=\scriptsize] {Apply \& Re-verify} (persist);
    \draw[arrow] (persist) -- (end);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.7: UML Sequence Diagram of Request Lifecycle
# =============================================================================
diagrams["diagram_06_sequence.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{lifeline}{RGB}{203,213,225}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    actor/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=3pt, align=center, inner sep=4pt, font=\fontsize{7.5}{9.5}\selectfont},
    msg/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80, font=\fontsize{7}{8.5}\selectfont},
    ret/.style={-{Stealth[length=2mm]}, dashed, line width=0.8pt, draw=darkslate!60, font=\fontsize{7}{8.5}\selectfont}
]

    % Lifeline Headers
    \node[actor] (user) {User / UI\\(Workbench)};
    \node[actor, right=1.2cm of user] (sec) {SecurityGuard\\(Zero-Trust)};
    \node[actor, right=1.2cm of sec] (engine) {aiEngine\\(Control Plane)};
    \node[actor, right=1.2cm of engine] (router) {UtilityRouter\\(Gateway)};
    \node[actor, right=1.2cm of router] (llm) {LLM Endpoint\\(Ollama/Groq/Gemini)};
    \node[actor, right=1.2cm of llm] (qgate) {QualityGate\\(Evidence Linter)};

    % Lifeline Vertical Lines
    \draw[lifeline, dashed, line width=0.8pt] (user.south) -- ++(0,-7.2) coordinate (user_end);
    \draw[lifeline, dashed, line width=0.8pt] (sec.south) -- ++(0,-7.2) coordinate (sec_end);
    \draw[lifeline, dashed, line width=0.8pt] (engine.south) -- ++(0,-7.2) coordinate (engine_end);
    \draw[lifeline, dashed, line width=0.8pt] (router.south) -- ++(0,-7.2) coordinate (router_end);
    \draw[lifeline, dashed, line width=0.8pt] (llm.south) -- ++(0,-7.2) coordinate (llm_end);
    \draw[lifeline, dashed, line width=0.8pt] (qgate.south) -- ++(0,-7.2) coordinate (qgate_end);

    % Sequence Messages
    % 1. Submit
    \draw[msg] ([yshift=-0.5cm]user.south) -- node[above] {1. submitPrompt(prompt, sla)} ([yshift=-0.5cm]sec.south);
    % 2. Rate limit check
    \draw[ret] ([yshift=-1.0cm]sec.south) -- node[above] {2. rateLimitCheck OK} ([yshift=-1.0cm]user.south);
    % 3. Compile intent
    \draw[msg] ([yshift=-1.5cm]user.south) -- node[above] {3. deconstructIntent(prompt)} ([yshift=-1.5cm]engine.south);
    % 4. AST prune
    \draw[msg] ([yshift=-2.1cm]engine.south) -- node[above] {4. pruneASTContext(code)} ([yshift=-2.1cm]engine.south);
    % 5. Route selection
    \draw[msg] ([yshift=-2.7cm]engine.south) -- node[above] {5. routePlan(contract)} ([yshift=-2.7cm]router.south);
    \draw[ret] ([yshift=-3.2cm]router.south) -- node[above] {6. selectedModel(Groq 70B)} ([yshift=-3.2cm]engine.south);
    % 6. Stream inference
    \draw[msg] ([yshift=-3.8cm]engine.south) -- node[above] {7. streamInference(payload)} ([yshift=-3.8cm]llm.south);
    \draw[ret] ([yshift=-4.4cm]llm.south) -- node[above] {8. yield tokenChunks(228)} ([yshift=-4.4cm]user.south);
    % 7. Quality gate evaluation
    \draw[msg] ([yshift=-5.0cm]engine.south) -- node[above] {9. evaluateQuality(code, contract)} ([yshift=-5.0cm]qgate.south);
    \draw[ret] ([yshift=-5.6cm]qgate.south) -- node[above] {10. evidenceLedger(6 states)} ([yshift=-5.6cm]engine.south);
    % 8. IPAR self-repair if needed
    \draw[msg] ([yshift=-6.2cm]engine.south) -- node[above] {11. generateIparPatch(gaps)} ([yshift=-6.2cm]engine.south);
    \draw[ret] ([yshift=-6.8cm]engine.south) -- node[above] {12. displayVerifiedResult(auditReport)} ([yshift=-6.8cm]user.south);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.8: UML State Chart Diagram of Execution Run Lifecycle
# =============================================================================
diagrams["diagram_07_state_machine.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{statestate}{RGB}{241,245,249}
\definecolor{failred}{RGB}{220,38,38}
\definecolor{successgreen}{RGB}{22,163,74}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    node distance=0.8cm and 1.3cm,
    state/.style={
        rectangle, draw=darkslate!80, line width=1pt, fill=statestate,
        rounded corners=5pt, align=center, inner sep=5pt,
        font=\fontsize{7.5}{9.5}\selectfont
    },
    arrow/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80}
]

    % States
    \node[circle, fill=darkslate, minimum size=0.4cm] (init) {};
    \node[state, right=0.8cm of init] (idle) {\textbf{IDLE}\\Ready for user input};
    \node[state, right=1.0cm of idle] (decon) {\textbf{DECONSTRUCTING}\\Compiling IntentContract};
    \node[state, below=0.8cm of decon] (budget) {\textbf{BUDGET\_CHECKING}\\Verifying SLA thresholds};
    
    \node[state, right=1.2cm of budget, draw=failred] (rejected) {\textbf{BUDGET\_EXCEEDED}\\Execution Intercepted};
    
    \node[state, below=0.8cm of budget] (pruning) {\textbf{PRUNING\_CONTEXT}\\AST Redundancy Removal};
    \node[state, below=0.8cm of pruning] (streaming) {\textbf{INFERENCE\_STREAMING}\\Chunk Latency Tracking};
    \node[state, below=0.8cm of streaming] (verifying) {\textbf{QUALITY\_EVALUATING}\\Evidence Ledger Linting};
    
    \node[state, right=1.2cm of verifying, draw=primary] (ipar) {\textbf{IPAR\_REPAIRING}\\Targeted Patch Synthesis};
    
    \node[state, below=0.8cm of verifying, draw=successgreen] (completed) {\textbf{COMPLETED}\\Run Persisted \& Audited};
    \node[double, circle, fill=darkslate, draw=white, line width=1.5pt, minimum size=0.5cm, below=0.6cm of completed] (end) {};

    % Transitions
    \draw[arrow] (init) -- (idle);
    \draw[arrow] (idle) -- node[above, font=\scriptsize] {User Submit} (decon);
    \draw[arrow] (decon) -- node[right, font=\scriptsize] {Contract Formed} (budget);
    \draw[arrow] (budget) -- node[right, font=\scriptsize] {Within SLA} (pruning);
    \draw[arrow] (budget) -- node[above, font=\scriptsize, text=failred] {Over Limit} (rejected);
    \draw[arrow] (rejected) |- (idle);
    
    \draw[arrow] (pruning) -- node[right, font=\scriptsize] {AST Pruned} (streaming);
    \draw[arrow] (streaming) -- node[right, font=\scriptsize] {Stream Complete} (verifying);
    \draw[arrow] (verifying) -- node[right, font=\scriptsize, text=successgreen] {Pass ($Q \ge 85$)} (completed);
    \draw[arrow] (verifying) -- node[above, font=\scriptsize, text=primary] {Gaps ($Q < 85$)} (ipar);
    \draw[arrow] (ipar) |- node[right, pos=0.25, font=\scriptsize] {Patch Applied} (completed);
    \draw[arrow] (completed) -- (end);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.9: Decision Policy Flowchart for Multi-Model Routing
# =============================================================================
diagrams["diagram_09_decision_policy_flowchart.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{borderblue}{RGB}{2,132,199}
\definecolor{borderamber}{RGB}{217,119,6}
\definecolor{bordergreen}{RGB}{22,163,74}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    node distance=0.65cm and 1.2cm,
    box/.style={
        rectangle, draw=darkslate!80, line width=1pt, fill=white,
        rounded corners=4pt, align=center, inner sep=5pt,
        font=\fontsize{7.5}{9.5}\selectfont
    },
    decision/.style={
        diamond, draw=primary, line width=1pt, fill=primary!8,
        aspect=1.9, align=center, inner sep=3pt,
        font=\fontsize{7.2}{9}\selectfont
    },
    arrow/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80}
]

    \node[box] (start) {Receive IntentContract $\mathcal{C}$};
    \node[decision, below=0.6cm of start] (manual) {Manual Provider\\Override Active?};
    \node[box, right=1.2cm of manual, draw=borderblue] (manual_route) {Dispatch to Selected Model\\(Honor User Choice)};
    
    \node[decision, below=0.6cm of manual] (local) {Local-Only Mode\\or \$0.00 Budget?};
    \node[box, right=1.2cm of local, draw=bordergreen] (ollama_route) {Route to Sovereign Ollama\\(Localhost:11434, Zero Egress)};
    
    \node[box, below=0.6cm of local] (compute) {Estimate Task Complexity $\theta_c$\\and Token Length $T$};
    
    \node[decision, below=0.6cm of compute] (complex) {Complex Reasoning /\\Architecture ($\theta_c > 0.7$)?};
    
    \node[box, left=1.0cm of complex, draw=primary] (gemini_route) {Route to Google AI Studio\\(Gemini 2.5 Flash, 1M Window)};
    \node[box, right=1.0cm of complex, draw=borderamber] (groq_route) {Route to Groq Cloud LPU\\(Llama 3.3 70B, Sub-Second)};
    
    \node[box, below=1.0cm of complex] (exec) {Initiate Async Streaming Inference\\Capture Telemetry \& Provenance};

    % Connections
    \draw[arrow] (start) -- (manual);
    \draw[arrow] (manual) -- node[above, font=\scriptsize] {Yes} (manual_route);
    \draw[arrow] (manual) -- node[left, font=\scriptsize] {No} (local);
    
    \draw[arrow] (local) -- node[above, font=\scriptsize] {Yes} (ollama_route);
    \draw[arrow] (local) -- node[left, font=\scriptsize] {No} (compute);
    
    \draw[arrow] (compute) -- (complex);
    \draw[arrow] (complex) -- node[above, font=\scriptsize] {Yes} (gemini_route);
    \draw[arrow] (complex) -- node[above, font=\scriptsize] {No} (groq_route);
    
    \draw[arrow] (manual_route) |- (exec);
    \draw[arrow] (ollama_route) |- (exec);
    \draw[arrow] (gemini_route) |- (exec);
    \draw[arrow] (groq_route) |- (exec);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.10: UML Deployment Diagram
# =============================================================================
diagrams["diagram_10_deployment.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{nodebg}{RGB}{248,250,252}
\definecolor{compbg}{RGB}{255,255,255}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    node/.style={
        rectangle, draw=darkslate!80, line width=1.1pt, fill=nodebg,
        rounded corners=4pt, inner sep=6pt, font=\fontsize{7.5}{9.5}\selectfont
    },
    artifact/.style={
        rectangle, draw=primary, line width=0.8pt, fill=compbg,
        rounded corners=2pt, align=center, inner sep=4pt,
        font=\fontsize{7}{8.8}\selectfont
    },
    link/.style={<->, >=Stealth, line width=0.9pt, draw=darkslate!80, font=\fontsize{6.8}{8.5}\selectfont}
]

    % Node 1: Client Machine
    \node[artifact] (spa) {<<artifact>>\\React 18 SPA\\(Vite 5 Bundled)};
    \node[artifact, below=0.25cm of spa] (worker) {<<artifact>>\\aiEngine Orchestrator\\(Web Worker)};
    \node[artifact, below=0.25cm of worker] (storage) {<<artifact>>\\LocalStorage Cache\\(Sovereign State)};
    \node[node, fit=(spa) (worker) (storage), label={[font=\bfseries\scriptsize, text=darkslate]above:<<device>> Developer Client Workstation}] (client) {};

    % Node 2: Localhost Ollama Daemon
    \node[artifact, right=2.0cm of spa] (ollama) {<<artifact>>\\Ollama Server Daemon\\(Mistral / Llama 3 8B)};
    \node[node, fit=(ollama), label={[font=\bfseries\scriptsize, text=darkslate]above:<<device>> Localhost:11434 (Sovereign Engine)}] (localnode) {};

    % Node 3: Supabase Cloud BaaS
    \node[artifact, below=1.2cm of localnode] (pg) {<<artifact>>\\PostgreSQL 15+ Engine\\(Row-Level Security Policies)};
    \node[artifact, below=0.25cm of pg] (gotrue) {<<artifact>>\\GoTrue Auth Service\\(JWT Token Verification)};
    \node[node, fit=(pg) (gotrue), label={[font=\bfseries\scriptsize, text=darkslate]above:<<cloud>> Supabase Cloud BaaS}] (supanode) {};

    % Node 4: Frontier Cloud APIs
    \node[artifact, below=1.2cm of supanode] (cloud_apis) {<<service>> Google AI Studio (Gemini 2.5 Flash)\\[2pt]
    <<service>> Groq Cloud LPU (Llama 3.3 70B)\\[2pt]
    <<service>> OpenRouter Gateway Catalog};
    \node[node, fit=(cloud_apis), label={[font=\bfseries\scriptsize, text=darkslate]above:<<cloud>> Frontier AI Inference Gateways}] (cloudnode) {};

    % Connections
    \draw[link] (client) -- node[above, sloped] {HTTP Reverse Proxy (/api/ollama)} (localnode);
    \draw[link] (client) -- node[above, sloped] {HTTPS REST / WebSocket (JWT)} (supanode);
    \draw[link] (client) -- node[above, sloped] {HTTPS REST Streaming (Bearer API Key)} (cloudnode);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 4.11: PostgreSQL Relational Entity-Relationship Diagram
# =============================================================================
diagrams["diagram_11_er_data_model.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{tableheader}{RGB}{226,232,240}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    entity/.style={
        rectangle, draw=darkslate!80, line width=1pt, fill=white,
        rounded corners=2pt, align=left, inner sep=4pt,
        font=\fontsize{7}{9}\selectfont
    },
    crowsfoot/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate!80}
]

    % Entity: PROFILES
    \node[entity] (profiles) {
        \textbf{\color{darkslate}PROFILES}\\
        \hline
        \textbf{PK} \quad id: uuid\\
        \quad \quad email: text\\
        \quad \quad user\_type: UserType\\
        \quad \quad organization: text\\
        \quad \quad created\_at: timestamptz
    };

    % Entity: INTENT_CONTRACTS
    \node[entity, right=1.6cm of profiles] (contracts) {
        \textbf{\color{darkslate}INTENT\_CONTRACTS}\\
        \hline
        \textbf{PK} \quad id: uuid\\
        \textbf{FK} \quad user\_id: uuid\\
        \quad \quad title: text\\
        \quad \quad task\_type: TaskType\\
        \quad \quad objective: text\\
        \quad \quad requirements: jsonb\\
        \quad \quad hard\_constraints: jsonb\\
        \quad \quad created\_at: timestamptz
    };

    % Entity: EXECUTION_RUNS
    \node[entity, below=1.2cm of contracts] (runs) {
        \textbf{\color{darkslate}EXECUTION\_RUNS}\\
        \hline
        \textbf{PK} \quad id: uuid\\
        \textbf{FK} \quad contract\_id: uuid\\
        \textbf{FK} \quad user\_id: uuid\\
        \quad \quad provider: text\\
        \quad \quad model: text\\
        \quad \quad input\_tokens: int\\
        \quad \quad output\_tokens: int\\
        \quad \quad latency\_ms: int\\
        \quad \quad total\_cost\_usd: numeric\\
        \quad \quad provenance: text\\
        \quad \quad status: text\\
        \quad \quad created\_at: timestamptz
    };

    % Entity: SECURITY_AUDIT_LOGS
    \node[entity, below=1.2cm of profiles] (logs) {
        \textbf{\color{darkslate}SECURITY\_AUDIT\_LOGS}\\
        \hline
        \textbf{PK} \quad id: uuid\\
        \textbf{FK} \quad user\_id: uuid (nullable)\\
        \quad \quad event\_type: text\\
        \quad \quad ip\_hash: text\\
        \quad \quad severity: text\\
        \quad \quad details: jsonb\\
        \quad \quad timestamp: timestamptz
    };

    % Crow's Foot Relationships (1:N)
    \draw[crowsfoot] (profiles) -- node[above, font=\scriptsize] {1 : N} (contracts);
    \draw[crowsfoot] (profiles) -- node[left, font=\scriptsize] {1 : N} (logs);
    \draw[crowsfoot] (contracts) -- node[right, font=\scriptsize] {1 : N} (runs);
    \draw[crowsfoot] (profiles.south east) -- node[below, sloped, font=\scriptsize] {1 : N} (runs.north west);

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 6.1: Gantt Chart Project Timeline
# =============================================================================
diagrams["diagram_12_gantt_chart.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{barblue}{RGB}{2,132,199}
\definecolor{baramber}{RGB}{217,119,6}
\definecolor{bargreen}{RGB}{22,163,74}
\definecolor{barpurple}{RGB}{147,51,234}
\definecolor{barrose}{RGB}{225,29,72}

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    task/.style={font=\fontsize{7.5}{9.5}\selectfont, text=darkslate},
    month/.style={font=\bfseries\scriptsize, text=darkslate!80},
    bar/.style={rounded corners=2.5pt, line width=0.8pt}
]

    % Grid Month Headers (Oct 2025 to May 2026)
    \foreach \m [count=\i from 0] in {Oct 2025, Nov 2025, Dec 2025, Jan 2026, Feb 2026, Mar 2026, Apr 2026, May 2026} {
        \node[month] at (\i*1.75 + 0.85, 4.2) {\m};
        \draw[dashed, draw=darkslate!15, line width=0.6pt] (\i*1.75, 3.9) -- (\i*1.75, -2.8);
    }
    \draw[dashed, draw=darkslate!15, line width=0.6pt] (8*1.75, 3.9) -- (8*1.75, -2.8);
    \draw[draw=darkslate!30, line width=0.9pt] (-4.2, 3.9) -- (8*1.75, 3.9);

    % Phase 1: Problem Definition & Literature Review
    \node[task, anchor=east] at (-0.2, 3.4) {Phase 1: Problem Definition \& Literature Review};
    \draw[bar, fill=barblue!30, draw=barblue] (0.0, 3.2) rectangle (2.5, 3.6);
    \node[font=\tiny\bfseries, text=barblue] at (1.25, 3.4) {Weeks 1--6};

    % Phase 2: Architecture & Intent Contract Design
    \node[task, anchor=east] at (-0.2, 2.4) {Phase 2: Intent Contract \& Architecture Design};
    \draw[bar, fill=baramber!30, draw=baramber] (2.0, 2.2) rectangle (5.0, 2.6);
    \node[font=\tiny\bfseries, text=baramber] at (3.5, 2.4) {Weeks 7--14};

    % Phase 3: Core Implementation (AST Pruner, Gateway)
    \node[task, anchor=east] at (-0.2, 1.4) {Phase 3: Core Engine \& AST Pruner Development};
    \draw[bar, fill=bargreen!30, draw=bargreen] (4.5, 1.2) rectangle (8.5, 1.6);
    \node[font=\tiny\bfseries, text=bargreen] at (6.5, 1.4) {Weeks 15--24};

    % Phase 4: Quality Gate & IPAR Self-Repair
    \node[task, anchor=east] at (-0.2, 0.4) {Phase 4: Quality Gate \& IPAR Self-Repair Engine};
    \draw[bar, fill=barpurple!30, draw=barpurple] (7.5, 0.2) rectangle (11.0, 0.6);
    \node[font=\tiny\bfseries, text=barpurple] at (9.25, 0.4) {Weeks 22--30};

    % Phase 5: Empirical Benchmarking & Security Audit
    \node[task, anchor=east] at (-0.2, -0.6) {Phase 5: Empirical Evaluation \& Anomaly Audit};
    \draw[bar, fill=barrose!30, draw=barrose] (10.0, -0.8) rectangle (12.5, -0.4);
    \node[font=\tiny\bfseries, text=barrose] at (11.25, -0.6) {Weeks 28--34};

    % Phase 6: Blackbook Documentation & Viva Defense
    \node[task, anchor=east] at (-0.2, -1.6) {Phase 6: Blackbook Preparation \& Final Defense};
    \draw[bar, fill=primary!30, draw=primary] (11.5, -1.8) rectangle (14.0, -1.4);
    \node[font=\tiny\bfseries, text=primary] at (12.75, -1.6) {Weeks 32--38};

    % Key Milestones (Diamonds)
    \node[diamond, fill=baramber, draw=darkslate, line width=0.6pt, inner sep=2.5pt] at (3.5, -2.4) {};
    \node[font=\tiny, anchor=west] at (3.7, -2.4) {M1: Synopsis Defense (Nov 2025)};

    \node[diamond, fill=bargreen, draw=darkslate, line width=0.6pt, inner sep=2.5pt] at (8.5, -2.4) {};
    \node[font=\tiny, anchor=west] at (8.7, -2.4) {M2: Mid-Term Review (Feb 2026)};

    \node[diamond, fill=primary, draw=darkslate, line width=0.6pt, inner sep=2.5pt] at (13.5, -2.4) {};
    \node[font=\tiny, anchor=west] at (13.7, -2.4) {M3: Final Viva Defense (May 2026)};

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 7.10: Quality Gate Confusion Matrix Heatmap (500 Empirical Trials)
# =============================================================================
diagrams["confusion_matrix.tex"] = r"""\documentclass[tikz,border=12pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{tpcolor}{RGB}{34,197,94}    % Soft Green for TP
\definecolor{tncolor}{RGB}{59,130,246}   % Soft Blue for TN
\definecolor{fpcolor}{RGB}{239,68,68}    % Soft Red for FP
\definecolor{fncolor}{RGB}{245,158,11}   % Soft Amber for FN

\begin{document}
\begin{tikzpicture}[
    font=\sffamily,
    cell/.style={rectangle, draw=darkslate!40, line width=1pt, rounded corners=3pt, minimum width=3.8cm, minimum height=2.4cm, align=center},
    axislabel/.style={font=\bfseries\small, text=darkslate},
    ticklabel/.style={font=\bfseries\footnotesize, text=darkslate!80}
]

    % Matrix Cells
    % TP (Top-Left)
    \node[cell, fill=tpcolor!20] (tp) at (0, 0) {
        \Large \textbf{\color{tpcolor!70!black}TP = 376}\\[4pt]
        \normalsize \textbf{75.2\%}\\[2pt]
        \scriptsize Correctly Verified Pass
    };

    % FN (Top-Right)
    \node[cell, fill=fncolor!20, right=0.3cm of tp] (fn) {
        \Large \textbf{\color{fncolor!70!black}FN = 11}\\[4pt]
        \normalsize \textbf{2.2\%}\\[2pt]
        \scriptsize Strict Linter False Alarm
    };

    % FP (Bottom-Left)
    \node[cell, fill=fpcolor!20, below=0.3cm of tp] (fp) {
        \Large \textbf{\color{fpcolor!70!black}FP = 15}\\[4pt]
        \normalsize \textbf{3.0\%}\\[2pt]
        \scriptsize Missed Subtle Gap
    };

    % TN (Bottom-Right)
    \node[cell, fill=tncolor!20, right=0.3cm of fp] (tn) {
        \Large \textbf{\color{tncolor!70!black}TN = 98}\\[4pt]
        \normalsize \textbf{19.6\%}\\[2pt]
        \scriptsize Correctly Flagged Defect
    };

    % Top Column Headers (Predicted)
    \node[ticklabel, above=0.2cm of tp] {Predicted Satisfied (Pass)};
    \node[ticklabel, above=0.2cm of fn] {Predicted Deficient (Gap)};
    \node[axislabel, above=0.8cm of $(tp.north)!0.5!(fn.north)$] {Predicted Requirement Status};

    % Left Row Headers (Actual)
    \node[ticklabel, left=0.25cm of tp, align=right] {Actual Satisfied\\(Pass)};
    \node[ticklabel, left=0.25cm of fp, align=right] {Actual Deficient\\(Gap)};
    \node[axislabel, rotate=90, left=1.8cm of $(tp.west)!0.5!(fp.west)$] {Actual Ground-Truth Status};

    % Performance Summary Footer Banner
    \node[rectangle, draw=darkslate!30, fill=darkslate!5, rounded corners=4pt, inner sep=5pt, font=\footnotesize, below=0.6cm of $(fp.south)!0.5!(tn.south)$] {
        \textbf{Sample Size:} $N = 500$ \quad $\mid$ \quad
        \textbf{Accuracy:} $\mathbf{94.80\%}$ \quad $\mid$ \quad
        \textbf{Precision:} $\mathbf{96.16\%}$ \quad $\mid$ \quad
        \textbf{Recall:} $\mathbf{97.16\%}$ \quad $\mid$ \quad
        \textbf{F1-Score:} $\mathbf{96.66\%}$
    };

\end{tikzpicture}
\end{document}
"""

# =============================================================================
# FIGURE 7.11: Empirical AST Context Token Pruning Curve (pgfplots)
# =============================================================================
diagrams["diagram_13_evaluation_plots.tex"] = r"""\documentclass[border=12pt]{standalone}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{15,23,42}
\definecolor{accentblue}{RGB}{2,132,199}

\begin{document}
\begin{tikzpicture}
    \begin{axis}[
        xlabel={\textbf{Raw Input Context Tokens}},
        ylabel={\textbf{Transmitted Tokens to Model}},
        xmin=0, xmax=8500,
        ymin=0, ymax=8500,
        grid=major,
        grid style={dashed, gray!30},
        legend pos=north west,
        legend style={font=\footnotesize, fill=white, fill opacity=0.9, draw=darkslate!40},
        font=\sffamily\footnotesize,
        width=11.5cm, height=7.2cm,
        axis line style={line width=0.8pt, draw=darkslate!80},
        tick style={line width=0.8pt, draw=darkslate!80}
    ]
        % Unoptimized 1:1 line
        \addplot[dashed, line width=1.2pt, draw=darkslate!60] coordinates {
            (200, 200) (1000, 1000) (2500, 2500) (5000, 5000) (8000, 8000)
        };
        \addlegendentry{Unpruned Baseline (100\% Tokens Sent)}

        % TokenOS AST Pruned curve
        \addplot[thick, mark=square*, mark options={fill=primary, scale=1.2}, color=primary, line width=1.8pt] coordinates {
            (200, 68) (1000, 312) (2500, 785) (5000, 1580) (8000, 2528)
        };
        \addlegendentry{TokenOS AST Pruned (\textbf{Mean --68.4\% Reduction})}

        % Percentage savings callout annotations
        \node[font=\scriptsize\bfseries, text=primary, anchor=south west] at (axis cs:200, 68) {66.0\%};
        \node[font=\scriptsize\bfseries, text=primary, anchor=south west] at (axis cs:1000, 312) {68.8\%};
        \node[font=\scriptsize\bfseries, text=primary, anchor=south west] at (axis cs:2500, 785) {68.6\%};
        \node[font=\scriptsize\bfseries, text=primary, anchor=south west] at (axis cs:5000, 1580) {68.4\%};
        \node[font=\scriptsize\bfseries, text=primary, anchor=south west] at (axis cs:8000, 2528) {68.4\%};

    \end{axis}
\end{tikzpicture}
\end{document}
"""

def compile_all():
    print("=" * 70)
    print("TOKENOS BLACKBOOK VISUAL RECONSTRUCTION & COMPILATION")
    print("=" * 70)
    
    success_count = 0
    fail_count = 0
    
    for filename, content in diagrams.items():
        src_path = os.path.join(SOURCE_DIR, filename)
        with open(src_path, "w", encoding="utf-8") as f:
            f.write(content.strip())
        print(f"\n[Source Created] {filename}")
        
        # Compile with pdflatex into RENDERED_DIR
        cmd = ["pdflatex", "-interaction=batchmode", "--disable-installer", f"-output-directory={RENDERED_DIR}", src_path]
        res = subprocess.run(cmd, capture_output=True, text=True)
        
        pdf_name = filename.replace(".tex", ".pdf")
        rendered_pdf = os.path.join(RENDERED_DIR, pdf_name)
        log_name = filename.replace(".tex", ".log")
        rendered_log = os.path.join(RENDERED_DIR, log_name)
        
        if os.path.exists(rendered_pdf):
            print(f"  ✔ COMPILED: {pdf_name} ({os.path.getsize(rendered_pdf):,} bytes)")
            
            # Copy to 05_LATEX/figures/
            shutil.copy2(rendered_pdf, os.path.join(LATEX_FIG_DIR, pdf_name))
            print(f"  ✔ SYNCHRONIZED TO: {os.path.join(LATEX_FIG_DIR, pdf_name)}")
            success_count += 1
        else:
            log_tail = ""
            if os.path.exists(rendered_log):
                with open(rendered_log, "r", encoding="utf-8", errors="ignore") as lf:
                    lines = lf.readlines()
                    log_tail = "".join(lines[-25:])
            print(f"  ❌ FAILED: {filename}")
            print(f"     Log tail:\n{log_tail}")
            fail_count += 1
            
    print("\n" + "=" * 70)
    print(f"COMPILATION COMPLETE: {success_count} SUCCESSFUL, {fail_count} FAILED")
    print("=" * 70)

if __name__ == '__main__':
    compile_all()
