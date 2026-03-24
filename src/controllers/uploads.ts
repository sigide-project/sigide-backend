import { Request, Response, NextFunction } from 'express';
import uploadsService from '../services/uploads';
import { uploadSingle } from '../middlewares/upload.middleware';
import multer from 'multer';

class UploadsController {
  handleUpload(req: Request, res: Response, next: NextFunction): void {
    console.log('[Upload] Content-Type:', req.headers['content-type']);
    
    uploadSingle(req, res, (err: unknown) => {
      if (err) {
        console.error('[Upload] Error:', err);
        
        if (err instanceof multer.MulterError) {
          if (err.code === 'LIMIT_FILE_SIZE') {
            res.status(400).json({
              error: 'File size exceeds the 3 MB limit',
            });
            return;
          }
          res.status(400).json({
            error: err.message,
          });
          return;
        }

        if (err instanceof Error) {
          res.status(400).json({
            error: err.message,
          });
          return;
        }

        res.status(500).json({
          error: 'An unexpected error occurred during upload',
        });
        return;
      }

      console.log('[Upload] File received:', req.file ? { 
        fieldname: req.file.fieldname,
        mimetype: req.file.mimetype,
        size: req.file.size 
      } : 'No file');
      
      next();
    });
  }

  async upload(req: Request, res: Response): Promise<void> {
    try {
      const file = req.file;

      if (!file) {
        res.status(400).json({
          error: 'No file provided',
        });
        return;
      }

      const userId = req.user!.id;
      const result = await uploadsService.upload(file.buffer, file.mimetype, userId);

      res.json({ url: result.url });
    } catch (error) {
      const err = error as Error;
      console.error('Error uploading file:', err);

      res.status(500).json({
        error: 'Failed to upload file',
      });
    }
  }

  async delete(req: Request, res: Response): Promise<void> {
    try {
      const { url } = req.body;

      if (!url || typeof url !== 'string') {
        res.status(400).json({
          error: 'Image URL is required',
        });
        return;
      }

      await uploadsService.delete(url);

      res.json({ success: true, message: 'Image deleted successfully' });
    } catch (error) {
      const err = error as Error;
      console.error('Error deleting file:', err);

      res.status(500).json({
        error: 'Failed to delete file',
      });
    }
  }
}

export default new UploadsController();
