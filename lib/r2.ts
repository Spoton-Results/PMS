import { PutObjectCommand, S3Client } from "@aws-sdk/client-s3";
import { getSignedUrl } from "@aws-sdk/s3-request-presigner";

export type UploadPurpose = "vendor-document" | "proof-media" | "invoice-attachment";

function requireEnv(name: string) {
  const value = process.env[name];
  if (!value) {
    throw new Error(`${name} is not configured.`);
  }
  return value;
}

export function getR2Client() {
  return new S3Client({
    region: "auto",
    endpoint: requireEnv("R2_ENDPOINT"),
    credentials: {
      accessKeyId: requireEnv("R2_ACCESS_KEY_ID"),
      secretAccessKey: requireEnv("R2_SECRET_ACCESS_KEY")
    }
  });
}

export function getR2PublicBaseUrl() {
  return process.env.R2_PUBLIC_BASE_URL || "";
}

export function buildStorageKey(input: {
  organizationId: string;
  purpose: UploadPurpose;
  entityId: string;
  filename: string;
}) {
  const safeFilename = input.filename
    .toLowerCase()
    .replace(/[^a-z0-9.\-_]+/g, "-")
    .replace(/-+/g, "-")
    .slice(0, 120);

  const timestamp = Date.now();
  return `${input.organizationId}/${input.purpose}/${input.entityId}/${timestamp}-${safeFilename}`;
}

export async function createPresignedUploadUrl(input: {
  key: string;
  contentType: string;
  expiresInSeconds?: number;
}) {
  const bucket = requireEnv("R2_BUCKET_NAME");
  const client = getR2Client();

  const command = new PutObjectCommand({
    Bucket: bucket,
    Key: input.key,
    ContentType: input.contentType
  });

  return getSignedUrl(client, command, {
    expiresIn: input.expiresInSeconds ?? 300
  });
}

export function getPublicFileUrl(key: string) {
  const baseUrl = getR2PublicBaseUrl();
  if (!baseUrl) return key;
  return `${baseUrl.replace(/\/$/, "")}/${key}`;
}
