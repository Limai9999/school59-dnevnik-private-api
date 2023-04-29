import express from 'express';

import fs from 'fs';
import path from 'path';
import logger from 'morgan';

import NetCitySession from './modules/NetCitySession';
import Utils from './modules/Utils';

import { AppLocals } from './types/Methods/RequestLocals';

process.setMaxListeners(30);

const app = express();

app.use(logger('dev'));
app.use(express.json());
app.use(express.urlencoded({ extended: false }));

const PORT = 2077;

const netcitySession = new NetCitySession();
const utils = new Utils();

async function start(): Promise<void> {
  app.locals = {
    netcitySession,
    utils,
  } as AppLocals;

  const routersDir = fs.readdirSync(path.join(__dirname, 'routers'));

  const routersFiles = routersDir.filter((routerName) => routerName.endsWith('.js'));

  await Promise.all(routersFiles.map(async (routerFileName) => {
    const router = await import(`./routers/${routerFileName}`);

    const routerName = routerFileName.replace('.js', '');

    app.use('/api/netcity' + '/' + routerName, router.default);
  }));

  console.log('Express Routers настроены.');
}

app.listen(PORT, () => {
  console.log(`API работает на порте ${PORT}`);
});

start();
