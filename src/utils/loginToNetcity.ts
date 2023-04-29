import puppeteer from 'puppeteer';

import { LoginToNetcity } from '../types/Utils/LoginToNetcity';
import waitMs from './waitMs';

export default async function loginToNetcity(login: string, password: string): Promise<LoginToNetcity> {
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ['--no-sandbox'],
  });

  console.log('Браузер открыт.');

  // const testPage = await browser.newPage();
  // testPage.setContent(login);

  const page = await browser.newPage();

  // * CHECK FOR SLOW SYSTEMS
  // ! 2x CPU slowdown factor
  // await page.emulateCPUThrottling(1.5);

  // ! slow 3g network
  // const slow3G = puppeteer.networkConditions['Slow 3G'];
  // await page.emulateNetworkConditions(slow3G);

  await page.setViewport({
    width: 2048,
    height: 1152,
  });

  const client = await page.target().createCDPSession();

  const logoutAndCloseBrowser = async () => {
    try {
      await page.evaluate(() => {
        // @ts-ignore
        Logout();
      });

      await page.waitForNetworkIdle();
      await waitMs(10000, 15000, true, `Завершение сессии пользователя ${login}`);

      await browser.close();

      return true;
    } catch (error) {
      console.log('logoutAndCloseBrowser error', error);
      return false;
    }
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
    try {
      const headers = req.headers();

      const headerAt = headers['at'];

      if (headerAt && headerAt.length) {
        console.log('AT HAS CHANGED. PREV:', at, 'NEW:', headerAt);
        at = headerAt;
      }
    } catch (error) {
      console.log('get header at error', error);
    }
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

      const title = header.innerText.replace('×\n', '').replace('×', '');
      const description = body.innerText.replace('×\n', '').replace('×', '');

      if (title.includes('Внимание') || title.includes('Подождите')) return;
      if (description.includes('Обработка')) return;

      return {
        title,
        description,
      };
    });

    console.log('modal data check passed');

    if (modalData) {
      const { title, description } = modalData!;

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

    await page.waitForNetworkIdle({
      idleTime: 5000,
    });

    await skipSecurityCheck();
  } catch (error) {
    console.log(`Не удалось войти в Сетевой Город через профиль ${login}. Ошибка:`, error);

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

  console.log('Waiting for AT Token', login);

  let isWaitingTimeoutPassed = false;
  const waitingForATTokenTimeout = setTimeout(() => {
    console.log('AT Token timeout passed', login);
    isWaitingTimeoutPassed = true;
  }, 30000);

  await new Promise<void>((resolve) => {
    const checkForTimeoutEnd = setInterval(() => {
      if (at.length > 0 || isWaitingTimeoutPassed) {
        resolve();
        clearInterval(checkForTimeoutEnd);
      }
    }, 1000);
  });

  console.log('cleared AT Token timeout', login);
  clearInterval(waitingForATTokenTimeout);

  if (!at.length) {
    console.log('UNABLE TO GET AT TOKEN', login);

    return {
      status: false,
      error: 'Не удалось получить AT токен для работы с API Сетевого Города.',
      login,
      password,
      page,
      browser,
      client,
      logoutAndCloseBrowser,
      at,
      skipSecurityCheck,
    } as LoginToNetcity;
  } else {
    console.log('GOT AT TOKEN:', at, login);
  }

  console.log(`Вход в Сетевой Город через профиль ${login} завершён.`);

  const returningData = {
    status: true,
    login,
    password,
    page,
    browser,
    client,
    logoutAndCloseBrowser,
    at,
    skipSecurityCheck,
  } as LoginToNetcity;

  console.log('RETURNING DATA', returningData);

  return returningData;
}
