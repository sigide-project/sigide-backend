import { expect } from 'chai';
import sinon from 'sinon';
import { Request, Response, NextFunction } from 'express';
import uploadsController from '../../../src/controllers/uploads';
import uploadsService from '../../../src/services/uploads';
import { createMockUser } from '../../helpers';

describe('Uploads Controller', function () {
  let sandbox: sinon.SinonSandbox;
  let mockReq: Partial<Request>;
  let mockRes: Partial<Response>;
  let jsonSpy: sinon.SinonSpy;
  let statusStub: sinon.SinonStub;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
    jsonSpy = sandbox.spy();
    statusStub = sandbox.stub().returns({ json: jsonSpy });
    mockRes = {
      json: jsonSpy,
      status: statusStub,
    };
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('upload', function () {
    it('should upload file successfully', async function () {
      mockReq = {
        user: createMockUser(),
        file: {
          buffer: Buffer.from('test content'),
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      };

      sandbox.stub(uploadsService, 'upload').resolves({ url: '/uploads/test.jpg' });

      await uploadsController.upload(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ url: '/uploads/test.jpg' })
      );
    });

    it('should return 400 if no file provided', async function () {
      mockReq = {
        user: createMockUser(),
        file: undefined,
      };

      await uploadsController.upload(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ error: 'No file provided' })
      );
    });

    it('should return 500 on upload error', async function () {
      mockReq = {
        user: createMockUser(),
        file: {
          buffer: Buffer.from('test content'),
          mimetype: 'image/jpeg',
        } as Express.Multer.File,
      };

      sandbox.stub(uploadsService, 'upload').rejects(new Error('Upload failed'));

      await uploadsController.upload(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(500);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ error: 'Failed to upload file' })
      );
    });
  });

  describe('delete', function () {
    it('should delete file successfully', async function () {
      mockReq = {
        body: { url: '/uploads/test.jpg' },
      };

      sandbox.stub(uploadsService, 'delete').resolves();

      await uploadsController.delete(mockReq as Request, mockRes as Response);

      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({
          success: true,
          message: sinon.match(/deleted successfully/),
        })
      );
    });

    it('should return 400 if no URL provided', async function () {
      mockReq = {
        body: {},
      };

      await uploadsController.delete(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ error: 'Image URL is required' })
      );
    });

    it('should return 400 if URL is not a string', async function () {
      mockReq = {
        body: { url: 123 },
      };

      await uploadsController.delete(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(400);
    });

    it('should return 500 on delete error', async function () {
      mockReq = {
        body: { url: '/uploads/test.jpg' },
      };

      sandbox.stub(uploadsService, 'delete').rejects(new Error('Delete failed'));

      await uploadsController.delete(mockReq as Request, mockRes as Response);

      expect(statusStub).to.have.been.calledWith(500);
      expect(jsonSpy).to.have.been.calledWith(
        sinon.match({ error: 'Failed to delete file' })
      );
    });
  });
});
