import puppeteer from 'puppeteer';

import path from 'path';

import waitMs from '../utils/waitMs';

import {Credentials} from '../types/schedule/Credentials';
import {Announcement, AnnouncementFile} from '../types/schedule/Announcement';

import {Request, Response} from 'express';

async function getSchedule(req: Request, res: Response) {
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

  console.log(`Начато получение расписания - ${login}`);

  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox'],
  });
  console.log('Браузер открыт.');

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();

  const downloadPath = path.resolve(__dirname, '../../files/schedule');
  await client.send('Page.setDownloadBehavior', {
    behavior: 'allow',
    downloadPath,
  });

  const logoutAndCloseBrowser = async () => {
    await page.evaluate(() => {
      // @ts-ignore
      Logout();
    });

    await page.waitForNetworkIdle();

    await browser.close();
  };

  try {
    await page.goto('https://dnevnik.school59-ekb.ru/', {
      waitUntil: 'networkidle0',
    });
    console.log('Загружена страница входа. Идёт ввод данных для входа.');

    await page.focus('input[name="UN"]');
    await page.keyboard.type(login);

    await page.focus('input[name="PW"]');
    await page.keyboard.type(password);

    await page.keyboard.press('Enter');

    console.log('Данные введены, идёт вход...');
    await page.waitForNetworkIdle();

    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.modal-dialog');
      if (!modal) return;

      const [header, body] = modal.children[0].children as unknown as HTMLElement[];

      const title = header.innerText = header.innerText.replace('×\n', '');
      const description = body.innerText = body.innerText.replace('×\n', '');

      return {
        title,
        description,
      };
    });

    if (modalData) {
      const {title, description} = modalData!;

      logoutAndCloseBrowser();

      console.log(`Уведомление, предотвратившее вход: ${title} - ${description}`);

      return res.json({
        status: false,
        message: `${title} - ${description}`,
      });
    }

    // пройти предупреждение о безопасности
    await page.evaluate(() => {
      const title = document.querySelector('.title') as HTMLElement;

      if (title.innerText === 'Предупреждение о безопасности') {
        // @ts-ignore
        doContinue();
      }
    });

    await page.waitForNetworkIdle();

    console.log('Вход завершен, переход на доску объявлений');

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
    console.log('Открыта доска объявлений.');

    await page.waitForNetworkIdle();

    const announcements: Announcement[] = await page.evaluate(() => {
      const announcementsTable = document.querySelector('.content')!.children[0].children[0].children[0].children[1].children[1].children[3].children[0].children[0].children[0].children;

      const filesElements = Array.from(document.querySelectorAll('[ng-repeat="attach in announce.attachments"]')) as HTMLElement[];
      const announcementElements = Array.from(document.querySelectorAll('[ng-repeat="announce in ctrl.data.announcements"]'));

      const announcements: Announcement[] = Array.from(announcementsTable).map((announcement) => {
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

          files.map((file) => {
            const link = file.children[0] as HTMLElement;
            const filename = link.innerText;

            const fileElementIndex = filesElements.findIndex((fileElement) => fileElement.innerText === filename)! + 1;

            let selector = `#view > div:nth-child(4) > div > form > div > div:nth-child(${announcementIndex}) > div.adver-body > div.adver-content.ng-scope > div.fieldset.ng-scope`;

            if (fileElementIndex === 1) {
              selector += ' > div > a';
            } else {
              selector += ` > div:nth-child(${fileElementIndex}) > a`;
            }

            result.files.push({
              filename,
              selector,
            });
          });
        }

        return result;
      });

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
      const waiting = index * 2000;
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
    return res.json({
      status: false,
      message: `${error}`,
    });
  }
};

export default getSchedule;
