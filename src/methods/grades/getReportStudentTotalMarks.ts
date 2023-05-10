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

  // const reportResult = await page.evaluate(() => {
  //   try {
  //     const report = document.querySelector('#report');
  //     if (!report) {
  //       return {
  //         status: false,
  //         error: 'Не удалось сформировать отчёт.',
  //       };
  //     }

  //     const infoTable = report.children[0].children[0].children[4].children[0].children[0].children[1];
  //     const infoUnformatted = Array.from(infoTable.children) as HTMLElement[];
  //     const infoResult = infoUnformatted.filter((info) => info.tagName === 'SPAN').map((info) => info.innerText);

  //     const gradesBody = report.children[0].children[0].children[6];
  //   } catch (error) {
  //     return {
  //       status: false,
  //       error: `${error}`,
  //     };
  //   }
  // });

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
}

export default getReportStudentTotalMarks;
