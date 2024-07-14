import { Injectable } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import { getSignedUrl } from '@aws-sdk/s3-request-presigner';

@Injectable()
export class S3Service {
  private s3Client: S3Client;

  constructor(private configService: ConfigService) {
    this.s3Client = new S3Client({
      region: this.configService.get('AWS_REGION'),
    });
  }

  async uploadFile(file: Express.Multer.File): Promise<string> {
    const bucketName = this.configService.get('AWS_S3_BUCKET_NAME');
    const key = `${Date.now()}-${file.originalname}`;

    const command = new PutObjectCommand({
      Bucket: bucketName,
      Key: key,
      Body: file.buffer,
      ContentType: file.mimetype,
      ACL: 'public-read',
    });

    await this.s3Client.send(command);

    // Generate a pre-signed URL for the uploaded object
    const url = await getSignedUrl(this.s3Client, command, { expiresIn: 3600 });

    return url;
  }
}
