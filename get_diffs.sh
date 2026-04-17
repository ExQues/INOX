#!/bin/bash
FILES=(
  "/workspace/README.md"
  "/workspace/api/ai/aiController.ts"
  "/workspace/api/routes/aiRoutes.ts"
  "/workspace/api/services/aiService.ts"
  "/workspace/api/services/assetService.ts"
  "/workspace/api/services/supabaseService.ts"
  "/workspace/docs/arquitetura_geracao_3d.md"
  "/workspace/docs/continuous_loop_workflow.md"
  "/workspace/package-lock.json"
  "/workspace/package.json"
  "/workspace/src/App.tsx"
  "/workspace/src/components/editor/Viewport3D.tsx"
  "/workspace/src/lib/ai-sdk/inoxAiSdk.ts"
  "/workspace/src/pages/Dashboard.tsx"
  "/workspace/src/pages/Editor.tsx"
  "/workspace/src/store/useStore.ts"
)

for file in "${FILES[@]}"; do
  echo "--- FILE: $file ---"
  git --no-pager diff origin/main...trae/solo-agent-t160ZP -- "$file"
done
