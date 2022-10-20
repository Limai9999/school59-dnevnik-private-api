import path from 'path';
import {existsSync} from 'fs';

import {MethodInputData} from '../../types/Methods/MethodInputData';

import {GetReportScreenshotResponse} from '../../types/Responses/grades/GetReportScreenshotResponse';

async function getReportScreenshot({req, res}: MethodInputData) {
  try {
    if (!req.body) {
      const response: GetReportScreenshotResponse = {
        status: false,
        error: `Не введен screenshotName`,
      };
      return res.status(400).json(response);
    }

    const {screenshotName}: {screenshotName: string} = req.body;
    if (!screenshotName) {
      const response: GetReportScreenshotResponse = {
        status: false,
        error: 'Не введено имя скриншота.',
      };
      return res.status(400).json(response);
    }

    const reportScreenshotPath = path.resolve(__dirname, '../../../files/totalStudentReports', screenshotName);

    const isFileExists = existsSync(reportScreenshotPath);

    if (isFileExists) {
      res.contentType('image/jpeg');
      res.sendFile(reportScreenshotPath);
    } else {
      const response: GetReportScreenshotResponse = {
        status: false,
        error: 'Такого файла не существует.',
      };
      return res.status(400).json(response);
    }
  } catch (error) {
    const response: GetReportScreenshotResponse = {
      status: false,
      error: `${error}`,
    };
    return res.status(400).json(response);
  }
}

export default getReportScreenshot;
