

import {MethodInputData} from '../../types/methods/MethodInputData';

import {Credentials} from '../../types/netcity/Credentials';

import loginToNetcity from '../../utils/loginToNetcity';

async function getCookies({req, res}: MethodInputData) {
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

  const {netcitySession} = req.app.locals;

  const loginData = await loginToNetcity(login, password);

  if (!loginData.status) {
    return res.json({
      status: false,
      error: loginData.error!,
      sessionId: 0,
      cookies: [],
    });
  }

  const session = netcitySession.addSession(loginData);
  const cookies = await loginData.page.cookies();

  return res.json({
    status: true,
    session,
    cookies,
  });
}

export default getCookies;