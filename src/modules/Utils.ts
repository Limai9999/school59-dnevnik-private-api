import { Protocol } from 'puppeteer';

export default class Utils {
  cookieArrayToString(cookieArray: Protocol.Network.Cookie[]) {
    const stringArray = cookieArray.map((cookie) => {
      const { name, value } = cookie;

      return `${name}=${value}`;
    });

    return stringArray.join('; ');
  }
}
