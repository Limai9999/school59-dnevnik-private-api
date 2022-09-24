import express from 'express';
const router = express.Router();

import getSchedule from '../methods/getSchedule';
import parseSchedule from '../methods/parseSchedule';
import saveFile from '../methods/saveFile';

router.get('/get', getSchedule);
router.get('/parse', parseSchedule);
router.post('/saveFile', saveFile);

export default router;
