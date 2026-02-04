export interface User {
  id: string;
  email: string;
}

export interface CreditInfo {
  remaining: number;
  resetAt: string | null;
}

export interface IpUsage {
  ip: string;
  used: boolean;
  usedAt: string | null;
}

export interface AnalyticsEvent {
  id: string;
  eventType: string;
  userId: string | null;
  ipAddress: string;
  metadata: Record<string, unknown>;
  createdAt: string;
}

export interface UploadedFile {
  id: string;
  userId: string | null;
  fileName: string;
  filePath: string;
  fileSize: number;
  mimeType: string;
  createdAt: string;
}

export interface OcrResult {
  text: string;
  diagrams: string[];
}

export interface ValidationError {
  field: string;
  message: string;
}

export const LIMITS = {
  MAX_FILES_PER_SUBMISSION: 3,
  MAX_FILE_SIZE_MB: 5,
  MAX_FILE_SIZE_BYTES: 5 * 1024 * 1024,
  MAX_PDF_PAGES: 20,
  UNAUTHENTICATED_USES: 1,
  AUTHENTICATED_CREDITS: 3,
  CREDIT_RESET_HOURS: 24,
} as const;

export const ALLOWED_FILE_TYPES = [
  "image/jpeg",
  "image/png",
  "image/gif",
  "image/webp",
  "application/pdf",
] as const;
