import fetch from 'node-fetch';
import path from 'path';
import {createWriteStream} from 'fs';

import {MethodInputData} from '../../types/methods/MethodInputData';

type FileData = {
  filename: string
  url: string
}

async function saveFile({req, res}: MethodInputData) {
  if (!req.body) {
    res.json({
      status: false,
      message: 'Не введены filename и url',
    });
  }

  const {filename, url}: FileData = req.body;
  if (!filename || !url) {
    return res.json({
      status: false,
      message: 'Название файла и ссылка на файл не введены.',
    });
  }

  const downloadPath = path.resolve(__dirname, '../../files/schedule', filename);
  const writer = createWriteStream(downloadPath);

  const response = await fetch(url, {
    method: 'POST',
  });

  response.body!.pipe(writer);

  writer.on('error', (error) => {
    console.log('Ошибка при сохранении файла:', error);
    return res.json({
      status: false,
      message: error.message,
    });
  });

  writer.on('close', () => {
    return res.json({
      status: true,
      message: 'Файл успешно сохранён',
      filename,
    });
  });

  writer.on('finish', writer.close);
}

export default saveFile;
