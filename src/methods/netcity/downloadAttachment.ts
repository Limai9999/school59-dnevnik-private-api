import libre from 'libreoffice-convert';
import fetch from 'node-fetch';
import path from 'path';
import fs from 'fs';

import { MethodInputData } from '../../types/Methods/MethodInputData';

import { createWriteStream } from 'fs';
import { DownloadAttachmentResponse } from '../../types/Responses/netCity/DownloadAttachmentResponse';

async function downloadAttachment({ req, res }: MethodInputData) {
  try {
    const { netcitySession, utils } = req.app.locals;

    if (!req.body) {
      const response: DownloadAttachmentResponse = {
        status: false,
        error: 'sessionId и attachmentId и filename не введены.',
      };
      return res.json(response);
    }

    const { sessionId, attachmentId, filename, isTest }: {sessionId: number, attachmentId: number, filename: string, isTest: boolean} = req.body;
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

    const { session: { at, page } } = session;
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

  writer.on('close', async () => {
    // ! converting xls to xlsx
    if (filename.endsWith('.xls')) {
      const result: Buffer | null = await new Promise((resolve, reject) => {
        const xlsBuffer = fs.readFileSync(downloadPath);

        libre.convert(xlsBuffer, '.xlsx', undefined, ((err, data) => {
          if (err) resolve(null);
          resolve(data);
        }));
      });

      if (!result) {
        const response: DownloadAttachmentResponse = {
          status: false,
          error: 'Произошла ошибка при конвертировании .xls в .xlsx.',
          filename,
        };
        return res.json(response);
      }

      const filenameWithoutExtension = filename.replace('.xls', '');
      const convertedFilename = `${filenameWithoutExtension}.xlsx`;

      const outputPath = path.resolve(__dirname, '../../../files/schedule', convertedFilename);

      fs.writeFileSync(outputPath, result);

      console.log(`Формат файла ${filename} конвертирован в .xlsx.`);

      const response: DownloadAttachmentResponse = {
        status: true,
        filename: convertedFilename,
      };
      return res.json(response);
    } else {
      const response: DownloadAttachmentResponse = {
        status: true,
        filename,
      };
      return res.json(response);
    }
  });

  writer.on('finish', writer.close);
  } catch (error) {
    const response: DownloadAttachmentResponse = {
      status: false,
      error: 'Произошла ошибка при скачивании файла.',
    };

    return res.json(response);
  }
}

export default downloadAttachment;
