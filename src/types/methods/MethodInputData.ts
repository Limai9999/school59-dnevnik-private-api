import {Response} from 'express';

import {RequestLocals} from './RequestLocals';

export type MethodInputData = {
  req: RequestLocals
  res: Response
};
