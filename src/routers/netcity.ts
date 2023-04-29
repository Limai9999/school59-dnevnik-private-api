import express from 'express';
const router = express.Router();

import { MethodInputData } from '../types/Methods/MethodInputData';

import getCookies from '../methods/netcity/getCookies';
import closeSession from '../methods/netcity/closeSession';
import downloadAttachment from '../methods/netcity/downloadAttachment';

router.get('/getCookies', (req, res) => getCookies({ req, res } as MethodInputData));
router.get('/closeSession', (req, res) => closeSession({ req, res } as MethodInputData));
router.post('/downloadAttachment', (req, res) => downloadAttachment({ req, res } as MethodInputData));

export default router;
