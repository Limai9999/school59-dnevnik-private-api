import fetch from 'node-fetch';
import path from 'path';
import {createWriteStream} from 'fs';

import {MethodInputData} from '../../types/Methods/MethodInputData';

import {SaveFileResponse} from '../../types/Responses/schedule/SaveFileResponse';

type FileData = {
  filename: string
  url: string
}

async function saveFile({req, res}: MethodInputData) {
  if (!req.body) {
    const response: SaveFileResponse = {
      status: false,
      message: 'Не введены filename и url',
    };
    return res.json(response);
  }

  const {filename, url}: FileData = req.body;
  if (!filename || !url) {
    const response: SaveFileResponse = {
      status: false,
      message: 'Название файла и ссылка на файл не введены.',
    };
    return res.json(response);
  }

  try {
    const downloadPath = path.resolve(__dirname, '../../../files/schedule', filename);
    const writer = createWriteStream(downloadPath);

    const response = await fetch(url, {
      method: 'POST',
    });

    response.body!.pipe(writer);

    writer.once('error', (error) => {
      console.log('Ошибка при сохранении файла:', error);

      const response: SaveFileResponse = {
        status: false,
        message: error.message,
      };
      return res.json(response);
    });

    writer.once('close', () => {
      const response: SaveFileResponse = {
        status: true,
        message: 'Файл успешно сохранён',
        filename,
      };
      return res.json(response);
    });

    writer.once('finish', writer.close);
  } catch (error) {
    const response: SaveFileResponse = {
      status: false,
      message: `${error}`,
      filename,
    };
    return res.json(response);
  }
}

export default saveFile;
