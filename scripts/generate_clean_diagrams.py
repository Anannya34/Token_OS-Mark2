import matplotlib.pyplot as plt
import matplotlib.patches as patches
from matplotlib.patches import FancyBboxPatch, FancyArrowPatch
import os

# Set font family
plt.rcParams['font.sans-serif'] = 'DejaVu Sans'
plt.rcParams['font.family'] = 'sans-serif'

def create_system_context_diagram(output_png, output_pdf):
    # Expanded horizontal aspect ratio: 13 x 7.5 inches
    fig, ax = plt.subplots(figsize=(13, 7.5), dpi=300)
    ax.set_xlim(-0.5, 12.5)
    ax.set_ylim(-0.5, 7.5)
    ax.axis('off')

    # Title
    ax.text(6.0, 7.2, "Figure 4.1: TokenOS System Context Diagram", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#0f172a')

    # Styles
    box_props = {
        'boxstyle': 'round,pad=0.5,rounding_size=0.3',
        'linewidth': 1.8,
    }

    # 1. Central Governance Boundary
    center_box = FancyBboxPatch((3.7, 1.8), 4.6, 3.4,
                                boxstyle="round,pad=0.1,rounding_size=0.3",
                                ec="#D97706", fc="#FFFBEB", lw=2.2, zorder=2)
    ax.add_patch(center_box)
    
    ax.text(6.0, 4.6, "TokenOS Platform\n(Central Governance Boundary)", 
            ha='center', va='center', fontsize=12, fontweight='bold', color='#92400E', zorder=3)
    
    bullets = (
        "• Pre-flight Intent Compilation\n"
        "• AST Context Pruner (-68.4% tokens)\n"
        "• Multi-Model Utility Router\n"
        "• Quality Gate & IPAR Self-Repair"
    )
    ax.text(6.0, 3.1, bullets, ha='center', va='center', fontsize=9.5, color='#451A03', linespacing=1.6, zorder=3)

    # 2. Top: Supabase Cloud
    top_box = FancyBboxPatch((4.2, 5.8), 3.6, 1.05,
                             boxstyle="round,pad=0.1,rounding_size=0.25",
                             ec="#DB2777", fc="#FDF2F8", lw=1.8, zorder=2)
    ax.add_patch(top_box)
    ax.text(6.0, 6.32, "Supabase Cloud\n(PostgreSQL + RLS)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#9D174D', zorder=3)

    # 3. Bottom: MCP Tool Hub
    bottom_box = FancyBboxPatch((4.2, 0.2), 3.6, 1.05,
                                boxstyle="round,pad=0.1,rounding_size=0.25",
                                ec="#334155", fc="#F8FAFC", lw=1.8, zorder=2)
    ax.add_patch(bottom_box)
    ax.text(6.0, 0.72, "MCP Tool Hub\n(Postgres, Git, Filesystem)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#1E293B', zorder=3)

    # 4. Left Top: End User / Developer (moved slightly right to ensure full outline is visible)
    user_box = FancyBboxPatch((0.2, 4.3), 2.7, 1.15,
                              boxstyle="round,pad=0.1,rounding_size=0.25",
                              ec="#0284C7", fc="#F0F9FF", lw=1.8, zorder=2)
    ax.add_patch(user_box)
    ax.text(1.55, 4.87, "End User / Developer\n(Web Browser)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#0369A1', zorder=3)

    # 5. Left Bottom: Local Sovereign LLM
    ollama_box = FancyBboxPatch((0.2, 1.5), 2.7, 1.15,
                                boxstyle="round,pad=0.1,rounding_size=0.25",
                                ec="#D97706", fc="#FFFBEB", lw=1.8, zorder=2)
    ax.add_patch(ollama_box)
    ax.text(1.55, 2.07, "Local Sovereign LLM\n(Ollama: 11434)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#B45309', zorder=3)

    # 6. Right Top: Cloud Frontier LLM
    gemini_box = FancyBboxPatch((9.1, 4.3), 2.7, 1.15,
                                boxstyle="round,pad=0.1,rounding_size=0.25",
                                ec="#16A34A", fc="#F0FDF4", lw=1.8, zorder=2)
    ax.add_patch(gemini_box)
    ax.text(10.45, 4.87, "Cloud Frontier LLM\n(Google Gemini Studio)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#15803D', zorder=3)

    # 7. Right Bottom: Fast Cloud LPU
    groq_box = FancyBboxPatch((9.1, 1.5), 2.7, 1.15,
                              boxstyle="round,pad=0.1,rounding_size=0.25",
                              ec="#9333EA", fc="#FAF5FF", lw=1.8, zorder=2)
    ax.add_patch(groq_box)
    ax.text(10.45, 2.07, "Fast Cloud LPU\n(Groq Llama 3.3 70B)", 
            ha='center', va='center', fontsize=10, fontweight='bold', color='#7E22CE', zorder=3)

    # ARROWS & LABELS (Carefully offset so text and arrows NEVER collide with boxes)

    # User -> Center
    arr_user = FancyArrowPatch((2.9, 4.7), (3.7, 4.0),
                               arrowstyle="-|>", mutation_scale=16,
                               color="#0284C7", lw=1.8, zorder=4)
    ax.add_patch(arr_user)
    ax.text(3.3, 4.75, "Prompts / Constraints\nInteractive GUI", 
            ha='center', va='bottom', fontsize=8.2, fontweight='semibold', color="#0369A1", zorder=5)

    # Ollama -> Center
    arr_ollama = FancyArrowPatch((2.9, 2.2), (3.7, 2.8),
                                 arrowstyle="<|-|>", mutation_scale=15,
                                 color="#D97706", lw=1.8, zorder=4)
    ax.add_patch(arr_ollama)
    ax.text(3.3, 1.95, "Localhost Proxy\nZero-Egress Inference", 
            ha='center', va='top', fontsize=8.2, fontweight='semibold', color="#B45309", zorder=5)

    # Center <-> Supabase
    arr_supa = FancyArrowPatch((6.0, 5.2), (6.0, 5.8),
                               arrowstyle="<|-|>", mutation_scale=15,
                               color="#DB2777", lw=1.8, zorder=4)
    ax.add_patch(arr_supa)
    ax.text(6.0, 5.48, " JWT Auth & Relational Sync (RLS) ", 
            ha='center', va='center', fontsize=8.2, fontweight='semibold', color="#9D174D",
            bbox=dict(boxstyle='square,pad=0.15', fc='white', ec='none', alpha=0.9), zorder=5)

    # Center <-> MCP Hub
    arr_mcp = FancyArrowPatch((6.0, 1.8), (6.0, 1.25),
                              arrowstyle="<|-|>", mutation_scale=15,
                              color="#334155", lw=1.8, zorder=4)
    ax.add_patch(arr_mcp)
    ax.text(6.0, 1.52, " Tool Sandbox Contract / Connectors ", 
            ha='center', va='center', fontsize=8.2, fontweight='semibold', color="#334155",
            bbox=dict(boxstyle='square,pad=0.15', fc='white', ec='none', alpha=0.9), zorder=5)

    # Center -> Gemini
    arr_gem = FancyArrowPatch((8.3, 4.0), (9.1, 4.7),
                              arrowstyle="<|-|>", mutation_scale=15,
                              color="#16A34A", lw=1.8, zorder=4)
    ax.add_patch(arr_gem)
    ax.text(8.7, 4.75, "HTTPS REST (HTTP 200)\nFrontier Streaming", 
            ha='center', va='bottom', fontsize=8.2, fontweight='semibold', color="#15803D", zorder=5)

    # Center -> Groq
    arr_groq = FancyArrowPatch((8.3, 2.8), (9.1, 2.2),
                               arrowstyle="<|-|>", mutation_scale=15,
                               color="#9333EA", lw=1.8, zorder=4)
    ax.add_patch(arr_groq)
    ax.text(8.7, 1.95, "Sub-Second LPU\nInference Stream", 
            ha='center', va='top', fontsize=8.2, fontweight='semibold', color="#7E22CE", zorder=5)

    plt.tight_layout()
    plt.savefig(output_png, dpi=300, bbox_inches='tight', pad_inches=0.1)
    plt.savefig(output_pdf, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    print("Generated:", output_png, "and", output_pdf)

def create_layered_architecture_diagram(output_png, output_pdf):
    # Expanded horizontal aspect ratio: 14 x 7.5 inches
    fig, ax = plt.subplots(figsize=(14, 7.5), dpi=300)
    ax.set_xlim(-0.2, 14.2)
    ax.set_ylim(-0.4, 7.6)
    ax.axis('off')

    # Title
    ax.text(7.0, 7.3, "Figure 4.2: Layered System Architecture of TokenOS", 
            ha='center', va='center', fontsize=14, fontweight='bold', color='#0f172a')

    # Layers data: (name, bg_color, border_color, sub_boxes)
    layers_data = [
        # Layer 1
        ("Layer 1: Presentation & Client UI (React 18 + Vite 5 + Tailwind CSS)",
         "#E0F2FE", "#0284C7",
         [
             ("Workbench Intent\nContract Editor", 2.6),
             ("Execution Telemetry\nStepper & Logs", 2.6),
             ("Quality Gate &\nEvidence Ledger", 2.6),
             ("IPAR Refinement\n& Self-Repair", 2.6),
             ("Observability &\nTrace Insights", 2.6)
         ]),
        # Layer 2
        ("Layer 2: Client-Side Security Guard & Key Vault (Zero-Trust)",
         "#FEF3C7", "#D97706",
         [
             ("Sliding-Window Rate\nLimiter (60s Lockout)", 3.25),
             ("Honeypot Bot\nTrap Detector", 3.25),
             ("Password Entropy\nEvaluator", 3.25),
             ("Master PIN\nAnti-Pattern Vault", 3.25)
         ]),
        # Layer 3
        ("Layer 3: Pre-Flight Intent & Policy Governance Plane",
         "#FFE4E6", "#E11D48",
         [
             ("Prompt Deconstruction\nEngine", 3.25),
             ("IntentContract Schema\nSerializer", 3.25),
             ("SLA Hard Budget Gating\n($C_{\\max} \\leq \\$0.05, T_{\\max} \\leq 5000\\mathrm{ms}$)", 3.25),
             ("AST Redundancy Pruner\n(-68.4% Tokens)", 3.25)
         ]),
        # Layer 4
        ("Layer 4: Multi-Model Inference & Routing Gateway",
         "#DCFCE7", "#16A34A",
         [
             ("Local Ollama Adapter\n(Mistral / Llama-3)", 3.25),
             ("Google Gemini Studio\n(Gemini 2.5 Flash)", 3.25),
             ("Groq Cloud LPU\n(Llama 3.3 70B)", 3.25),
             ("Deterministic Browser\nSynthesizer (Offline)", 3.25)
         ]),
        # Layer 5
        ("Layer 5: Verification, Self-Healing & Dual-Persistence Layer",
         "#F3E8FF", "#9333EA",
         [
             ("Deterministic AST\nQuality Gate", 2.6),
             ("6-State Evidence\nLedger Auditor", 2.6),
             ("IPAR Targeted Patch\nGenerator", 2.6),
             ("Supabase PostgreSQL\n(Cryptographic RLS)", 2.6),
             ("Sovereign Browser\nLocalStorage Mirror", 2.6)
         ])
    ]

    y_positions = [5.7, 4.35, 3.0, 1.65, 0.3]
    layer_h = 1.15
    layer_w = 13.6
    layer_x = 0.4

    for i, (layer_title, bg_col, border_col, sub_boxes) in enumerate(layers_data):
        y = y_positions[i]
        
        # Outer container box
        container = FancyBboxPatch((layer_x, y), layer_w, layer_h,
                                   boxstyle="round,pad=0.08,rounding_size=0.18",
                                   ec=border_col, fc=bg_col, lw=2.0, zorder=2)
        ax.add_patch(container)
        
        # Layer Header text
        ax.text(layer_x + 0.25, y + layer_h - 0.22, layer_title, 
                ha='left', va='center', fontsize=9.8, fontweight='bold', color='#0f172a', zorder=3)
        
        # Sub-boxes
        n_subs = len(sub_boxes)
        spacing = 0.16
        total_spacing = spacing * (n_subs - 1)
        avail_w = layer_w - 0.5 - total_spacing
        box_w = avail_w / n_subs
        sub_h = 0.58
        sub_y = y + 0.12
        
        curr_x = layer_x + 0.25
        for sub_text, _ in sub_boxes:
            s_box = FancyBboxPatch((curr_x, sub_y), box_w, sub_h,
                                   boxstyle="round,pad=0.04,rounding_size=0.1",
                                   ec=border_col, fc="white", lw=1.2, zorder=3)
            ax.add_patch(s_box)
            
            ax.text(curr_x + box_w / 2.0, sub_y + sub_h / 2.0, sub_text,
                    ha='center', va='center', fontsize=7.6, fontweight='semibold', 
                    color='#1e293b', linespacing=1.2, zorder=4)
            curr_x += box_w + spacing

        # Arrow down to next layer
        if i < len(layers_data) - 1:
            next_y = y_positions[i+1] + layer_h
            arr = FancyArrowPatch((7.0, y - 0.02), (7.0, next_y + 0.02),
                                  arrowstyle="-|>", mutation_scale=15,
                                  color="#475569", lw=2.0, zorder=5)
            ax.add_patch(arr)

    plt.tight_layout()
    plt.savefig(output_png, dpi=300, bbox_inches='tight', pad_inches=0.1)
    plt.savefig(output_pdf, bbox_inches='tight', pad_inches=0.1)
    plt.close()
    print("Generated:", output_png, "and", output_pdf)

if __name__ == '__main__':
    base_dirs = [
        r"D:\token-mark1\APITrust_OS_Research-Final-Draft\figures",
        r"D:\token-mark1\TokenOS_Research_Paper\figures",
        r"D:\token-mark1\reports\TokenOS_Blackbook\05_LATEX\figures"
    ]
    for b in base_dirs:
        os.makedirs(b, exist_ok=True)
        p1_png = os.path.join(b, "diagram_01_system_context.png")
        p1_pdf = os.path.join(b, "diagram_01_system_context.pdf")
        create_system_context_diagram(p1_png, p1_pdf)

        p2_png = os.path.join(b, "diagram_02_system_architecture.png")
        p2_pdf = os.path.join(b, "diagram_02_system_architecture.pdf")
        create_layered_architecture_diagram(p2_png, p2_pdf)
