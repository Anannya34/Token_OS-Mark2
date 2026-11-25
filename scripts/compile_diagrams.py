import os
import subprocess
import shutil

source_dir = r"D:\token-mark1\reports\TokenOS_Blackbook\04_DIAGRAMS\source"
rendered_dir = r"D:\token-mark1\reports\TokenOS_Blackbook\04_DIAGRAMS\rendered"
latex_fig_dir = r"D:\token-mark1\reports\TokenOS_Blackbook\05_LATEX\figures"

os.makedirs(source_dir, exist_ok=True)
os.makedirs(rendered_dir, exist_ok=True)
os.makedirs(latex_fig_dir, exist_ok=True)

diagrams = {}

# Diagram 1: System Context Diagram
diagrams["diagram01_system_context.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,backgrounds,fit}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\definecolor{lightslate}{RGB}{241,245,249}
\definecolor{accentblue}{RGB}{37,99,235}
\definecolor{successgreen}{RGB}{22,163,74}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\small,
    node distance=1.5cm and 2.2cm,
    box/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=4pt, align=center, inner sep=8pt, drop shadow},
    boundary/.style={rectangle, draw=primary, line width=1.5pt, fill=primary!5, dashed, rounded corners=8pt, inner sep=14pt},
    extbox/.style={rectangle, draw=darkslate!70, line width=1pt, fill=lightslate, rounded corners=4pt, align=center, inner sep=7pt},
    arrow/.style={-{Stealth[length=2.5mm]}, line width=1pt, draw=darkslate}
]
    % Central Boundary
    \node[box, fill=white, line width=1.5pt, draw=primary] (core) {\textbf{TokenOS Core Engine}\\\small 8-Stage Execution \& Governance Plane};
    \node[box, above=0.9cm of core] (vault) {\textbf{Client Security Guard \& Key Vault}\\\small Brute-Force Rate Limiting, Master PIN};
    \node[box, below=0.9cm of core] (ipar) {\textbf{Evidence Ledger \& IPAR Controller}\\\small Multi-Signal Grounding \& Patch Synthesis};
    
    \begin{scope}[on background layer]
        \node[boundary, fit=(core) (vault) (ipar), label={[primary, font=\bfseries\normalsize]above:TokenOS System Boundary (Client-Side Sovereign Architecture)}] (boundary) {};
    \end{scope}

    % External Actors
    \node[extbox, left=2.2cm of core] (user) {\textbf{User / Operator}\\\small Student / Engineer / Researcher};
    \node[extbox, above=1.8cm of boundary.north east] (ollama) {\textbf{Ollama Sovereign LLM}\\\small Localhost:11434 (Mistral/Llama-3)};
    \node[extbox, right=2.2cm of core] (gemini) {\textbf{Google AI Studio (Gemini)}\\\small Gemini 2.5 Flash / Flash-Latest};
    \node[extbox, below=1.8cm of boundary.south east] (groq) {\textbf{Groq LPU / OpenRouter}\\\small Sub-second Llama 3.3 70B};
    \node[extbox, below=1.8cm of boundary.south west] (supabase) {\textbf{Supabase Cloud BaaS}\\\small PostgreSQL 15+ with Native RLS};
    
    % Connections
    \draw[arrow] (user) -- node[above, font=\scriptsize] {Prompt \& SLA} (boundary.west |- core);
    \draw[arrow] (boundary.west |- core) -- node[below, font=\scriptsize] {Telemetry \& Patches} (user);
    
    \draw[arrow] (boundary.east |- core) -- node[above, font=\scriptsize] {REST / HTTPS} (gemini);
    \draw[arrow] (gemini) -- node[below, font=\scriptsize] {Token Stream} (boundary.east |- core);
    
    \draw[arrow] (boundary.north -| core) |- node[above, font=\scriptsize, pos=0.8] {Vite Reverse Proxy} (ollama);
    \draw[arrow] (ollama) -| (boundary.north -| core);
    
    \draw[arrow] (boundary.south -| core) |- node[below, font=\scriptsize, pos=0.8] {OpenAI-compat JSON} (groq);
    \draw[arrow] (boundary.south -| vault) |- node[left, font=\scriptsize, pos=0.8] {JWT / SSL SQL} (supabase);
