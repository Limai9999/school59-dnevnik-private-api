import {MethodInputData} from '../../types/methods/MethodInputData';

async function closeSession({req, res}: MethodInputData) {
  const {netcitySession} = req.app.locals;
}

export default closeSession;
