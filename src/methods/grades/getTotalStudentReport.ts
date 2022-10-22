import path from 'path';

import {MethodInputData} from '../../types/Methods/MethodInputData';

import {AverageGrade, DayData, ReportResult} from '../../types/Responses/grades/GetTotalStudentReportResponse';

async function getTotalStudentReport({req, res}: MethodInputData) {
  try {
    const {netcitySession} = req.app.locals;

    if (!req.body) {
      const response: ReportResult = {
        status: false,
        error: 'sessionId не введены.',
        info: [],
        result: {
          averageGrades: [],
          daysData: [],
        },
      };
      return res.json(response);
    }

    const {sessionId}: {sessionId: number} = req.body;
    if (!sessionId) {
      const response: ReportResult = {
        status: false,
        error: 'ID сессии не введён.',
        info: [],
        result: {
          averageGrades: [],
          daysData: [],
        },
      };
      return res.json(response);
    }

    const session = netcitySession.getSession(sessionId);
    if (!session) {
      const response: ReportResult = {
        status: false,
        error: 'Сессия устарела.\n\nПерезайдите в Сетевой Город.',
        info: [],
        result: {
          averageGrades: [],
          daysData: [],
        },
      };
      return res.json(response);
    }

    const {session: {page, skipSecurityCheck, login}} = session;

    await page.evaluate(() => {
      // @ts-ignore
      SetSelectedTab(24, '/angular/school/reports/');
    });

    await skipSecurityCheck();

    await page.waitForSelector('[ng-href="studenttotal"]');
    await page.click('[ng-href="studenttotal"]');

    await page.waitForNetworkIdle({idleTime: 3000});
    await page.click('[title="Сформировать"]');

    await page.waitForNetworkIdle({idleTime: 1500});

    const reportResult: ReportResult = await page.evaluate(() => {
      try {
        const report = document.querySelector('#report');
        if (!report) {
          return {
            status: false,
            error: 'Не удалось получить отчёт.',
            info: [],
            result: {
              daysData: [],
              averageGrades: [],
            },
          };
        }

        const infoTable = report.children[4].children[0].children[0].children[1];
        const infoUnformatted = Array.from(infoTable.children) as HTMLElement[];
        const infoResult = infoUnformatted.filter((info) => info.tagName === 'SPAN').map((info) => info.innerText);

        const gradesBody = report.children[6].children[0];
        const daysBody = gradesBody.children[1];

        const monthUnformatted = Array.from(gradesBody.children[0].children) as HTMLElement[];
        const monthArray = monthUnformatted
            .filter((month) => month.innerText !== 'Предмет' && month.innerText !== 'Средняя оценка')
            .map((month) => {
              return {text: month.innerText, totalDays: +month.attributes[0].value};
            });
        const daysArray = Array.from(daysBody.children) as HTMLElement[];

        const daysData: DayData[] = [];

        let monthIndex = 0;
        let dayIndex = 0;
        for (let i = 1; i <= daysArray.length; i++) {
          if (dayIndex === monthArray[monthIndex].totalDays) {
            monthIndex++;
            dayIndex = 0;
          };
          daysData.push({
            month: monthArray[monthIndex].text,
            day: daysArray[i - 1].innerText,
            lessonsWithGrades: [],
          });
          dayIndex++;
        }

        const lessonsArray = Array.from(gradesBody.children);
        lessonsArray.splice(0, 2);

        const averageGrades: AverageGrade[] = [];

        lessonsArray.map((lesson) => {
          const grades = Array.from(lesson.children) as HTMLElement[];
          const average = grades.find((e) => e.className === 'cell-num');
          const gradesFiltered = grades.filter((element) => element.className !== 'cell-text' && element.className !== 'cell-num');

          if (!averageGrades.find((e) => e.lesson === average!.innerText)) {
            averageGrades.push({
              lesson: grades[0].innerText,
              average: average!.innerText,
            });
          }

          gradesFiltered.map((e, index) => {
            const gradesResult = e.innerText
                .trim()
                .replace(/\s/g, '')
                .split('')
                // @ts-ignore
                .filter((grade) => !isNaN(grade))
                // @ts-ignore
                .sort((a, b) => b - a);

            daysData[index].lessonsWithGrades.push({
              lesson: grades[0].innerText,
              grades: gradesResult,
            });
          });
        });

        return {
          status: true,
          info: infoResult,
          result: {
            daysData,
            averageGrades,
          },
        };
      } catch (error) {
        return {
          status: false,
          error: `${error}`,
          info: [],
          result: {
            daysData: [],
            averageGrades: [],
          },
        };
      }
    });

    const screenshotName = `TotalStudentReport_${login}_${Date.now()}.png`;
    const reportScreenshotPath = path.resolve(__dirname, '../../../files/totalStudentReports', screenshotName);

    const reportTableElement = await page.$('.table-print');
    if (reportTableElement) {
      await reportTableElement.screenshot({path: reportScreenshotPath});
      reportResult.screenshot = screenshotName;
    }

    res.json(reportResult);
  } catch (error) {
    const response: ReportResult = {
      status: false,
      error: `${error}`,
      info: [],
      result: {
        averageGrades: [],
        daysData: [],
      },
    };
    return res.json(response);
  }
}

export default getTotalStudentReport;
