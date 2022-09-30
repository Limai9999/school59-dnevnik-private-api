import express from 'express';
const router = express.Router();

import {MethodInputData} from '../types/methods/MethodInputData';

import getCookies from '../methods/login/getCookies';
import closeSession from '../methods/login/closeSession';

router.get('/getCookies', (req, res) => getCookies({req, res} as MethodInputData));
router.get('/closeSession', (req, res) => closeSession({req, res} as MethodInputData));

export default router;
