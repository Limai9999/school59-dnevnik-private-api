import {MethodInputData} from '../../types/methods/MethodInputData';

async function closeSession({req, res}: MethodInputData) {
  const {netcitySession} = req.app.locals;

  if (!req.body) {
    return res.json({
      status: false,
      error: 'sessionId не введены.',
    });
  }

  const {sessionId}: {sessionId: number} = req.body;
  if (!sessionId) {
    return res.json({
      status: false,
      error: 'ID сессии не введён.',
    });
  }

  const closeStatus = await netcitySession.closeSession(sessionId);

  return res.json({
    status: closeStatus,
    error: closeStatus ? '' : 'Такой сессии не существует, либо она уже закрыта.',
  });
}

export default closeSession;
