

import {MethodInputData} from '../../types/Methods/MethodInputData';
import {Credentials} from '../../types/Netcity/Credentials';

import {GetCookiesResponse} from '../../types/Responses/netCity/GetCookiesResponse';

import loginToNetcity from '../../utils/loginToNetcity';

async function getCookies({req, res}: MethodInputData) {
  if (!req.body) {
    const response: GetCookiesResponse = {
      status: false,
      error: 'login и password не введены.',
    };
    return res.json(response);
  }

  const {login, password}: Credentials = req.body;
  if (!login || !password) {
    const response: GetCookiesResponse = {
      status: false,
      error: 'Логин и пароль не введены.',
    };
    return res.json(response);
  }

  const {netcitySession} = req.app.locals;

  const loginData = await loginToNetcity(login, password);

  if (!loginData.status) {
    const response: GetCookiesResponse = {
      status: false,
      error: loginData.error!,
      session: {id: 0, endTime: 0},
      at: loginData.at,
      cookies: [],
    };
    return res.json(response);
  }

  const session = netcitySession.addSession(loginData);

  const cookies = await loginData.page.cookies();

  const response: GetCookiesResponse = {
    status: true,
    session,
    at: loginData.at,
    cookies,
  };
  return res.json(response);
}

export default getCookies;
