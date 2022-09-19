import express from 'express';
const router = express.Router();

import getSchedule from '../methods/getSchedule';
import parseSchedule from '../methods/parseSchedule';

router.get('/get', getSchedule);
router.get('/parse', parseSchedule);

export default router;
