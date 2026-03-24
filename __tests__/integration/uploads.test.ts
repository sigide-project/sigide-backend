import { expect } from 'chai';
import request from 'supertest';
import path from 'path';
import fs from 'fs';
import app from '../../src/index';

const { createTestUser, generateTestToken, cleanupTestData } = require('../helpers');

describe('Uploads API', function () {
  let testUser: any;
  let authToken: string;
  let testImagePath: string;
  let largeImagePath: string;
  let gifImagePath: string;

  before(function () {
    const testDir = path.join(__dirname, '../fixtures');
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }

    testImagePath = path.join(testDir, 'test-image.jpg');
    const jpegHeader = Buffer.from([
      0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00,
      0x01, 0x00, 0x01, 0x00, 0x00,
    ]);
    const smallContent = Buffer.alloc(1000);
    fs.writeFileSync(testImagePath, Buffer.concat([jpegHeader, smallContent]));

    largeImagePath = path.join(testDir, 'large-image.jpg');
    const largeContent = Buffer.alloc(4 * 1024 * 1024);
    fs.writeFileSync(largeImagePath, Buffer.concat([jpegHeader, largeContent]));

    gifImagePath = path.join(testDir, 'test-image.gif');
    const gifHeader = Buffer.from([0x47, 0x49, 0x46, 0x38, 0x39, 0x61]);
    fs.writeFileSync(gifImagePath, Buffer.concat([gifHeader, smallContent]));
  });

  after(function () {
    const testDir = path.join(__dirname, '../fixtures');
    if (fs.existsSync(testImagePath)) fs.unlinkSync(testImagePath);
    if (fs.existsSync(largeImagePath)) fs.unlinkSync(largeImagePath);
    if (fs.existsSync(gifImagePath)) fs.unlinkSync(gifImagePath);
    if (fs.existsSync(testDir)) {
      try {
        fs.rmdirSync(testDir);
      } catch {
        // Directory not empty or doesn't exist
      }
    }
  });

  beforeEach(async function () {
    this.timeout(10000);
    await cleanupTestData();
    testUser = await createTestUser();
    authToken = generateTestToken(testUser);
  });

  afterEach(async function () {
    await cleanupTestData();
  });

  describe('POST /api/uploads', function () {
    it('should return 400 for file > 3 MB', async function () {
      const res = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', largeImagePath)
        .expect(400);

      expect(res.body.error).to.include('3 MB');
    });

    it('should return 400 for disallowed mimetype (image/gif)', async function () {
      const res = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', gifImagePath)
        .expect(400);

      expect(res.body.error).to.include('Invalid file type');
    });

    it('should return 200 with url for valid JPEG (local fallback)', async function () {
      const res = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .attach('image', testImagePath)
        .expect(200);

      expect(res.body.url).to.exist;
      expect(res.body.url).to.be.a('string');
    });

    it('should return 400 when no file provided', async function () {
      const res = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${authToken}`)
        .expect(400);

      expect(res.body.error).to.exist;
    });

    it('should return 401 when no token provided', async function () {
      const res = await request(app)
        .post('/api/uploads')
        .attach('image', testImagePath)
        .expect(401);

      expect(res.body.success).to.be.false;
    });
  });
});
