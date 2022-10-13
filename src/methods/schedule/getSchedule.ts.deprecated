import path from 'path';

import waitMs from '../../utils/waitMs';

import {Credentials} from '../../types/Netcity/Credentials';
import {Announcement, AnnouncementFile} from '../../types/Schedule/Announcement';

import {MethodInputData} from '../../types/Methods/MethodInputData';

import {Tests} from '../../types/Schedule/Tests';
import loginToNetcity from '../../utils/loginToNetcity';

const test: Tests = {
  enabled: false,
  type: 'onlyReturnFiles',
};

async function getSchedule({req, res}: MethodInputData) {
  if (!req.body) {
    return res.json({
      status: false,
      message: 'login и password не введены.',
    });
  }

  const {login, password}: Credentials = req.body;
  if (!login || !password) {
    return res.json({
      status: false,
      message: 'Логин и пароль не введены.',
    });
  }

  if (test.enabled && test.type === 'onlyReturnFiles') {
    return res.json({
      status: true,
      message: 'got schedule',
      files: [
        {filename: 'изменения на 16 сентября.xlsx', selector: 'test'},
        {filename: 'изменения в расписании на 14 сентября.xlsx', selector: 'test'},
      ],
    });
  }

  console.log(`Начато получение расписания - ${login}`);

  const {client, logoutAndCloseBrowser, page, status, error} = await loginToNetcity(login, password);

  if (!status) {
    return res.json({
      status,
      message: error,
    });
  }

  const downloadPath = path.resolve(__dirname, '../../../files/schedule');
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath,
  });

  try {
    console.log('Переход на доску объявлений...');

    const currentTitle = await page.evaluate(() => {
      const titleDivChildren = document.querySelector('.title')?.children as unknown as HTMLElement[];
      const title = titleDivChildren[0].innerText;

      return title;
    });

    if (currentTitle !== 'Доска объявлений') {
      await page.evaluate(() => {
        // @ts-ignore
        SetSelectedTab(92, '/angular/school/announcements/');
      });
    }

    await page.waitForNetworkIdle({idleTime: 3000});

    console.log('Открыта доска объявлений.');

    const announcements: Announcement[] = await page.evaluate(async () => {
      const announcementsTable = document.querySelector('.content')!.children[0].children[0].children[0].children[1].children[1].children[3].children[0].children[0].children[0].children;

      const filesElements = Array.from(document.querySelectorAll('[ng-repeat="attach in announce.attachments"]')) as HTMLElement[];
      const announcementElements = Array.from(document.querySelectorAll('[ng-repeat="announce in ctrl.data.announcements"]'));

      const announcements: Announcement[] = await Promise.all(Array.from(announcementsTable).map(async (announcement) => {
        const body = announcement.children[0] as HTMLElement;

        const title: string = body.children[0].childNodes[1].textContent!;
        const content = body.children[3];

        const announcementIndex = announcementElements.findIndex((findingAnnouncement) => findingAnnouncement.innerHTML === announcement.innerHTML) + 1;

        const hasFiles = body.innerText.includes('Прикреплённые файлы');

        const result: Announcement = {
          title,
          files: [],
        };

        if (hasFiles) {
          const files = Array.from(content.children[1].children);
          files.shift();

          const findSelectorEnding = async (selector: string, elementIndex: number, recursed: number): Promise<string | undefined> => {
            const maxRecursions = 10;
            if (recursed >= maxRecursions) return;

            let modifiedSelector = selector;

            if (elementIndex === 1) {
              modifiedSelector += ' > div > a';
            } else {
              modifiedSelector += ` > div:nth-child(${elementIndex + recursed}) > a`;
            }

            const element = document.querySelector(modifiedSelector) as HTMLElement;

            if (element) {
              const filename = element.innerText;
              const isExists = result.files.find((file) => file.filename === filename);

              // const filesJoined = result.files.map((file) => {
              //   return file.filename;
              // }).join();

              // console.log(isExists, result.files, filesJoined, filename, element);

              if (isExists) return findSelectorEnding(selector, elementIndex, recursed + 1);
              return modifiedSelector;
            } else {
              return findSelectorEnding(selector, elementIndex, recursed + 1);
            }
          };

          for (let i = 0; i < files.length; i++) {
            const file = files[i];

            const link = file.children[0] as HTMLElement;
            const filename = link.innerText;

            const fileElementIndex = filesElements.findIndex((fileElement) => fileElement.innerText === filename)! + 1;

            const selector = `#view > div:nth-child(4) > div > form > div > div:nth-child(${announcementIndex}) > div.adver-body > div.adver-content.ng-scope > div.fieldset.ng-scope`;

            const endedSelector = await findSelectorEnding(selector, fileElementIndex, 0);

            // console.log(i, 'found sel', endedSelector);

            result.files.push({
              filename,
              selector: endedSelector,
            });
          }
        }

        return result;
      }));

      return announcements;
    });

    const scheduleFiles: AnnouncementFile[] = [];

    announcements.map((announcement) => {
      announcement.files.map((file) => {
        const matchRegex = /расписание|изменения|расписании/g;

        const isFileNameMatch = file.filename.match(matchRegex);

        if (isFileNameMatch) scheduleFiles.push(file);
      });
    });

    await Promise.all(scheduleFiles.map(async (file, index) => {
      if (!file.selector) return console.log(`Не удалось найти selector для файла ${file.filename}`);

      const waiting = index * 3500;
      await waitMs(waiting - 1, waiting, true, `Скачивание файла: ${file.filename}`);

      await page.click(file.selector);
    }));

    await page.waitForNetworkIdle();

    console.log('Загрузка файлов завершена.');

    logoutAndCloseBrowser();

    res.json({
      status: true,
      message: `Скачано ${scheduleFiles.length} файлов с расписанием.`,
      files: scheduleFiles,
    });
  } catch (error) {
    console.log('Ошибка в getSchedule', error);

    return res.json({
      status: false,
      message: `${error}`,
    });
  }
};

export default getSchedule;
