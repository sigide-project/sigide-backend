import http from 'http';
import app from './app';
import { initSocket } from './socket';
import { sequelize } from './models';

const PORT = process.env.PORT || 4000;

const server = http.createServer(app);
initSocket(server);

async function startServer(): Promise<void> {
  try {
    await sequelize.authenticate();
    console.log('Database connection established.');

    server.listen(PORT, () => {
      console.log(`Server running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error);
    process.exit(1);
  }
}

startServer();

export { server };
export default server;
