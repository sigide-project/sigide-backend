import dotenv from 'dotenv';
dotenv.config();

process.env.NODE_ENV = 'test';

import chai from 'chai';
import sinonChai from 'sinon-chai';
chai.use(sinonChai);
