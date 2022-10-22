import {MethodInputData} from '../../types/Methods/MethodInputData';

import fetch from 'node-fetch';
import path from 'path';
import {createWriteStream} from 'fs';
import {DownloadAttachmentResponse} from '../../types/Responses/netCity/DownloadAttachmentResponse';

async function downloadAttachment({req, res}: MethodInputData) {
  const {netcitySession, utils} = req.app.locals;

  if (!req.body) {
    const response: DownloadAttachmentResponse = {
      status: false,
      error: 'sessionId и attachmentId и filename не введены.',
    };
    return res.json(response);
  }

  const {sessionId, attachmentId, filename, isTest}: {sessionId: number, attachmentId: number, filename: string, isTest: boolean} = req.body;
  if (!sessionId || (!attachmentId && attachmentId !== 0)) {
    const response: DownloadAttachmentResponse = {
      status: false,
      error: 'Вы не ввели название файла, либо ID файла или сессии.',
    };
    return res.json(response);
  }

  const session = netcitySession.getSession(sessionId);
  if (!session) {
    const response: DownloadAttachmentResponse = {
      status: false,
      error: 'Сессия устарела.\n\nПерезайдите в Сетевой Город.',
    };
    return res.json(response);
  }

  if (isTest) {
    const response: DownloadAttachmentResponse = {
      status: true,
      filename,
    };
    return res.json(response);
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

    const response: DownloadAttachmentResponse = {
      status: false,
      error: error.message,
      filename,
    };
    return res.json(response);
  });

  writer.on('close', () => {
    const response: DownloadAttachmentResponse = {
      status: true,
      filename,
    };
    return res.json(response);
  });

  writer.on('finish', writer.close);
}

export default downloadAttachment;
