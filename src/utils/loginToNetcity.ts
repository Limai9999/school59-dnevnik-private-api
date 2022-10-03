import puppeteer from 'puppeteer';

import {LoginToNetcity} from '../types/Responses/LoginToNetcity';

export default async function loginToNetcity(login: string, password: string): Promise<LoginToNetcity> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox'],
  });

  console.log('Браузер открыт.');

  const page = await browser.newPage();

  const client = await page.target().createCDPSession();

  const logoutAndCloseBrowser = async () => {
    await page.evaluate(() => {
      // @ts-ignore
      Logout();
    });

    await page.waitForNetworkIdle();

    await browser.close();

    return true;
  };

  let at = '';

  page.on('request', (req) => {
    const headers = req.headers();

    const headerAt = headers['at'];

    if (headerAt && headerAt.length) {
      at = headerAt;
    };
  });

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
    await page.waitForNetworkIdle({idleTime: 3000});

    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.modal-dialog');
      if (!modal) return;

      const [header, body] = modal.children[0].children as unknown as HTMLElement[];

      if (!header || !body) return;

      const title = header.innerText.replace('×\n', '');
      const description = body.innerText.replace('×\n', '');

      return {
        title,
        description,
      };
    });

    if (modalData) {
      const {title, description} = modalData!;

      logoutAndCloseBrowser();

      console.log(`Уведомление, предотвратившее вход: ${title} - ${description}`);

      return {
        status: false,
        error: `${title} - ${description}`,
        page,
        browser,
        client,
        logoutAndCloseBrowser,
        at,
      };
    }

    await page.waitForNetworkIdle({idleTime: 2000});

    // пройти предупреждение о безопасности
    await page.evaluate(() => {
      const title = document.querySelector('.title') as HTMLElement;

      if (title.innerText === 'Предупреждение о безопасности') {
        // @ts-ignore
        doContinue();
      }
    });

    await page.waitForNetworkIdle({idleTime: 3000});
  } catch (error) {
    console.log(`Не удалось войти в Сетевой Город через профиль ${login}.`);

    return {
      status: false,
      error: `${error}`,
      page,
      browser,
      client,
      logoutAndCloseBrowser,
      at,
    };
  }

  console.log(`Вход в Сетевой Город через профиль ${login} успешно завершён.`);

  return {
    status: true,
    page,
    browser,
    client,
    logoutAndCloseBrowser,
    at,
  };
}
