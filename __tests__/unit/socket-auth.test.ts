import { expect } from 'chai';
import sinon from 'sinon';
import jwt from 'jsonwebtoken';
import { socketAuthMiddleware } from '../../src/socket';
import type { Socket } from 'socket.io';

const JWT_SECRET = process.env.JWT_SECRET || 'your-super-secret-jwt-key';

describe('Socket Auth Middleware', () => {
  let mockSocket: Partial<Socket>;
  let nextSpy: sinon.SinonSpy;

  beforeEach(() => {
    mockSocket = {
      handshake: {
        auth: {},
        headers: {},
        query: {},
        address: '127.0.0.1',
        xdomain: false,
        secure: false,
        issued: Date.now(),
        url: '/',
        time: new Date().toUTCString(),
      },
      data: {} as { user: { id: string; email: string } },
    } as Partial<Socket>;
    nextSpy = sinon.spy();
  });

  afterEach(() => {
    sinon.restore();
  });

  it('should call next() with no error and set socket.data.user for valid JWT', () => {
    const payload = { id: 'user-123', email: 'test@example.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '1h' });
    mockSocket.handshake!.auth.token = token;

    socketAuthMiddleware(mockSocket as Socket, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
    expect(nextSpy.firstCall.args).to.have.lengthOf(0);
    expect(mockSocket.data!.user).to.deep.equal({
      id: 'user-123',
      email: 'test@example.com',
    });
  });

  it('should call next(Error) when token is missing', () => {
    socketAuthMiddleware(mockSocket as Socket, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
    expect(nextSpy.firstCall.args[0]).to.be.instanceOf(Error);
    expect(nextSpy.firstCall.args[0].message).to.equal('Unauthorized');
  });

  it('should call next(Error) for expired token', () => {
    const payload = { id: 'user-123', email: 'test@example.com' };
    const token = jwt.sign(payload, JWT_SECRET, { expiresIn: '-1s' });
    mockSocket.handshake!.auth.token = token;

    socketAuthMiddleware(mockSocket as Socket, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
    expect(nextSpy.firstCall.args[0]).to.be.instanceOf(Error);
    expect(nextSpy.firstCall.args[0].message).to.equal('Unauthorized');
  });

  it('should call next(Error) for malformed token', () => {
    mockSocket.handshake!.auth.token = 'invalid.token.here';

    socketAuthMiddleware(mockSocket as Socket, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
    expect(nextSpy.firstCall.args[0]).to.be.instanceOf(Error);
    expect(nextSpy.firstCall.args[0].message).to.equal('Unauthorized');
  });

  it('should call next(Error) for token signed with wrong secret', () => {
    const payload = { id: 'user-123', email: 'test@example.com' };
    const token = jwt.sign(payload, 'wrong-secret', { expiresIn: '1h' });
    mockSocket.handshake!.auth.token = token;

    socketAuthMiddleware(mockSocket as Socket, nextSpy);

    expect(nextSpy.calledOnce).to.be.true;
    expect(nextSpy.firstCall.args[0]).to.be.instanceOf(Error);
    expect(nextSpy.firstCall.args[0].message).to.equal('Unauthorized');
  });
});
