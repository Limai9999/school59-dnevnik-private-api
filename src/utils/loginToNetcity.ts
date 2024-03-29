import puppeteer, { HTTPRequest } from 'puppeteer';

import { LoginToNetcity } from '../types/Utils/LoginToNetcity';
import waitMs from './waitMs';

export default async function loginToNetcity(login: string, password: string, peerId: number): Promise<LoginToNetcity> {
  const browser = await puppeteer.launch({
    headless: true,
    defaultViewport: null,
    args: ['--no-sandbox'],
  });

  console.log('Браузер открыт.');

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

  await page.setRequestInterception(true);

  let at = '';
  let isGettingStyleSensitiveData = false;

  const setIsGettingStyleSensitiveData = (value: boolean) => {
    isGettingStyleSensitiveData = value;
    return isGettingStyleSensitiveData;
  };

  const onRequestFunction = (req: HTTPRequest) => {
    try {
      // * Optimization - Skip unnecessary data
      if (req.resourceType() === 'image') {
        return req.respond({ status: 200, body: 'aborted' });
      } else if (!isGettingStyleSensitiveData && (req.resourceType() === 'stylesheet' || req.resourceType() === 'font')) {
        return req.respond({ status: 200, body: 'aborted' });
      } else {
        req.continue();
      }

      const headers = req.headers();

      const headerAt = headers['at'];

      if (headerAt && headerAt.length) {
        if (!at.length) console.log('GOT AN AT HEADER: ', headerAt);
        at = headerAt;
      }
    } catch (error) {
      console.log('get AT header error', error);
    }
  };

  page.on('request', onRequestFunction);
  // page.on('console', (message) => console.log(`BROWSER CONSOLE MESSAGE - ${message.type()}: ${message.text()}`, login));

  const logoutAndCloseBrowser = async () => {
    try {
      await page.evaluate(() => {
        // @ts-ignore
        Logout();
      });

      await page.waitForNetworkIdle();
      await waitMs(10000, 15000, true, `Завершение сессии пользователя ${login}`);

      page.off('request', onRequestFunction);

      await browser.close();

      return true;
    } catch (error) {
      console.log('logoutAndCloseBrowser error', error);

      try {
        await browser.close();
      } catch (error) {
        console.log('unable to close browser 2 times, error', error);
      }

      return false;
    }
  };

  const skipSecurityCheck = async () => {
    try {
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
    } catch (error) {
      console.log('skipSecurityCheck error', error);
      return false;
    }
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
        peerId,
        login,
        password,
        error: `${title} - ${description}`,
        page,
        browser,
        client,
        at,
        setIsGettingStyleSensitiveData,
        logoutAndCloseBrowser,
        skipSecurityCheck,
      };
    }

    const waitForAtToken = async (isSecondTime = false) => {
      await page.waitForNetworkIdle({
        idleTime: 5000,
      });

      await skipSecurityCheck();
      if (isSecondTime) {
        await waitMs(2000, 4000);
        await skipSecurityCheck();
        await waitMs(1000, 3000);
        await skipSecurityCheck();

        // чтоб наверняка
      }

      console.log('Waiting for AT Token', login);

      let isWaitingTimeoutPassed = false;
      const waitingForATTokenTimeout = setTimeout(() => {
        console.log('AT Token timeout passed', login);
        isWaitingTimeoutPassed = true;
      }, 15000);

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
    };

    await waitForAtToken();
    !at.length ? await waitForAtToken() : null;

    if (!at.length) {
      console.log('UNABLE TO GET AT TOKEN', login);

      logoutAndCloseBrowser();

      return {
        status: false,
        peerId,
        error: 'Не удалось получить AT токен для работы с API Сетевого Города.',
        login,
        password,
        page,
        browser,
        client,
        at,
        setIsGettingStyleSensitiveData,
        logoutAndCloseBrowser,
        skipSecurityCheck,
      };
    } else {
      console.log('GOT AT TOKEN:', at, login);
    }
  } catch (error) {
    console.log(`Не удалось войти в Сетевой Город через профиль ${login}. Ошибка:`, error);

    logoutAndCloseBrowser();

    return {
      status: false,
      peerId,
      login,
      password,
      error: `${error}`,
      page,
      browser,
      client,
      at,
      setIsGettingStyleSensitiveData,
      logoutAndCloseBrowser,
      skipSecurityCheck,
    };
  }

  console.log(`Вход в Сетевой Город через профиль ${login} завершён.`);

  const returningData = {
    status: true,
    peerId,
    login,
    password,
    page,
    browser,
    client,
    at,
    setIsGettingStyleSensitiveData,
    logoutAndCloseBrowser,
    skipSecurityCheck,
  };

  console.log('RETURNING DATA', returningData);

  return returningData;
}
