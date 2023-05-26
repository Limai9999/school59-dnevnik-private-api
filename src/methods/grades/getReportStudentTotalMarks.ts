import path from 'path';

import { MethodInputData } from '../../types/Methods/MethodInputData';

import { GetReportStudentTotalMarks } from '../../types/Responses/grades/GetReportStudentTotalMarks';

async function getReportStudentTotalMarks({ req, res }: MethodInputData) {
  const { netcitySession } = req.app.locals;

  if (!req.body) {
    const response: GetReportStudentTotalMarks = {
      status: false,
      error: 'sessionId не введены.',
    };
    return res.json(response);
  }

  const { sessionId }: {sessionId: number} = req.body;
  if (!sessionId) {
    const response: GetReportStudentTotalMarks = {
      status: false,
      error: 'ID сессии не введён.',
    };
    return res.json(response);
  }

  try {
    const session = netcitySession.getSession(sessionId);

    if (!session) {
      const response: GetReportStudentTotalMarks = {
        status: false,
        error: 'Сессия устарела.\n\nПерезайдите в Сетевой Город.',
      };
      return res.json(response);
    }

    const { session: { page, skipSecurityCheck, login } } = session;

    await page.evaluate(() => {
    // @ts-ignore
      SetSelectedTab(24, '/angular/school/reports/');
    });

    await page.waitForNetworkIdle();

    await skipSecurityCheck();

    await page.waitForSelector('[ng-href="studenttotalmarks"]');
    await page.waitForNetworkIdle();
    await page.click('[ng-href="studenttotalmarks"]');

    await page.waitForNetworkIdle();
    await page.click('[title="Сформировать"]');

    await page.waitForSelector('#report');
    await page.waitForSelector('.table-print-num');

    const reportResult: GetReportStudentTotalMarks = {
      status: true,
    };

    const screenshotName = `ReportStudentTotalMarks_${login}_${Date.now()}.png`;
    const reportScreenshotPath = path.resolve(__dirname, '../../../files/studentReports', screenshotName);

    console.log(reportScreenshotPath);

    const reportTableElement = await page.$('.table-print-num');
    if (reportTableElement) {
      await reportTableElement.screenshot({ path: reportScreenshotPath });
      reportResult.screenshot = screenshotName;
    }

    return res.json(reportResult);
  } catch (error) {
    const reportResult: GetReportStudentTotalMarks = {
      status: false,
      error: `${error}`,
    };

    return res.json(reportResult);
  }
}

export default getReportStudentTotalMarks;