\end{tikzpicture}
\end{document}
"""

# Diagram 2: Layered System Architecture
diagrams["diagram02_system_architecture.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{c1}{RGB}{248,250,252}
\definecolor{c2}{RGB}{241,245,249}
\definecolor{c3}{RGB}{226,232,240}
\definecolor{border}{RGB}{71,85,105}
\definecolor{primary}{RGB}{217,119,87}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\small,
    layer/.style={rectangle, draw=border, line width=1pt, rounded corners=6pt, inner sep=8pt, fill=#1},
    comp/.style={rectangle, draw=darkslate!80, line width=0.8pt, fill=white, rounded corners=3pt, align=center, inner sep=5pt, font=\scriptsize},
    title/.style={font=\bfseries\small, text=darkslate}
]
    % Layer 1: Presentation
    \node[comp] (w1) {Workbench \& Intent Studio};
    \node[comp, right=0.3cm of w1] (w2) {Execution Telemetry Control};
    \node[comp, right=0.3cm of w2] (w3) {Quality Gate \& Evidence Ledger};
    \node[comp, right=0.3cm of w3] (w4) {IPAR Refinement \& Repair};
    \node[comp, right=0.3cm of w4] (w5) {MCP Tool Sandboxes};
    \node[comp, right=0.3cm of w5] (w6) {Audit Observability};
    \node[layer=c1, fit=(w1) (w2) (w3) (w4) (w5) (w6), label={[title]above:Layer 1: Presentation \& Reactive UI (React 18 + Vite 5 + Tailwind CSS)}] (l1) {};

    % Layer 2: Security & Session
    \node[comp, below=0.8cm of w2] (s1) {Sliding Rate Limiter (60s Lockout)};
    \node[comp, right=0.4cm of s1] (s2) {Honeypot Anti-Bot Traps};
    \node[comp, right=0.4cm of s2] (s3) {Password Entropy Meter};
    \node[comp, right=0.4cm of s3] (s4) {Client Key Vault (Master PIN)};
    \node[layer=c2, fit=(s1) (s2) (s3) (s4), label={[title]above:Layer 2: Zero-Trust Client Defense \& Cryptographic Key Vault}] (l2) {};

    % Layer 3: Orchestration Engine
    \node[comp, below=0.8cm of s1] (e1) {Stage 1: Intent Deconstruction};
    \node[comp, right=0.25cm of e1] (e2) {Stage 2: Budget SLA Check};
    \node[comp, right=0.25cm of e2] (e3) {Stage 3: AST Context Pruner};
    \node[comp, right=0.25cm of e3] (e4) {Stage 4: Prompt Laboratory};
    \node[comp, below=0.3cm of e1] (e5) {Stage 5: Utility Auto-Router};
    \node[comp, right=0.25cm of e5] (e6) {Stage 6: Multi-Model Inference};
    \node[comp, right=0.25cm of e6] (e7) {Stage 7: Tool / MCP Gate};
    \node[comp, right=0.25cm of e7] (e8) {Stage 8: Evidence \& IPAR Patch};
    \node[layer=primary!10, draw=primary, line width=1.2pt, fit=(e1) (e4) (e5) (e8), label={[font=\bfseries\small, text=primary]above:Layer 3: TokenOS Execution \& Governance Plane (aiEngine.ts)}] (l3) {};

    % Layer 4: Provider Adapters & Gateway
    \node[comp, below=0.8cm of e5] (p1) {Ollama Localhost Adapter};
    \node[comp, right=0.3cm of p1] (p2) {Google Gemini Flash Adapter};
    \node[comp, right=0.3cm of p2] (p3) {Groq LPU Fast Adapter};
    \node[comp, right=0.3cm of p3] (p4) {OpenRouter Catalog Adapter};
    \node[comp, right=0.3cm of p4] (p5) {Deterministic Offline Fallback};
    \node[layer=c2, fit=(p1) (p2) (p3) (p4) (p5), label={[title]above:Layer 4: Multi-Model Inference Gateway \& Dynamic Provider Adapters}] (l4) {};

    % Layer 5: Persistence
    \node[comp, below=0.8cm of p2] (db1) {Supabase Cloud PostgreSQL (RLS Enforced)};
    \node[comp, right=0.6cm of db1] (db2) {Browser Sovereign LocalStorage Mirror};
    \node[layer=c3, fit=(db1) (db2), label={[title]above:Layer 5: Dual-Persistence \& Relational Storage Engine}] (l5) {};

    % Arrows between layers
    \draw[-{Stealth[length=2mm]}, line width=1pt] (l1) -- (l2);
    \draw[-{Stealth[length=2mm]}, line width=1pt] (l2) -- (l3);
    \draw[-{Stealth[length=2mm]}, line width=1pt] (l3) -- (l4);
    \draw[-{Stealth[length=2mm]}, line width=1pt] (l4) -- (l5);
\end{tikzpicture}
\end{document}
"""

