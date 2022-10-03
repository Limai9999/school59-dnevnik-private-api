

import {MethodInputData} from '../../types/methods/MethodInputData';

import {Credentials} from '../../types/netcity/Credentials';

import loginToNetcity from '../../utils/loginToNetcity';

async function getCookies({req, res}: MethodInputData) {
  if (!req.body) {
    return res.json({
      status: false,
      error: 'login и password не введены.',
    });
  }

  const {login, password}: Credentials = req.body;
  if (!login || !password) {
    return res.json({
      status: false,
      error: 'Логин и пароль не введены.',
    });
  }

  const {netcitySession} = req.app.locals;

  const loginData = await loginToNetcity(login, password);

  if (!loginData.status) {
    return res.json({
      status: false,
      error: loginData.error!,
      session: {id: 0, endTime: 0},
      at: loginData.at,
      cookies: [],
    });
  }

  const session = netcitySession.addSession(loginData);

  const cookies = await loginData.page.cookies();

  return res.json({
    status: true,
    session,
    at: loginData.at,
    cookies,
  });
}

export default getCookies;
