import express from 'express';
const router = express.Router();

import {MethodInputData} from '../types/Methods/MethodInputData';

import getTotalStudentReport from '../methods/grades/getTotalStudentReport';
import getReportScreenshot from '../methods/grades/getReportScreenshot';

router.get('/getTotalStudentReport', (req, res) => getTotalStudentReport({req, res} as MethodInputData));
router.get('/getReportScreenshot', (req, res) => getReportScreenshot({req, res} as MethodInputData));

export default router;
