import { S3Client } from '@aws-sdk/client-s3';
import { config } from './env.js';

if (!config.s3Endpoint || !config.s3AccessKeyId || !config.s3SecretAccessKey) {
  console.warn('WARNING: Credenciales S3 de Supabase Storage no definidas. La subida de imágenes fallará.');
}

const s3Client = config.s3Endpoint && config.s3AccessKeyId && config.s3SecretAccessKey
  ? new S3Client({
      endpoint: config.s3Endpoint,
      region: config.s3Region,
      credentials: {
        accessKeyId: config.s3AccessKeyId,
        secretAccessKey: config.s3SecretAccessKey
      },
      forcePathStyle: true
    })
  : null;

export default s3Client;
