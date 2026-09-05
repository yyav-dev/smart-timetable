import Hapi from '@hapi/hapi';
import { timetableRoutes } from './routes/timetable.routes';

const init = async () => {
  const server = Hapi.server({
    port: process.env.PORT ?? 3333,
    host: '0.0.0.0',
    routes: {
      cors: {
        origin: ['*'], // tighten for production
      },
    },
  });

  server.route([
    {
      method: 'GET',
      path: '/api/health',
      handler: () => ({ status: 'ok', stateless: true, db: null }),
    },
    ...timetableRoutes,
  ]);

  await server.start();
  console.log(`Smart Timetable API running at ${server.info.uri}`);
};

process.on('unhandledRejection', (err) => {
  console.error(err);
  process.exit(1);
});

init();
