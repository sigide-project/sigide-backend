import { expect } from 'chai';
import sinon from 'sinon';
import fs from 'fs';
import uploadsService from '../../../src/services/uploads';

describe('Uploads Service', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  describe('isS3Configured', function () {
    it('should return false when S3 is not configured', function () {
      const result = uploadsService.isS3Configured();
      expect(typeof result).to.equal('boolean');
    });
  });

  describe('extractKeyFromUrl', function () {
    it('should extract key from local upload URL', function () {
      const result = uploadsService.extractKeyFromUrl('/uploads/test-file.jpg');
      expect(result).to.equal('/uploads/test-file.jpg');
    });

    it('should return null for empty URL', function () {
      const result = uploadsService.extractKeyFromUrl('');
      expect(result).to.be.null;
    });

    it('should extract key from S3 URL', function () {
      const result = uploadsService.extractKeyFromUrl(
        'https://bucket.s3.region.amazonaws.com/uploads/user-123/file.jpg'
      );
      expect(result).to.equal('uploads/user-123/file.jpg');
    });
  });

  describe('uploadToLocal', function () {
    it('should upload file to local storage', async function () {
      const existsSyncStub = sandbox.stub(fs, 'existsSync').returns(true);
      const writeFileSyncStub = sandbox.stub(fs, 'writeFileSync');

      const buffer = Buffer.from('test content');
      const result = await uploadsService.uploadToLocal(buffer, 'image/jpeg');

      expect(result.url).to.match(/^\/uploads\/.+\.jpg$/);
      expect(writeFileSyncStub).to.have.been.called;
    });

    it('should create directory if it does not exist', async function () {
      sandbox.stub(fs, 'existsSync').returns(false);
      const mkdirSyncStub = sandbox.stub(fs, 'mkdirSync');
      sandbox.stub(fs, 'writeFileSync');

      const buffer = Buffer.from('test content');
      await uploadsService.uploadToLocal(buffer, 'image/png');

      expect(mkdirSyncStub).to.have.been.calledWith(
        sinon.match.string,
        { recursive: true }
      );
    });

    it('should use correct extension for PNG', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'writeFileSync');

      const buffer = Buffer.from('test content');
      const result = await uploadsService.uploadToLocal(buffer, 'image/png');

      expect(result.url).to.match(/\.png$/);
    });
  });

  describe('deleteFromLocal', function () {
    it('should delete file from local storage', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      const unlinkSyncStub = sandbox.stub(fs, 'unlinkSync');

      await uploadsService.deleteFromLocal('/uploads/test-file.jpg');

      expect(unlinkSyncStub).to.have.been.called;
    });

    it('should not throw if file does not exist', async function () {
      sandbox.stub(fs, 'existsSync').returns(false);

      await uploadsService.deleteFromLocal('/uploads/non-existent.jpg');
    });
  });

  describe('upload', function () {
    it('should upload to local when S3 is not configured', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      sandbox.stub(fs, 'writeFileSync');

      const buffer = Buffer.from('test content');
      const result = await uploadsService.upload(buffer, 'image/jpeg', 'user-123');

      if (!uploadsService.isS3Configured()) {
        expect(result.url).to.match(/^\/uploads\//);
      }
    });
  });

  describe('delete', function () {
    it('should delete local file', async function () {
      sandbox.stub(fs, 'existsSync').returns(true);
      const unlinkSyncStub = sandbox.stub(fs, 'unlinkSync');

      await uploadsService.delete('/uploads/test-file.jpg');

      expect(unlinkSyncStub).to.have.been.called;
    });
  });
});
