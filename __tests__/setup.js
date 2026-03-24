process.env.NODE_ENV = 'test';
process.env.JWT_SECRET = 'test-secret-key';

const { sequelize } = require('../src/models');

before(async function() {
  this.timeout(30000);
  try {
    await sequelize.authenticate();
    await sequelize.sync({ force: true });
  } catch (error) {
    console.error('Test setup failed:', error);
    throw error;
  }
});

after(async function() {
  await sequelize.close();
});