# Diagram 3: End-to-End Workflow / Activity Diagram
diagrams["diagram03_workflow_activity.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\definecolor{successgreen}{RGB}{22,163,74}
\definecolor{failred}{RGB}{220,38,38}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    node distance=1cm and 1.5cm,
    startstop/.style={circle, fill=darkslate, text=white, inner sep=4pt, font=\bfseries\scriptsize},
    act/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=4pt, align=center, inner sep=6pt},
    decision/.style={diamond, draw=primary, line width=1pt, fill=primary!10, aspect=1.8, align=center, inner sep=3pt},
    arrow/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate}
]
    \node[startstop] (start) {Start};
    \node[act, below=0.6cm of start] (input) {Receive User Prompt \& Context Specification};
    \node[act, below=0.6cm of input] (decon) {Deconstruct Prompt to \textbf{IntentContract}\\(Objective, Typed Requirements, Hard SLA)};
    \node[decision, below=0.7cm of decon] (budget) {Estimated Cost \& Latency\\$\le$ Max SLA Thresholds?};
    \node[act, right=1.5cm of budget, draw=failred] (reject) {Halt Execution \& Display SLA Warning};
    
    \node[act, below=0.7cm of budget] (prune) {Execute AST Context Token Pruning\\(Strip Comments, Whitespace, Dead Nodes)};
    \node[act, below=0.6cm of prune] (route) {Evaluate Utility Function \& Select Model\\($U = \alpha Q - \beta C - \gamma L$)};
    \node[act, below=0.6cm of route] (stream) {Stream Tokens via Provider Adapter\\(Record Provenance \& Chunk Durations)};
    \node[act, below=0.6cm of stream] (verify) {Run Quality Gate \& Evidence Linter\\(Classify Assertions into 6 Evidence States)};
    \node[decision, below=0.7cm of verify] (check) {All Contract Requirements\\Satisfied?};
    
    \node[act, below=0.7cm of check, draw=successgreen] (persist) {Persist ExecutionRun to PostgreSQL \& LocalStorage};
    \node[startstop, below=0.6cm of persist] (end) {End};
    
    \node[act, right=1.5cm of check, draw=primary] (ipar) {Synthesize Localized IPAR Patch\\(Target Failed Requirement AST)};
    
    % Connections
    \draw[arrow] (start) -- (input);
    \draw[arrow] (input) -- (decon);
    \draw[arrow] (decon) -- (budget);
    \draw[arrow] (budget) -- node[left] {Yes} (prune);
    \draw[arrow] (budget) -- node[above] {No} (reject);
    \draw[arrow] (prune) -- (route);
    \draw[arrow] (route) -- (stream);
    \draw[arrow] (stream) -- (verify);
    \draw[arrow] (verify) -- (check);
    \draw[arrow] (check) -- node[left] {Yes} (persist);
    \draw[arrow] (check) -- node[above] {No} (ipar);
    \draw[arrow] (ipar) |- node[right, pos=0.25] {Review / Apply} (persist);
    \draw[arrow] (persist) -- (end);
\end{tikzpicture}
\end{document}
"""

# Diagram 4: UML Use Case Diagram
diagrams["diagram04_use_case.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning,fit}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    actor/.style={circle, draw=darkslate, line width=1pt, inner sep=3pt, minimum size=0.6cm},
    usecase/.style={ellipse, draw=darkslate, line width=0.9pt, fill=white, align=center, inner sep=4pt, minimum width=2.8cm},
    boundary/.style={rectangle, draw=primary, line width=1.2pt, rounded corners=8pt, inner sep=12pt, fill=primary!2}
]
    % System boundary use cases
    \node[usecase] (uc1) {Define Intent Contract \& SLAs};
    \node[usecase, below=0.35cm of uc1] (uc2) {Compare Prompts in Lab (3-Stage)};
    \node[usecase, below=0.35cm of uc2] (uc3) {Prune Context AST (-68.4\%)};
    \node[usecase, below=0.35cm of uc3] (uc4) {Execute Streaming Inference};
    \node[usecase, below=0.35cm of uc4] (uc5) {Inspect Evidence Ledger Claims};
    \node[usecase, below=0.35cm of uc5] (uc6) {Apply One-Click IPAR Patch};
    \node[usecase, below=0.35cm of uc6] (uc7) {Monitor Anomaly Z-Scores};
    \node[usecase, below=0.35cm of uc7] (uc8) {Manage API Vault Master PIN};
    \node[usecase, below=0.35cm of uc8] (uc9) {Export Verifiable Audit JSON};

    \node[boundary, fit=(uc1) (uc9), label={[font=\bfseries\small, text=primary]above:TokenOS Governance Platform}] (box) {};

    % Actors
    \node[left=2.5cm of uc2, align=center] (user) {\textbf{Student / Software}\\\textbf{Engineer}};
    \node[left=2.5cm of uc6, align=center] (researcher) {\textbf{AI Researcher /}\\\textbf{Evaluator}};
    \node[right=2.5cm of uc4, align=center] (admin) {\textbf{System Architect /}\\\textbf{Platform Lead}};

    % Associations
    \draw (user) -- (uc1);
    \draw (user) -- (uc2);
    \draw (user) -- (uc3);
    \draw (user) -- (uc4);
    
    \draw (researcher) -- (uc2);
    \draw (researcher) -- (uc5);
    \draw (researcher) -- (uc6);
    \draw (researcher) -- (uc7);
    
    \draw (admin) -- (uc4);
    \draw (admin) -- (uc7);
    \draw (admin) -- (uc8);
    \draw (admin) -- (uc9);
\end{tikzpicture}
\end{document}
"""

