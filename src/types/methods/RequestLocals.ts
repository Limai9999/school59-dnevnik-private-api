import { Application, Request } from 'express';

import NetCitySession from '../../modules/NetCitySession';
import Utils from '../../modules/Utils';

export type AppLocals = {
  netcitySession: NetCitySession
  utils: Utils
}

interface ApplicationLocals extends Application {
  locals: AppLocals
}

export interface RequestLocals extends Request {
  app: ApplicationLocals
}
