import { sequelize } from '../../src/models';

before(async function () {
  this.timeout(30000);
  try {
    await sequelize.authenticate();
    console.log('Test database connection established.');
  } catch (error) {
    console.error('Failed to connect to test database:', error);
    throw error;
  }
});

after(async function () {
  await sequelize.close();
});
