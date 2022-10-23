import puppeteer from 'puppeteer';

import {LoginToNetcity} from '../types/Utils/LoginToNetcity';

export default async function loginToNetcity(login: string, password: string): Promise<LoginToNetcity> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox'],
  });

  console.log('Браузер открыт.');

  const page = await browser.newPage();

  await page.setViewport({
    width: 2048,
    height: 1152,
  });

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

  const skipSecurityCheck = async () => {
    await page.evaluate(() => {
      try {
        // @ts-ignore
        doContinue();
      } catch (error) {
        console.log('Не удалось пропустить предупреждение о безопасности, либо его нет.');
      }
    });

    await page.waitForNetworkIdle();

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
    await page.waitForNetworkIdle();

    const modalData = await page.evaluate(() => {
      const modal = document.querySelector('.modal-dialog');
      if (!modal) return;

      const [header, body] = modal.children[0].children as unknown as HTMLElement[];

      if (!header || !body) return;

      const title = header.innerText.replace('×\n', '');
      const description = body.innerText.replace('×\n', '');

      if (title.includes('Внимание')) return;

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
        login,
        password,
        error: `${title} - ${description}`,
        page,
        browser,
        client,
        logoutAndCloseBrowser,
        at,
        skipSecurityCheck,
      };
    }

    await page.waitForNetworkIdle();

    await skipSecurityCheck();
  } catch (error) {
    console.log(`Не удалось войти в Сетевой Город через профиль ${login}.`);

    return {
      status: false,
      login,
      password,
      error: `${error}`,
      page,
      browser,
      client,
      logoutAndCloseBrowser,
      at,
      skipSecurityCheck,
    };
  }

  console.log(`Вход в Сетевой Город через профиль ${login} успешно завершён.`);

  return {
    status: true,
    login,
    password,
    page,
    browser,
    client,
    logoutAndCloseBrowser,
    at,
    skipSecurityCheck,
  };
}
