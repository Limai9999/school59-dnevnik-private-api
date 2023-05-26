import { MethodInputData } from '../../types/Methods/MethodInputData';
import { Credentials } from '../../types/Netcity/Credentials';

import { SimplifiedSession } from '../../types/Responses/netCity/GetCookiesResponse';

import loginToNetcity from '../../utils/loginToNetcity';

async function getCookies({ req, res }: MethodInputData) {
  const { netcitySession } = req.app.locals;

  if (!req.body) {
    const response: SimplifiedSession = {
      peerId: 0,
      status: false,
      login: '',
      password: '',
      error: 'peerId и login и password не введены.',
      session: { id: 0, endTime: 0 },
      at: '',
      cookies: [],
    };
    return res.json(response);
  }

  const { peerId, login, password }: Credentials = req.body;
  if (!login || !password || !peerId) {
    const response: SimplifiedSession = {
      peerId: 0,
      status: false,
      login: '',
      password: '',
      error: 'Логин или пароль или peerId не введены.',
      session: { id: 0, endTime: 0 },
      at: '',
      cookies: [],
    };
    return res.json(response);
  }

  try {
    const addPendingLoginStatus = netcitySession.addPendingLoginPeerId(peerId);
    const isPeerIdHasSession = netcitySession.isPeerIdHasSession(peerId);
    if (!addPendingLoginStatus) {
      console.log('wanted to start new login while previous is pending');
      const response: SimplifiedSession = {
        peerId,
        status: false,
        login: '',
        password: '',
        error: 'Нельзя начать новый вход, т.к. предыдущий процесс входа ещё не завершен.',
        session: { id: 0, endTime: 0 },
        at: '',
        cookies: [],
      };
      return res.json(response);
    }
    if (isPeerIdHasSession) {
      console.log('wanted to start new login while previous is active');
      const response: SimplifiedSession = {
        peerId,
        status: false,
        login: '',
        password: '',
        error: 'Не удалось выполнить вход, т.к. у вас уже есть активная сессия.\nСначала необходимо закрыть предыдущую сессию.',
        session: { id: 0, endTime: 0 },
        at: '',
        cookies: [],
      };
      return res.json(response);
    }

    const loginData = await loginToNetcity(login, password, peerId);

    netcitySession.removePendingLoginPeerId(peerId);

    if (!loginData.status) {
      const response: SimplifiedSession = {
        peerId,
        status: false,
        login,
        password,
        error: loginData.error!,
        session: { id: 0, endTime: 0 },
        at: loginData.at,
        cookies: [],
      };
      return res.json(response);
    }

    const session = netcitySession.addSession(loginData);
    if (session.id === 0) {
      const response: SimplifiedSession = {
        peerId,
        status: false,
        login,
        password,
        error: 'При входе и сохранении сессии произошла неизвестная ошибка.',
        session: { id: 0, endTime: 0 },
        at: loginData.at,
        cookies: [],
      };
      return res.json(response);
    }

    const cookies = await loginData.page.cookies();

    const response: SimplifiedSession = {
      peerId,
      status: true,
      login,
      password,
      session,
      at: loginData.at,
      cookies,
    };
    return res.json(response);
  } catch (error) {
    netcitySession.removePendingLoginPeerId(peerId);

    const response: SimplifiedSession = {
      peerId,
      status: false,
      login: '',
      password: '',
      error: `${error}`,
      session: { id: 0, endTime: 0 },
      at: '',
      cookies: [],
    };
    return res.json(response);
  }
}

export default getCookies;
