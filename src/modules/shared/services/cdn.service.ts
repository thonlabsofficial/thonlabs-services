import { Injectable, Logger } from '@nestjs/common';
import { DataReturn } from '@/utils/interfaces/data-return';
import { ErrorMessages, StatusCodes } from '@/utils/enums/errors-metadata';
import {
  DeleteObjectCommand,
  PutObjectCommand,
  S3Client,
} from '@aws-sdk/client-s3';
import { HTTPService } from './http.service';
import rand from '@/utils/services/rand';

@Injectable()
export class CDNService {
  private readonly logger = new Logger(CDNService.name);
  private readonly cdn: S3Client;

  constructor(private httpService: HTTPService) {
    this.cdn = new S3Client({
      region: process.env.AWS_REGION,
      credentials: {
        accessKeyId: process.env.AWS_ACCESS_KEY_ID,
        secretAccessKey: process.env.AWS_SECRET_ACCESS_KEY,
      },
    });
  }

  async uploadFile(
    path: string,
    file: Express.Multer.File,
  ): Promise<DataReturn<{ fileId: string; fileName: string }>> {
    const fileId = rand(3);
    const fileName = `${fileId}.${file.originalname.split('.').pop()?.toLowerCase()}`;

    try {
      await this.cdn.send(
        new PutObjectCommand({
          Bucket: process.env.EXT_FILES_BUCKET_NAME,
          Key: `${path}/${fileName}`,
          Body: Buffer.from(file.buffer),
          ContentType: file.mimetype,
        }),
      );

      this.logger.log(`File uploaded to CDN: ${path}/${fileName}`);
    } catch (error) {
      this.logger.error('Error uploading file to CDN', error);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    return {
      data: {
        fileId,
        fileName,
      },
    };
  }

  async deleteFile(pathname: string): Promise<DataReturn> {
    try {
      await this.cdn.send(
        new DeleteObjectCommand({
          Bucket: process.env.EXT_FILES_BUCKET_NAME,
          Key: pathname,
        }),
      );

      this.logger.log(`File deleted from CDN: ${pathname}`);
    } catch (error) {
      this.logger.error('Error deleting file from CDN', error);
      return {
        statusCode: StatusCodes.Internal,
        error: ErrorMessages.InternalError,
      };
    }

    try {
      const url = `https://${process.env.EXT_FILES_BUCKET_NAME}/${pathname}`;
      await this.httpService.post({
        url: `${process.env.CLOUDFLARE_BASE_API_URL}/zones/${process.env.CLOUDFLARE_ZONE_ID}/purge_cache`,
        data: { files: [url] },
        headers: {
          Authorization: `Bearer ${process.env.CLOUDFLARE_API_KEY}`,
          'Content-Type': 'application/json',
        },
      });

      this.logger.log(`Cache cleared for ${url}`);
    } catch (error) {
      this.logger.error('Error clearing cache', error);
    }

    return {};
  }
}
