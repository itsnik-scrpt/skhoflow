import { logger } from '../utils/logger';

export const fileService = {
  async uploadFile(_file: Buffer, _filename: string): Promise<string> {
    // TODO: Implement S3 upload
    logger.info('File upload not yet implemented');
    return '';
  },
};
