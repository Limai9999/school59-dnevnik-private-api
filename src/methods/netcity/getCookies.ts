import { MethodInputData } from '../../types/Methods/MethodInputData';
import { Credentials } from '../../types/Netcity/Credentials';

import { SimplifiedSession } from '../../types/Responses/netCity/GetCookiesResponse';

import loginToNetcity from '../../utils/loginToNetcity';

async function getCookies({ req, res }: MethodInputData) {
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

  const { netcitySession } = req.app.locals;

  const loginData = await loginToNetcity(login, password, peerId);

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
}

export default getCookies;
