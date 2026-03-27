import { Injectable, Logger } from '@nestjs/common';
import { createCipheriv, createDecipheriv, createHash, randomBytes } from 'crypto';

import { AppException } from 'src/common/exceptions/app.exception';
import { ERROR_CODES } from 'src/common/exceptions/error-codes';
import { AppConfigService } from 'src/config/app-config.service';

const CREDENTIAL_KEY_VERSION = 'v1';

@Injectable()
export class LlmCryptoService {
  private readonly logger = new Logger(LlmCryptoService.name);
  private hasWarnedAboutFallback = false;

  constructor(private readonly appConfig: AppConfigService) {}

  encrypt(plainText: string): string {
    const iv = randomBytes(12);
    const cipher = createCipheriv('aes-256-gcm', this.getSecretKey(), iv);
    const encrypted = Buffer.concat([cipher.update(plainText.trim(), 'utf8'), cipher.final()]);
    const authTag = cipher.getAuthTag();

    return [
      CREDENTIAL_KEY_VERSION,
      iv.toString('base64url'),
      authTag.toString('base64url'),
      encrypted.toString('base64url'),
    ].join(':');
  }

  decrypt(payload: string): string {
    const [version, ivPart, authTagPart, encryptedPart] = payload.split(':');
    if (
      version !== CREDENTIAL_KEY_VERSION ||
      !ivPart ||
      !authTagPart ||
      !encryptedPart
    ) {
      throw this.buildStorageException();
    }

    try {
      const decipher = createDecipheriv(
        'aes-256-gcm',
        this.getSecretKey(),
        Buffer.from(ivPart, 'base64url'),
      );
      decipher.setAuthTag(Buffer.from(authTagPart, 'base64url'));

      return Buffer.concat([
        decipher.update(Buffer.from(encryptedPart, 'base64url')),
        decipher.final(),
      ]).toString('utf8');
    } catch {
      throw this.buildStorageException();
    }
  }

  private getSecretKey() {
    const secret = this.appConfig.llmCredentialsSecret.trim();
    if (!secret) {
      if (process.env.NODE_ENV !== 'production' && this.appConfig.databaseUrl.trim()) {
        if (!this.hasWarnedAboutFallback) {
          this.logger.warn(
            'LLM_CREDENTIALS_SECRET is missing. Falling back to DATABASE_URL-derived encryption key for local development.',
          );
          this.hasWarnedAboutFallback = true;
        }

        return createHash('sha256')
          .update(`dev-fallback:${this.appConfig.databaseUrl}`, 'utf8')
          .digest();
      }

      throw new AppException({
        status: 500,
        code: ERROR_CODES.internalError,
        message: 'Thiếu LLM_CREDENTIALS_SECRET nên chưa thể lưu hoặc đọc API key đã mã hóa.',
      });
    }

    return createHash('sha256').update(secret, 'utf8').digest();
  }

  private buildStorageException() {
    return new AppException({
      status: 500,
      code: ERROR_CODES.internalError,
      message: 'Không thể giải mã API key đã lưu. Kiểm tra lại LLM_CREDENTIALS_SECRET.',
    });
  }
}
