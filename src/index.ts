import express from 'express';

import fs from 'fs';
import path from 'path';

const app = express();

app.use(express.json());
app.use(express.urlencoded({extended: true}));

const PORT = 2078;

async function start(): Promise<void> {
  const routersDir = fs.readdirSync(path.join(__dirname, 'routers'));

  const routersFiles = routersDir.filter((routerName) => routerName.endsWith('.js') || routerName.endsWith('.ts'));

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
