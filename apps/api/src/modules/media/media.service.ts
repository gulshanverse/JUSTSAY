import { MediaAssetDto } from '@justsay/shared-types';
import { UploadMediaRequest, UploadMediaResponse } from '@justsay/contracts';
import * as crypto from 'crypto';

export interface MediaStorageAdapter {
  storeAsset(asset: MediaAssetDto, buffer?: Buffer): Promise<string>;
  getAsset(assetId: string): Promise<MediaAssetDto | undefined>;
}

export class DevelopmentStorageAdapter implements MediaStorageAdapter {
  private memoryStore = new Map<string, MediaAssetDto>();

  public async storeAsset(asset: MediaAssetDto): Promise<string> {
    this.memoryStore.set(asset.id, asset);
    return asset.assetUrl;
  }

  public async getAsset(assetId: string): Promise<MediaAssetDto | undefined> {
    return this.memoryStore.get(assetId);
  }
}

export class ProductionObjectStorageAdapter implements MediaStorageAdapter {
  private memoryStore = new Map<string, MediaAssetDto>();
  private bucketName: string;

  constructor(bucketName: string = 'justsay-media-prod') {
    this.bucketName = bucketName;
  }

  public async storeAsset(asset: MediaAssetDto): Promise<string> {
    const assetUrl = `https://storage.googleapis.com/${this.bucketName}/${asset.id}`;
    const prodAsset = { ...asset, assetUrl };
    this.memoryStore.set(asset.id, prodAsset);
    return assetUrl;
  }

  public async getAsset(assetId: string): Promise<MediaAssetDto | undefined> {
    return this.memoryStore.get(assetId);
  }
}

export class MediaStorageService {
  private adapter: MediaStorageAdapter;
  private maxFileSizeBytes = 5 * 1024 * 1024; // 5 MB
  private allowedMimeTypes = new Set(['image/png', 'image/jpeg', 'image/webp']);

  constructor(adapter?: MediaStorageAdapter) {
    this.adapter = adapter || new DevelopmentStorageAdapter();
  }

  // Magic Bytes Validation Protocol
  private validateMagicBytes(buffer: Buffer, mimeType: string): boolean {
    if (!buffer || buffer.length < 4) return false;

    // PNG: 89 50 4E 47 (.PNG)
    if (mimeType === 'image/png') {
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4E && buffer[3] === 0x47;
    }

    // JPEG: FF D8 FF
    if (mimeType === 'image/jpeg') {
      return buffer[0] === 0xFF && buffer[1] === 0xD8 && buffer[2] === 0xFF;
    }

    // WebP: RIFF ... WEBP (bytes 0-3: 52 49 46 46, bytes 8-11: 57 45 42 50)
    if (mimeType === 'image/webp') {
      if (buffer.length < 12) return false;
      const isRiff = buffer[0] === 0x52 && buffer[1] === 0x49 && buffer[2] === 0x46 && buffer[3] === 0x46;
      const isWebp = buffer[8] === 0x57 && buffer[9] === 0x45 && buffer[10] === 0x42 && buffer[11] === 0x50;
      return isRiff && isWebp;
    }

    return false;
  }

  public async uploadMedia(authHandle: string, req: UploadMediaRequest): Promise<UploadMediaResponse> {
    const mime = (req.mimeType || '').toLowerCase();
    if (!this.allowedMimeTypes.has(mime)) {
      return {
        success: false,
        error: 'Unsupported media format. Only PNG, JPEG, and WebP images are permitted.'
      };
    }

    if (!req.fileSizeBytes || req.fileSizeBytes > this.maxFileSizeBytes) {
      return {
        success: false,
        error: 'File size exceeds maximum allowed limit of 5MB.'
      };
    }

    // Inspect Base64 header/magic bytes if provided
    if (req.base64Content) {
      try {
        const buf = Buffer.from(req.base64Content, 'base64');
        const isValidMagic = this.validateMagicBytes(buf, mime);
        if (!isValidMagic) {
          return {
            success: false,
            error: 'Media validation failed: file header/magic bytes do not match declared MIME type.'
          };
        }
      } catch (err) {
        return {
          success: false,
          error: 'Malformed media content payload.'
        };
      }
    }

    const assetId = `asset_${Date.now()}_${crypto.randomBytes(6).toString('hex')}`;
    const asset: MediaAssetDto = {
      id: assetId,
      ownerHandle: authHandle,
      mimeType: mime,
      fileSizeBytes: req.fileSizeBytes,
      width: req.width || 1080,
      height: req.height || 1920,
      assetUrl: `https://justsay.app/media/assets/${assetId}`,
      createdAt: Date.now()
    };

    const finalUrl = await this.adapter.storeAsset(asset);
    asset.assetUrl = finalUrl;

    return {
      success: true,
      asset
    };
  }

  public async getAsset(assetId: string): Promise<MediaAssetDto | undefined> {
    return this.adapter.getAsset(assetId);
  }
}

