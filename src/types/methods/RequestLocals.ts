import {Application, Request} from 'express';

import NetCitySession from '../../modules/NetCitySession';

export type AppLocals = {
  netcitySession: NetCitySession
}

interface ApplicationLocals extends Application {
  locals: AppLocals
}

export interface RequestLocals extends Request {
  app: ApplicationLocals
};
