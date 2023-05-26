import { MethodInputData } from '../../types/Methods/MethodInputData';

import { SimplifiedSession } from '../../types/Responses/netCity/GetCookiesResponse';
import { GetSessionListResponse } from '../../types/Responses/netCity/GetSessionListResponse';

async function getSessionList({ req, res }: MethodInputData) {
  const { netcitySession } = req.app.locals;

  const sessions = netcitySession.getAllSessions();

  const simplifiedSessions: SimplifiedSession[] = await Promise.all(sessions.map(async (fullSession) => {
    const { session, endTime, id } = fullSession;
    const { status, peerId, login, password, error, page, at } = session;

    const cookies = await page.cookies();

    const data: SimplifiedSession = {
      status,
      peerId,
      login,
      password,
      error,
      session: {
        id,
        endTime,
      },
      at,
      cookies,
    };

    return data;
  }));

  const pendingLoginPeerIds = netcitySession.getPendingLoginPeerIds();

  const response: GetSessionListResponse = {
    status: true,
    sessions: simplifiedSessions,
    pendingLoginPeerIds,
  };
  return res.json(response);
}

export default getSessionList;
