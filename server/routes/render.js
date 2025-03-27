import express from 'express';
import { renderVideo } from '../controllers/renderController.js';

const router = express.Router();

router.post('/', renderVideo);

export default router;