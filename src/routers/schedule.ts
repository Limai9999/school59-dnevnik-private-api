import express from 'express';
const router = express.Router();

import getSchedule from '../methods/schedule/getSchedule';
import parseSchedule from '../methods/schedule/parseSchedule';
import saveFile from '../methods/schedule/saveFile';

import {MethodInputData} from '../types/methods/MethodInputData';

router.get('/get', (req, res) => getSchedule({req, res} as MethodInputData));
router.get('/parse', (req, res) => parseSchedule({req, res} as MethodInputData));
router.post('/saveFile', (req, res) => saveFile({req, res} as MethodInputData));

export default router;
