import { MethodInputData } from '../../types/Methods/MethodInputData';

import { CloseSessionResponse } from '../../types/Responses/netCity/CloseSessionResponse';

async function closeSession({ req, res }: MethodInputData) {
  const { netcitySession } = req.app.locals;

  if (!req.body) {
    const response: CloseSessionResponse = {
      status: false,
      message: 'sessionId не введены.',
    };
    return res.json(response);
  }

  const { sessionId }: {sessionId: number} = req.body;
  if (!sessionId) {
    const response: CloseSessionResponse = {
      status: false,
      message: 'ID сессии не введён.',
    };
    return res.json(response);
  }

  const closeStatus = await netcitySession.closeSession(sessionId);

  const response: CloseSessionResponse = {
    status: closeStatus,
    message: closeStatus ? '' : 'Такой сессии не существует, либо она уже закрыта.',
  };
  return res.json(response);
}

export default closeSession;
