import { Router } from 'express';
import {
  createAiProject,
  generateCode,
  modifyCode,
  chatWithAi,
  uploadAiAsset,
  deployAiGame,
  getAiBuildStatus,
  createGameFromPrompt,
  generateUnrealMap,
} from '../ai/aiController';

const router = Router();

router.post('/create-project', createAiProject);
router.post('/generate-code', generateCode);
router.post('/modify-code', modifyCode);
router.post('/chat', chatWithAi);
router.post('/upload-asset', uploadAiAsset);
router.post('/deploy', deployAiGame);
router.get('/build/:buildId', getAiBuildStatus);
router.post('/create-from-prompt', createGameFromPrompt);
router.post('/generate-unreal-map', generateUnrealMap);

export default router;