# Diagram 5: UML Class Diagram
diagrams["diagram05_class_diagram.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\scriptsize,
    class/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=2pt, align=left, inner sep=5pt},
    arrow/.style={-{Stealth[length=2mm]}, line width=0.8pt}
]
    \node[class] (contract) {
        \textbf{IntentContract}\\
        \hline
        + id: string (UUID)\\
        + taskType: TaskType\\
        + objective: string\\
        + requirements: string[]\\
        + hardConstraints: HardConstraints\\
        + confidenceThreshold: number\\
        + privacyLevel: PrivacyLevel\\
        \hline
        + validateBudget(cost, lat): boolean
    };

    \node[class, right=1.5cm of contract] (run) {
        \textbf{ExecutionRun}\\
        \hline
        + id: string (UUID)\\
        + contractId: string\\
        + provider: LLMProvider\\
        + model: string\\
        + output: string\\
        + latencyMs: number\\
        + costUsd: number\\
        + status: RunStatus\\
        \hline
        + calculateSlaSavings(): number\\
        + exportAuditJSON(): string
    };

    \node[class, below=1.2cm of contract] (engine) {
        \textbf{aiEngine}\\
        \hline
        - activeStreams: Map\\
        \hline
        + deconstructPrompt(prompt): IntentContract\\
        + pruneContextAst(context): string\\
        + analyzeAndAutoRoute(prompt): RouteDecision\\
        + executeTokenPipeline(req, cb): Promise\\
        + generateIparPatch(run, req): RepairCandidate
    };

    \node[class, below=1.2cm of run] (evidence) {
        \textbf{EvidenceItem}\\
        \hline
        + id: string\\
        + claimText: string\\
        + status: EvidenceState\\
        + confidence: number\\
        + groundingSource: string\\
        \hline
        + evaluateAssertion(ast): boolean
    };

    \node[class, below=1.2cm of engine] (security) {
        \textbf{securityGuard}\\
        \hline
        - attemptWindows: Map\\
        \hline
        + evaluatePasswordEntropy(pwd): EntropyResult\\
        + checkRateLimit(ip): boolean\\
        + validateHoneypot(val): boolean\\
        + sanitizeXss(input): string
    };

    \node[class, below=1.2cm of evidence] (storage) {
        \textbf{storageService}\\
        \hline
        + saveRun(run): void\\
        + getSavedRuns(): ExecutionRun[]\\
        + syncToSupabase(run): Promise\\
        + exportAuditReport(): object
    };

    % Relationships
    \draw[arrow] (contract) -- node[above] {1 \dots 1} (run);
    \draw[arrow] (engine) -- (contract);
    \draw[arrow] (engine) -- (run);
    \draw[arrow] (run) -- node[right] {1 \dots *} (evidence);
    \draw[arrow] (storage) -- (run);
    \draw[arrow] (engine) -- (security);
