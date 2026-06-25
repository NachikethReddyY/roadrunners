import { createHash, createHmac } from "crypto";

type R2Config = {
  accountId: string;
  accessKeyId: string;
  secretAccessKey: string;
  bucket: string;
};

const REGION = "auto";
const SERVICE = "s3";
const ALGORITHM = "AWS4-HMAC-SHA256";

function hmac(key: Buffer | string, value: string): Buffer {
  return createHmac("sha256", key).update(value).digest();
}

function sha256Hex(value: Buffer | string): string {
  return createHash("sha256").update(value).digest("hex");
}

function encodePathPart(value: string): string {
  return encodeURIComponent(value).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function canonicalObjectPath(bucket: string, key: string): string {
  return `/${encodePathPart(bucket)}/${key.split("/").map(encodePathPart).join("/")}`;
}

function amzTimestamp(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return {
    amzDate: iso,
    dateStamp: iso.slice(0, 8),
  };
}

function signingKey(secretAccessKey: string, dateStamp: string): Buffer {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, REGION);
  const serviceKey = hmac(regionKey, SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function credentialScope(dateStamp: string): string {
  return `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
}

function r2Host(accountId: string): string {
  return `${accountId}.r2.cloudflarestorage.com`;
}

function authorizationHeader(input: {
  config: R2Config;
  method: string;
  key: string;
  contentType: string;
  payloadHash: string;
  amzDate: string;
  dateStamp: string;
}): string {
  const host = r2Host(input.config.accountId);
  const canonicalUri = canonicalObjectPath(input.config.bucket, input.key);
  const canonicalHeaders = [
    `content-type:${input.contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${input.payloadHash}`,
    `x-amz-date:${input.amzDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    input.method,
    canonicalUri,
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    input.payloadHash,
  ].join("\n");
  const scope = credentialScope(input.dateStamp);
  const stringToSign = [
    ALGORITHM,
    input.amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(input.config.secretAccessKey, input.dateStamp))
    .update(stringToSign)
    .digest("hex");

  return [
    `${ALGORITHM} Credential=${input.config.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");
}

function presignedQueryString(input: {
  config: R2Config;
  key: string;
  expiresSeconds: number;
  amzDate: string;
  dateStamp: string;
}): string {
  const scope = credentialScope(input.dateStamp);
  const credential = `${input.config.accessKeyId}/${scope}`;
  const params = new URLSearchParams({
    "X-Amz-Algorithm": ALGORITHM,
    "X-Amz-Credential": credential,
    "X-Amz-Date": input.amzDate,
    "X-Amz-Expires": String(input.expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  });

  const sorted = [...params.entries()].sort(([a], [b]) => a.localeCompare(b));
  const canonicalQuery = sorted
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
  const host = r2Host(input.config.accountId);
  const canonicalRequest = [
    "GET",
    canonicalObjectPath(input.config.bucket, input.key),
    canonicalQuery,
    `host:${host}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    ALGORITHM,
    input.amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(input.config.secretAccessKey, input.dateStamp))
    .update(stringToSign)
    .digest("hex");

  params.set("X-Amz-Signature", signature);
  return [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${encodeURIComponent(key)}=${encodeURIComponent(value)}`)
    .join("&");
}

export async function uploadR2Object(
  config: R2Config,
  key: string,
  body: Buffer,
  contentType: string
) {
  const { amzDate, dateStamp } = amzTimestamp();
  const payloadHash = sha256Hex(body);
  const host = r2Host(config.accountId);
  const url = `https://${host}${canonicalObjectPath(config.bucket, key)}`;

  const res = await fetch(url, {
    method: "PUT",
    headers: {
      Authorization: authorizationHeader({
        config,
        method: "PUT",
        key,
        contentType,
        payloadHash,
        amzDate,
        dateStamp,
      }),
      "Content-Type": contentType,
      "x-amz-content-sha256": payloadHash,
      "x-amz-date": amzDate,
    },
    body: new Uint8Array(body),
  });

  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`R2 upload failed (${res.status}): ${detail}`);
  }
}

export function createR2SignedUrl(
  config: R2Config,
  key: string,
  expiresSeconds = 3600
): string {
  const { amzDate, dateStamp } = amzTimestamp();
  const host = r2Host(config.accountId);
  const query = presignedQueryString({
    config,
    key,
    expiresSeconds,
    amzDate,
    dateStamp,
  });
  return `https://${host}${canonicalObjectPath(config.bucket, key)}?${query}`;
}
