import { S3Client, PutObjectCommand, DeleteObjectCommand } from '@aws-sdk/client-s3';
import { v4 as uuidv4 } from 'uuid';
import path from 'path';
import fs from 'fs';

interface UploadResult {
  url: string;
}

class UploadsService {
  private s3Client: S3Client | null = null;
  private bucket: string | null = null;
  private region: string | null = null;
  private endpoint: string | null = null;

  constructor() {
    this.initializeS3();
  }

  private initializeS3(): void {
    const bucket = process.env.S3_BUCKET;
    const region = process.env.S3_REGION || process.env.AWS_REGION;
    const accessKeyId = process.env.S3_ACCESS_KEY || process.env.AWS_ACCESS_KEY_ID;
    const secretAccessKey = process.env.S3_SECRET_KEY || process.env.AWS_SECRET_ACCESS_KEY;
    const endpoint = process.env.S3_ENDPOINT;

    if (bucket && region && accessKeyId && secretAccessKey) {
      const config: {
        region: string;
        credentials: { accessKeyId: string; secretAccessKey: string };
        endpoint?: string;
        forcePathStyle?: boolean;
      } = {
        region,
        credentials: {
          accessKeyId,
          secretAccessKey,
        },
      };

      if (endpoint) {
        config.endpoint = endpoint;
        config.forcePathStyle = true;
      }

      this.s3Client = new S3Client(config);
      this.bucket = bucket;
      this.region = region;
      this.endpoint = endpoint || null;
    }
  }

  isS3Configured(): boolean {
    return this.s3Client !== null && this.bucket !== null;
  }

  private getExtension(mimetype: string): string {
    const mimeToExt: Record<string, string> = {
      'image/jpeg': 'jpg',
      'image/png': 'png',
    };
    return mimeToExt[mimetype] || 'bin';
  }

  async uploadToS3(
    buffer: Buffer,
    mimetype: string,
    userId: string
  ): Promise<UploadResult> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 is not configured');
    }

    const ext = this.getExtension(mimetype);
    const key = `uploads/${userId}/${uuidv4()}.${ext}`;

    const command = new PutObjectCommand({
      Bucket: this.bucket,
      Key: key,
      Body: buffer,
      ContentType: mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    let url: string;
    if (this.endpoint) {
      url = `${this.endpoint}/${this.bucket}/${key}`;
    } else {
      url = `https://${this.bucket}.s3.${this.region}.amazonaws.com/${key}`;
    }

    return { url };
  }

  async uploadToLocal(
    buffer: Buffer,
    mimetype: string
  ): Promise<UploadResult> {
    const ext = this.getExtension(mimetype);
    const filename = `${uuidv4()}.${ext}`;
    const uploadDir = path.join(process.cwd(), 'public', 'uploads');

    if (!fs.existsSync(uploadDir)) {
      fs.mkdirSync(uploadDir, { recursive: true });
    }

    const filePath = path.join(uploadDir, filename);
    fs.writeFileSync(filePath, buffer);

    return { url: `/uploads/${filename}` };
  }

  async upload(
    buffer: Buffer,
    mimetype: string,
    userId: string
  ): Promise<UploadResult> {
    if (this.isS3Configured()) {
      return this.uploadToS3(buffer, mimetype, userId);
    }
    return this.uploadToLocal(buffer, mimetype);
  }

  extractKeyFromUrl(url: string): string | null {
    if (!url) return null;

    if (url.startsWith('/uploads/')) {
      return url;
    }

    try {
      const urlObj = new URL(url);
      const pathname = urlObj.pathname;
      
      if (this.endpoint) {
        const bucketPrefix = `/${this.bucket}/`;
        if (pathname.startsWith(bucketPrefix)) {
          return pathname.slice(bucketPrefix.length);
        }
      }
      
      if (pathname.startsWith('/')) {
        return pathname.slice(1);
      }
      
      return pathname;
    } catch {
      return null;
    }
  }

  async deleteFromS3(key: string): Promise<void> {
    if (!this.s3Client || !this.bucket) {
      throw new Error('S3 is not configured');
    }

    const command = new DeleteObjectCommand({
      Bucket: this.bucket,
      Key: key,
    });

    await this.s3Client.send(command);
  }

  async deleteFromLocal(url: string): Promise<void> {
    const filename = url.replace('/uploads/', '');
    const filePath = path.join(process.cwd(), 'public', 'uploads', filename);

    if (fs.existsSync(filePath)) {
      fs.unlinkSync(filePath);
    }
  }

  async delete(url: string): Promise<void> {
    if (url.startsWith('/uploads/')) {
      return this.deleteFromLocal(url);
    }

    if (this.isS3Configured()) {
      const key = this.extractKeyFromUrl(url);
      if (key) {
        return this.deleteFromS3(key);
      }
    }
  }
}

export default new UploadsService();