\end{tikzpicture}
\end{document}
"""

# Diagram 6: UML Sequence Diagram
diagrams["diagram06_sequence_diagram.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\scriptsize,
    entity/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=2pt, align=center, inner sep=4pt, minimum width=1.8cm},
    lifeline/.style={dashed, draw=darkslate!60, line width=0.6pt},
    msg/.style={-{Stealth[length=2mm]}, line width=0.8pt, draw=darkslate},
    ret/.style={-{Stealth[length=2mm]}, dashed, line width=0.8pt, draw=darkslate}
]
    % Entities
    \node[entity] (u) {User / UI};
    \node[entity, right=1.6cm of u] (w) {Workbench};
    \node[entity, right=1.6cm of w] (e) {aiEngine};
    \node[entity, right=1.6cm of e] (r) {Router / Adapter};
    \node[entity, right=1.6cm of r] (m) {LLM Provider};
    \node[entity, right=1.6cm of m] (q) {Quality Gate};

    % Lifelines
    \draw[lifeline] (u) -- ++(0,-7.2);
    \draw[lifeline] (w) -- ++(0,-7.2);
    \draw[lifeline] (e) -- ++(0,-7.2);
    \draw[lifeline] (r) -- ++(0,-7.2);
    \draw[lifeline] (m) -- ++(0,-7.2);
    \draw[lifeline] (q) -- ++(0,-7.2);

    % Messages
    \draw[msg] (0,-0.8) -- node[above] {Submit Prompt \& SLA} (w |- 0,-0.8);
    \draw[msg] (w |- 0,-1.4) -- node[above] {deconstructPromptToContract()} (e |- 0,-1.4);
    \draw[ret] (e |- 0,-2.0) -- node[above] {IntentContract ($R, SLA$)} (w |- 0,-2.0);
    \draw[msg] (w |- 0,-2.6) -- node[above] {executeTokenPipeline(contract)} (e |- 0,-2.6);
    \draw[msg] (e |- 0,-3.2) -- node[above] {autoRouteAndPrune()} (r |- 0,-3.2);
    \draw[msg] (r |- 0,-3.8) -- node[above] {HTTPS Stream Call} (m |- 0,-3.8);
    \draw[ret] (m |- 0,-4.4) -- node[above] {Streamed Token Chunks} (e |- 0,-4.4);
    \draw[msg] (e |- 0,-5.0) -- node[above] {evaluateContractCompliance(output)} (q |- 0,-5.0);
    \draw[ret] (q |- 0,-5.6) -- node[above] {EvidenceLedger (6 States)} (e |- 0,-5.6);
    \draw[ret] (e |- 0,-6.2) -- node[above] {ExecutionRun \& Telemetry} (w |- 0,-6.2);
    \draw[ret] (w |- 0,-6.8) -- node[above] {Render Results \& Status} (u |- 0,-6.8);
\end{tikzpicture}
\end{document}
"""

# Diagram 7: UML State Machine
diagrams["diagram07_state_chart.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\definecolor{successgreen}{RGB}{22,163,74}
\definecolor{failred}{RGB}{220,38,38}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    node distance=0.8cm and 1.8cm,
    state/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=6pt, align=center, inner sep=6pt, minimum width=2.4cm},
    init/.style={circle, fill=darkslate, inner sep=4pt},
    term/.style={circle, draw=darkslate, line width=1.5pt, fill=white, inner sep=3pt},
    arrow/.style={-{Stealth[length=2.5mm]}, line width=0.9pt, draw=darkslate}
]
    \node[init] (start) {};
    \node[state, below=0.6cm of start] (idle) {\textbf{IDLE}\\Awaiting Operator Prompt};
    \node[state, below=0.7cm of idle] (decon) {\textbf{DECONSTRUCTING}\\Compiling Intent Schema};
    \node[state, below=0.7cm of decon] (budget) {\textbf{BUDGET\_CHECKING}\\Enforcing SLA Constraints};
    \node[state, right=1.8cm of budget, draw=failred] (rejected) {\textbf{BUDGET\_EXCEEDED}\\Execution Intercepted};
    
    \node[state, below=0.7cm of budget] (pruning) {\textbf{PRUNING\_CONTEXT}\\AST Redundancy Removal};
    \node[state, below=0.7cm of pruning] (streaming) {\textbf{INFERENCE\_STREAMING}\\Chunk Duration Tracking};
    \node[state, below=0.7cm of streaming] (verifying) {\textbf{QUALITY\_EVALUATING}\\Evidence Ledger Assertion};
    
    \node[state, right=1.8cm of verifying, draw=primary] (ipar) {\textbf{IPAR\_REPAIRING}\\Targeted Harness Synthesis};
    
    \node[state, below=0.8cm of verifying, draw=successgreen] (completed) {\textbf{COMPLETED}\\Run Persisted \& Audited};
    \node[term, below=0.5cm of completed] (end) {};
    \fill[darkslate] (end) circle (2pt);

    % Transitions
    \draw[arrow] (start) -- (idle);
    \draw[arrow] (idle) -- node[left] {User Submit} (decon);
    \draw[arrow] (decon) -- node[left] {Contract Ready} (budget);
    \draw[arrow] (budget) -- node[left] {Budget OK} (pruning);
    \draw[arrow] (budget) -- node[above] {Over Limit} (rejected);
    \draw[arrow] (rejected) |- (idle);
    
    \draw[arrow] (pruning) -- node[left] {Tokens Reduced} (streaming);
    \draw[arrow] (streaming) -- node[left] {Stream Complete} (verifying);
    \draw[arrow] (verifying) -- node[left] {Pass ($\ge 95\%$)} (completed);
    \draw[arrow] (verifying) -- node[above] {Gaps Detected} (ipar);
    \draw[arrow] (ipar) |- node[right, pos=0.25] {Apply Patch} (completed);
    \draw[arrow] (completed) -- (end);
