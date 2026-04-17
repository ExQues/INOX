import subprocess
import os

files = [
  "/workspace/README.md",
  "/workspace/api/ai/aiController.ts",
  "/workspace/api/routes/aiRoutes.ts",
  "/workspace/api/services/aiService.ts",
  "/workspace/api/services/assetService.ts",
  "/workspace/api/services/supabaseService.ts",
  "/workspace/docs/arquitetura_geracao_3d.md",
  "/workspace/docs/continuous_loop_workflow.md",
  "/workspace/package-lock.json",
  "/workspace/package.json",
  "/workspace/src/App.tsx",
  "/workspace/src/components/editor/Viewport3D.tsx",
  "/workspace/src/lib/ai-sdk/inoxAiSdk.ts",
  "/workspace/src/pages/Dashboard.tsx",
  "/workspace/src/pages/Editor.tsx",
  "/workspace/src/store/useStore.ts"
]

for f in files:
    print(f"--- {f} ---")
    result = subprocess.run(["git", "--no-pager", "diff", "origin/main...trae/solo-agent-t160ZP", "--", f], capture_output=True, text=True)
    lines = result.stdout.splitlines()
    if len(lines) > 50:
        print("\n".join(lines[:20]))
        print("... [truncated] ...")
        print("\n".join(lines[-20:]))
    else:
        print("\n".join(lines))
    print("\n")
