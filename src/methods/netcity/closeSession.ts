import {MethodInputData} from '../../types/Methods/MethodInputData';

async function closeSession({req, res}: MethodInputData) {
  const {netcitySession} = req.app.locals;

  if (!req.body) {
    return res.json({
      status: false,
      message: 'sessionId не введены.',
    });
  }

  const {sessionId}: {sessionId: number} = req.body;
  if (!sessionId) {
    return res.json({
      status: false,
      message: 'ID сессии не введён.',
    });
  }

  const closeStatus = await netcitySession.closeSession(sessionId);

  return res.json({
    status: closeStatus,
    message: closeStatus ? '' : 'Такой сессии не существует, либо она уже закрыта.',
  });
}

export default closeSession;
