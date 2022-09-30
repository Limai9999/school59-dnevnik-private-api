import express from 'express';

import fs from 'fs';
import path from 'path';

import {AppLocals} from './types/methods/RequestLocals';

import NetCitySession from './modules/NetCitySession';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = 2077;

const netcitySession = new NetCitySession();

async function start(): Promise<void> {
  app.locals = {
    netcitySession,
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
