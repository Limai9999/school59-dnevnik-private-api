import {MethodInputData} from '../../types/Methods/MethodInputData';

import fetch from 'node-fetch';
import path from 'path';
import {createWriteStream} from 'fs';

const isTest = false;

async function downloadAttachment({req, res}: MethodInputData) {
  const {netcitySession, utils} = req.app.locals;

  if (!req.body) {
    return res.json({
      status: false,
      error: 'sessionId и attachmentId и filename не введены.',
    });
  }

  const {sessionId, attachmentId, filename}: {sessionId: number, attachmentId: number, filename: string} = req.body;
  if (!sessionId || (!attachmentId && attachmentId !== 0)) {
    return res.json({
      status: false,
      error: 'Вы не ввели название файла, либо ID файла или сессии.',
    });
  }

  const session = netcitySession.getSession(sessionId);
  if (!session) {
    return res.json({
      status: false,
      error: 'Сессия устарела.',
    });
  }

  if (isTest) {
    return res.json({
      status: true,
      filename,
    });
  }

  const {session: {at, page}} = session;
  const cookies = await page.cookies();

  const cookiesString = utils.cookieArrayToString(cookies);

  const response = await fetch(`https://dnevnik.school59-ekb.ru/webapi/attachments/${attachmentId}`, {
    headers: {
      at,
      cookie: cookiesString,
    },
  });

  const downloadPath = path.resolve(__dirname, '../../../files/schedule', filename);
  const writer = createWriteStream(downloadPath);

  response.body!.pipe(writer);

  writer.on('error', (error) => {
    console.log('Ошибка при сохранении файла:', error);
    return res.json({
      status: false,
      error: error.message,
      filename,
    });
  });

  writer.on('close', () => {
    return res.json({
      status: true,
      filename,
    });
  });

  writer.on('finish', writer.close);
}

export default downloadAttachment;