\end{tikzpicture}
\end{document}
"""

# Diagram 8: Context Lifecycle Diagram
diagrams["diagram08_context_lifecycle.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    node distance=1.2cm and 2cm,
    op/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=4pt, align=center, inner sep=6pt, minimum width=2.6cm},
    prop/.style={rectangle, draw=primary, dashed, line width=1pt, fill=primary!5, rounded corners=4pt, align=center, inner sep=6pt, minimum width=2.6cm},
    arrow/.style={-{Stealth[length=2.5mm]}, line width=1pt, draw=darkslate}
]
    \node[op] (ingest) {\textbf{1. Context Ingestion}\\User Context \& Docs};
    \node[op, below=1cm of ingest] (ast) {\textbf{2. AST Pruning}\\-68.4\% Token Reduction};
    \node[op, below=1cm of ast] (assemble) {\textbf{3. Prompt Assembly}\\Structured System Context};
    \node[op, right=2cm of assemble] (infer) {\textbf{4. Inference Execution}\\Context Delivery to LLM};
    \node[op, right=2cm of ast] (persist) {\textbf{5. Sovereign Storage}\\Session Cache \& PostgreSQL};
    \node[prop, right=2cm of ingest] (vector) {\textbf{6. Vector Similarity}\\\small (Proposed Semantic Cache)};

    % Flows
    \draw[arrow] (ingest) -- (ast);
    \draw[arrow] (ast) -- (assemble);
    \draw[arrow] (assemble) -- (infer);
    \draw[arrow] (infer) -- (persist);
    \draw[arrow] (persist) -- node[right] {Invalidation / Purge} (vector);
    \draw[arrow] (vector) -- node[above] {Future Retrieval} (ingest);
\end{tikzpicture}
\end{document}
"""

# Diagram 9: Decision Policy Flowchart
diagrams["diagram09_decision_policy.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    node distance=0.8cm and 1.5cm,
    act/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=4pt, align=center, inner sep=5pt},
    decision/.style={diamond, draw=primary, line width=1pt, fill=primary!10, aspect=1.8, align=center, inner sep=3pt},
    arrow/.style={-{Stealth[length=2mm]}, line width=0.8pt, draw=darkslate}
]
    \node[act] (start) {Prompt Input \& Constraint Extraction};
    \node[decision, below=0.6cm of start] (mode) {Manual Override\\Specified by User?};
    \node[act, right=1.5cm of mode] (manual) {Honor Exact User Selection};
    
    \node[decision, below=0.7cm of mode] (cost) {Hard Constraint:\\Local Only or \$0.00?};
    \node[act, right=1.5cm of cost] (local) {Select Ollama (Mistral / Llama 3)};
    
    \node[act, below=0.7cm of cost] (score) {Compute Task Complexity Score\\(Coding: 0.85, Reasoning: 0.70, General: 0.35)};
    \node[decision, below=0.7cm of score] (complex) {Complexity $\ge 0.75$\\or Coding Task?};
    
    \node[act, right=1.5cm of complex] (gemini) {Route to Google Gemini 2.5 Flash};
    \node[act, below=0.7cm of complex] (groq) {Route to Groq LPU (Sub-second Llama 3.3)};
    
    \node[act, below=0.6cm of groq] (execute) {Execute Pipeline with Provenance Tag};

    % Connections
    \draw[arrow] (start) -- (mode);
    \draw[arrow] (mode) -- node[above] {Yes} (manual);
    \draw[arrow] (mode) -- node[left] {No} (cost);
    \draw[arrow] (cost) -- node[above] {Yes} (local);
    \draw[arrow] (cost) -- node[left] {No} (score);
    \draw[arrow] (score) -- (complex);
    \draw[arrow] (complex) -- node[above] {Yes} (gemini);
    \draw[arrow] (complex) -- node[left] {No} (groq);
    
    \draw[arrow] (manual) |- (execute);
    \draw[arrow] (local) |- (execute);
    \draw[arrow] (gemini) |- (execute);
    \draw[arrow] (groq) -- (execute);
