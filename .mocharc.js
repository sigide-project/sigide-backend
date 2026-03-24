module.exports = {
  timeout: 10000,
  recursive: true,
  exit: true,
  spec: ['__tests__/**/*.test.ts', '__tests__/**/*.test.js'],
  require: ['ts-node/register', './__tests__/setup.ts', './__tests__/integration/setup.ts'],
};
