import { AuthenticatedUser } from './index';

declare module 'express-serve-static-core' {
  interface Request {
    user?: AuthenticatedUser;
    token?: string;
  }
}

export {};