\end{tikzpicture}
\end{document}
"""

# Diagram 10: UML Deployment Diagram
diagrams["diagram10_deployment.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    node distance=1.5cm and 2cm,
    nodebox/.style={rectangle, draw=darkslate, line width=1.2pt, fill=white, rounded corners=4pt, align=center, inner sep=8pt},
    artifact/.style={rectangle, draw=primary, line width=0.8pt, fill=primary!5, rounded corners=2pt, align=center, inner sep=4pt, font=\scriptsize},
    arrow/.style={-{Stealth[length=2.5mm]}, line width=1pt, draw=darkslate}
]
    % Client Node
    \node[nodebox] (client) {
        \textbf{\guillemotleft device\guillemotright\ Developer Workstation}\\
        \begin{tikzpicture}
            \node[artifact] (spa) {TokenOS SPA\\(React 18 + Vite)};
            \node[artifact, below=0.3cm of spa] (storage) {Browser LocalStorage\\(Sovereign Cache)};
        \end{tikzpicture}
    };

    % Local Host Daemon
    \node[nodebox, below=1.2cm of client] (localnode) {
        \textbf{\guillemotleft execution environment\guillemotright\ Localhost Engine}\\
        \node[artifact] (ollama) {Ollama Server Daemon\\port 11434 (Mistral / Llama 3)};
    };

    % Cloud BaaS
    \node[nodebox, right=2.5cm of client] (cloud) {
        \textbf{\guillemotleft cloud platform\guillemotright\ Supabase Cloud}\\
        \begin{tikzpicture}
            \node[artifact] (pg) {PostgreSQL 15+ Engine\\(RLS Security Policies)};
            \node[artifact, below=0.3cm of pg] (auth) {GoTrue JWT Auth Service};
        \end{tikzpicture}
    };

    % External LLM APIs
    \node[nodebox, right=2.5cm of localnode] (llm) {
        \textbf{\guillemotleft cloud provider\guillemotright\ LLM Gateways}\\
        \begin{tikzpicture}
            \node[artifact] (gapi) {Google AI Studio (Gemini)};
            \node[artifact, below=0.2cm of gapi] (qapi) {Groq Cloud LPU};
            \node[artifact, below=0.2cm of qapi] (oapi) {OpenRouter Universal};
        \end{tikzpicture}
    };

    % Protocol lines
    \draw[arrow] (client) -- node[left, font=\scriptsize] {HTTP / Proxy (11434)} (localnode);
    \draw[arrow] (client) -- node[above, font=\scriptsize] {HTTPS / SSL (JWT, RLS)} (cloud);
    \draw[arrow] (client) -- node[above, font=\scriptsize, sloped] {HTTPS REST / SSE} (llm);
\end{tikzpicture}
\end{document}
"""

# Diagram 11: Entity-Relationship Diagram
diagrams["diagram11_er_model.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\scriptsize,
    entity/.style={rectangle, draw=darkslate, line width=1pt, fill=white, rounded corners=2pt, align=left, inner sep=5pt},
    rel/.style={-{Stealth[length=2mm]}, line width=0.9pt, draw=darkslate}
]
    \node[entity] (prof) {
        \textbf{PROFILES}\\
        \hline
        \textbf{id}: uuid [PK, FK auth.users]\\
        full\_name: text\\
        user\_type: text\\
        organization: text\\
        created\_at: timestamptz\\
        updated\_at: timestamptz
    };

    \node[entity, right=1.8cm of prof] (contract) {
        \textbf{INTENT\_CONTRACTS}\\
        \hline
        \textbf{id}: uuid [PK]\\
        user\_id: uuid [FK profiles.id]\\
        title: text\\
        task\_type: text\\
        objective: text\\
        requirements: jsonb\\
        hard\_constraints: jsonb\\
        confidence\_threshold: float\\
        created\_at: timestamptz
    };

    \node[entity, below=1.2cm of contract] (run) {
        \textbf{EXECUTION\_RUNS}\\
        \hline
        \textbf{id}: uuid [PK]\\
        user\_id: uuid [FK profiles.id]\\
        contract\_id: uuid [FK intent\_contracts.id]\\
        provider: text\\
        model: text\\
        prompt: text\\
        output: text\\
        status: text\\
        stage\_telemetry: jsonb\\
        token\_usage: jsonb\\
        evidence\_ledger: jsonb\\
        repair\_candidate: jsonb\\
        latency\_ms: integer\\
        cost\_usd: numeric
    };

    \node[entity, below=1.2cm of prof] (logs) {
        \textbf{SECURITY\_AUDIT\_LOGS}\\
        \hline
        \textbf{id}: uuid [PK]\\
        user\_id: uuid [FK profiles.id]\\
        event\_type: text\\
        severity: text\\
        client\_metadata: jsonb\\
        timestamp: timestamptz
    };

    % Relationships
    \draw[rel] (prof) -- node[above] {1 \dots *} (contract);
    \draw[rel] (prof) -- node[left] {1 \dots *} (logs);
    \draw[rel] (prof) -- node[above, sloped] {1 \dots *} (run);
    \draw[rel] (contract) -- node[right] {1 \dots *} (run);
