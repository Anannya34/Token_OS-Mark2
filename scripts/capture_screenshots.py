import subprocess
import time
import os
import shutil

screens = [
    ("EV-UI-001_splash_screen.png", "http://localhost:4173/"),
    ("EV-UI-002_login_screen.png", "http://localhost:4173/?skip_splash=1"),
    ("EV-UI-003_workbench_command_center.png", "http://localhost:4173/?auth=1&tab=workbench"),
    ("EV-UI-004_execution_control.png", "http://localhost:4173/?auth=1&tab=execution"),
    ("EV-UI-005_quality_evidence_ledger.png", "http://localhost:4173/?auth=1&tab=quality"),
    ("EV-UI-006_repair_refinement_ipar.png", "http://localhost:4173/?auth=1&tab=repair"),
    ("EV-UI-007_ml_predictions_anomaly.png", "http://localhost:4173/?auth=1&tab=ml_predictions"),
    ("EV-UI-008_mcp_connectors_hub.png", "http://localhost:4173/?auth=1&tab=mcp_hub"),
    ("EV-UI-009_audit_trace_insights.png", "http://localhost:4173/?auth=1&tab=insights")
]

chrome_path = r"C:\Program Files\Google\Chrome\Application\chrome.exe"
dest_dir = r"D:\token-mark1\reports\TokenOS_Blackbook\02_EVIDENCES\screenshots"
latex_fig_dir = r"D:\token-mark1\reports\TokenOS_Blackbook\05_LATEX\figures"

os.makedirs(dest_dir, exist_ok=True)
os.makedirs(latex_fig_dir, exist_ok=True)

for fname, url in screens:
    out_path = os.path.join(dest_dir, fname)
    cmd = [
        chrome_path,
        "--headless=new",
        "--disable-gpu",
        "--window-size=1440,900",
        f"--screenshot={out_path}",
        url
    ]
    print(f"Capturing {fname} from {url}...")
    res = subprocess.run(cmd, capture_output=True, text=True)
    if os.path.exists(out_path):
        size = os.path.getsize(out_path)
        print(f"  -> Success: {size} bytes")
        shutil.copy2(out_path, os.path.join(latex_fig_dir, fname))
    else:
        print(f"  -> Failed. stderr: {res.stderr}")
    time.sleep(1)

print("Screenshot capture sequence completed!")