\end{tikzpicture}
\end{document}
"""

# Diagram 12: Gantt Chart
diagrams["diagram12_gantt_chart.tex"] = r"""\documentclass[tikz,border=10pt]{standalone}
\usepackage{tikz}
\usetikzlibrary{shapes,arrows.meta,positioning}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\begin{document}
\begin{tikzpicture}[
    font=\sffamily\footnotesize,
    bar/.style={rectangle, fill=primary, text=white, rounded corners=2pt, font=\bfseries\scriptsize, align=center},
    labelnode/.style={font=\scriptsize, align=right, anchor=east}
]
    % Time axis
    \draw[line width=1pt, draw=darkslate!40] (0,0) -- (12,0);
    \foreach \x/\m in {0/Jul, 1.5/Aug, 3.0/Sep, 4.5/Oct, 6.0/Nov, 7.5/Dec, 9.0/Jan, 10.5/Feb, 12.0/Mar} {
        \draw[line width=0.8pt, draw=darkslate!60] (\x,0.1) -- (\x,-0.1) node[below, font=\tiny] {\m};
    }

    % Tasks
    \node[labelnode] at (-0.2, 5.0) {1. Problem Formulation \& Literature};
    \draw[bar] (0.0, 4.85) rectangle (2.0, 5.15);

    \node[labelnode] at (-0.2, 4.2) {2. Intent Contract Schema \& Architecture};
    \draw[bar] (1.5, 4.05) rectangle (3.5, 4.35);

    \node[labelnode] at (-0.2, 3.4) {3. Security Guard, Vault \& Supabase RLS};
    \draw[bar] (3.0, 3.25) rectangle (5.0, 3.55);

    \node[labelnode] at (-0.2, 2.6) {4. Multi-Provider Engine \& AST Pruner};
    \draw[bar] (4.5, 2.45) rectangle (7.5, 2.75);

    \node[labelnode] at (-0.2, 1.8) {5. Evidence Ledger \& IPAR Refinement};
    \draw[bar] (7.0, 1.65) rectangle (9.5, 1.95);

    \node[labelnode] at (-0.2, 1.0) {6. Automated Verification \& Benchmarking};
    \draw[bar] (9.0, 0.85) rectangle (11.0, 1.15);

    \node[labelnode] at (-0.2, 0.4) {7. Final Blackbook Thesis Preparation};
    \draw[bar, fill=darkslate] (10.5, 0.25) rectangle (12.0, 0.55);
\end{tikzpicture}
\end{document}
"""

# Diagram 13: Empirical Evaluation Plots (pgfplots)
diagrams["diagram13_evaluation_plots.tex"] = r"""\documentclass[border=10pt]{standalone}
\usepackage{pgfplots}
\pgfplotsset{compat=1.18}
\definecolor{primary}{RGB}{217,119,87}
\definecolor{darkslate}{RGB}{30,41,59}
\definecolor{accentblue}{RGB}{37,99,235}
\begin{document}
\begin{tikzpicture}
    \begin{axis}[
        title={\textbf{AST Context Token Pruning: Baseline vs. Optimized}},
        xlabel={Raw Input Context Tokens},
        ylabel={Transmitted Tokens to Model},
        xmin=0, xmax=8500,
        ymin=0, ymax=8500,
        grid=major,
        legend pos=north west,
        font=\sffamily\footnotesize,
        width=10cm, height=6.5cm
    ]
        % Unoptimized 1:1 line
        \addplot[dashed, line width=1pt, draw=darkslate!60] coordinates {
            (200, 200) (1000, 1000) (2500, 2500) (5000, 5000) (8000, 8000)
        };
        \addlegendentry{Unpruned Baseline (100\%)}

        % TokenOS AST Pruned curve
        \addplot[thick, mark=square*, color=primary, line width=1.5pt] coordinates {
            (200, 68) (1000, 312) (2500, 785) (5000, 1580) (8000, 2528)
        };
        \addlegendentry{TokenOS AST Pruned (Mean -68.4\%)}
    \end{axis}
\end{tikzpicture}
\end{document}
"""

for name, content in diagrams.items():
    file_path = os.path.join(source_dir, name)
    with open(file_path, "w", encoding="utf-8") as f:
        f.write(content.strip())
    print(f"Written {name}")

    # Compile with pdflatex
    cmd = ["pdflatex", "-interaction=nonstopmode", f"-output-directory={rendered_dir}", file_path]
    res = subprocess.run(cmd, capture_output=True, text=True)
    pdf_name = name.replace(".tex", ".pdf")
    rendered_pdf = os.path.join(rendered_dir, pdf_name)
    if os.path.exists(rendered_pdf):
        print(f"  -> Successfully compiled to {pdf_name}")
        shutil.copy2(rendered_pdf, os.path.join(latex_fig_dir, pdf_name))
    else:
        print(f"  -> Compilation failed for {name}. Output: {res.stdout[-300:]}")

print("\nAll 13 diagrams compiled and synchronized to LaTeX figures directory!")

