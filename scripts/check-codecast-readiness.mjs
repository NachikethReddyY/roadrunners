#!/usr/bin/env node
import { createHash, createHmac } from "node:crypto";
import { existsSync, readFileSync } from "node:fs";
import { join } from "node:path";

const root = process.cwd();
const strict = process.argv.includes("--strict");
const liveR2 = process.argv.includes("--live-r2");

function loadEnvFile(file) {
  const path = join(root, file);
  if (!existsSync(path)) return {};
  const out = {};
  const raw = readFileSync(path, "utf8");
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed || trimmed.startsWith("#")) continue;
    const eq = trimmed.indexOf("=");
    if (eq === -1) continue;
    const key = trimmed.slice(0, eq).trim();
    let value = trimmed.slice(eq + 1).trim();
    if (
      (value.startsWith('"') && value.endsWith('"')) ||
      (value.startsWith("'") && value.endsWith("'"))
    ) {
      value = value.slice(1, -1);
    }
    out[key] = value;
  }
  return out;
}

const env = {
  ...loadEnvFile(".env"),
  ...loadEnvFile(".env.local"),
  ...process.env,
};

const results = [];

function value(key) {
  return env[key]?.trim() ?? "";
}

function isSet(key) {
  const v = value(key);
  return Boolean(v) && !/^your[-_]/i.test(v) && !v.includes("your-");
}

function check(level, label, detail) {
  results.push({ level, label, detail });
}

function pass(label, detail) {
  check("pass", label, detail);
}

function warn(label, detail) {
  check("warn", label, detail);
}

function fail(label, detail) {
  check("fail", label, detail);
}

function requireEnv(key, label, detail) {
  if (isSet(key)) pass(label, detail ?? `${key} is set.`);
  else fail(label, `${key} is missing or still a placeholder.`);
}

const REGION = "auto";
const SERVICE = "s3";
const ALGORITHM = "AWS4-HMAC-SHA256";

function hmac(key, input) {
  return createHmac("sha256", key).update(input).digest();
}

function sha256Hex(input) {
  return createHash("sha256").update(input).digest("hex");
}

function encodePathPart(input) {
  return encodeURIComponent(input).replace(/[!'()*]/g, (char) =>
    `%${char.charCodeAt(0).toString(16).toUpperCase()}`
  );
}

function r2Host(config) {
  return `${config.accountId}.r2.cloudflarestorage.com`;
}

function canonicalObjectPath(bucket, key) {
  return `/${encodePathPart(bucket)}/${key.split("/").map(encodePathPart).join("/")}`;
}

function amzTimestamp(date = new Date()) {
  const iso = date.toISOString().replace(/[:-]|\.\d{3}/g, "");
  return { amzDate: iso, dateStamp: iso.slice(0, 8) };
}

function credentialScope(dateStamp) {
  return `${dateStamp}/${REGION}/${SERVICE}/aws4_request`;
}

function signingKey(secretAccessKey, dateStamp) {
  const dateKey = hmac(`AWS4${secretAccessKey}`, dateStamp);
  const regionKey = hmac(dateKey, REGION);
  const serviceKey = hmac(regionKey, SERVICE);
  return hmac(serviceKey, "aws4_request");
}

function r2AuthorizationHeader({
  config,
  method,
  key,
  contentType,
  payloadHash,
  amzDate,
  dateStamp,
}) {
  const host = r2Host(config);
  const canonicalHeaders = [
    `content-type:${contentType}`,
    `host:${host}`,
    `x-amz-content-sha256:${payloadHash}`,
    `x-amz-date:${amzDate}`,
  ].join("\n");
  const signedHeaders = "content-type;host;x-amz-content-sha256;x-amz-date";
  const canonicalRequest = [
    method,
    canonicalObjectPath(config.bucket, key),
    "",
    `${canonicalHeaders}\n`,
    signedHeaders,
    payloadHash,
  ].join("\n");
  const scope = credentialScope(dateStamp);
  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");
  return [
    `${ALGORITHM} Credential=${config.accessKeyId}/${scope}`,
    `SignedHeaders=${signedHeaders}`,
    `Signature=${signature}`,
  ].join(", ");
}

function r2SignedReadUrl(config, key, expiresSeconds = 120) {
  const { amzDate, dateStamp } = amzTimestamp();
  const scope = credentialScope(dateStamp);
  const params = new URLSearchParams({
    "X-Amz-Algorithm": ALGORITHM,
    "X-Amz-Credential": `${config.accessKeyId}/${scope}`,
    "X-Amz-Date": amzDate,
    "X-Amz-Expires": String(expiresSeconds),
    "X-Amz-SignedHeaders": "host",
  });
  const canonicalQuery = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([keyName, val]) => `${encodeURIComponent(keyName)}=${encodeURIComponent(val)}`)
    .join("&");
  const canonicalRequest = [
    "GET",
    canonicalObjectPath(config.bucket, key),
    canonicalQuery,
    `host:${r2Host(config)}\n`,
    "host",
    "UNSIGNED-PAYLOAD",
  ].join("\n");
  const stringToSign = [
    ALGORITHM,
    amzDate,
    scope,
    sha256Hex(canonicalRequest),
  ].join("\n");
  const signature = createHmac("sha256", signingKey(config.secretAccessKey, dateStamp))
    .update(stringToSign)
    .digest("hex");
  params.set("X-Amz-Signature", signature);
  const query = [...params.entries()]
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([keyName, val]) => `${encodeURIComponent(keyName)}=${encodeURIComponent(val)}`)
    .join("&");
  return `https://${r2Host(config)}${canonicalObjectPath(config.bucket, key)}?${query}`;
}

async function putR2Object(config, key, body, contentType) {
  const { amzDate, dateStamp } = amzTimestamp();
  const payloadHash = sha256Hex(body);
  const res = await fetch(`https://${r2Host(config)}${canonicalObjectPath(config.bucket, key)}`, {
    method: "PUT",
    headers: {
      Authorization: r2AuthorizationHeader({
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
    body,
  });
  if (!res.ok) {
    const detail = await res.text().catch(() => "");
    throw new Error(`PUT failed ${res.status}: ${detail}`);
  }
}

async function runR2SmokeTest() {
  const config = {
    accountId: value("CLOUDFLARE_R2_ACCOUNT_ID"),
    accessKeyId: value("CLOUDFLARE_R2_ACCESS_KEY_ID"),
    secretAccessKey: value("CLOUDFLARE_R2_SECRET_ACCESS_KEY"),
    bucket: value("CLOUDFLARE_R2_BUCKET"),
  };
  const key = `readiness/codecast-smoke-${Date.now()}.txt`;
  const body = Buffer.from(`RoadRunners CodeCast R2 smoke ${new Date().toISOString()}\n`);
  await putR2Object(config, key, body, "text/plain");
  const readUrl = r2SignedReadUrl(config, key);
  const read = await fetch(readUrl);
  if (!read.ok) throw new Error(`signed GET failed ${read.status}`);
  const text = await read.text();
  if (text !== body.toString("utf8")) {
    throw new Error("signed GET returned different content");
  }
}

console.log("RoadRunners CodeCast readiness check\n");

if (existsSync(join(root, ".env.local"))) {
  pass(".env.local", "Local environment file found.");
} else {
  warn(".env.local", "Missing. Copy .env.example to .env.local before a live demo.");
}

requireEnv("NEXT_PUBLIC_SUPABASE_URL", "Supabase URL");
requireEnv("NEXT_PUBLIC_SUPABASE_ANON_KEY", "Supabase anon key");
requireEnv(
  "SUPABASE_SERVICE_ROLE_KEY",
  "Supabase service role key",
  "Required for TTS cache metadata and Supabase Storage fallback."
);

for (const file of [
  "supabase/migrations/001_initial.sql",
  "supabase/migrations/002_persist_generated_node.sql",
  "supabase/migrations/003_playground.sql",
  "supabase/migrations/004_scrim_sessions.sql",
  "supabase/seed.sql",
]) {
  if (existsSync(join(root, file))) pass(file, "Present.");
  else fail(file, "Missing migration/seed file.");
}

const ttsEnabled = value("SCRIM_TTS_ENABLED") !== "false";
if (!ttsEnabled) {
  warn("Narration", "SCRIM_TTS_ENABLED=false, so the Listen button will be disabled.");
} else if (isSet("ELEVENLABS_API_KEY")) {
  pass("ElevenLabs", "Narration API key is set.");
} else {
  warn("ElevenLabs", "ELEVENLABS_API_KEY is missing. CodeCasts still work, but no voiceover.");
}

const backend = value("TTS_STORAGE_BACKEND") === "r2" ? "r2" : "supabase";
if (backend === "r2") {
  pass("TTS cache backend", "Cloudflare R2 selected.");
  for (const key of [
    "CLOUDFLARE_R2_ACCOUNT_ID",
    "CLOUDFLARE_R2_ACCESS_KEY_ID",
    "CLOUDFLARE_R2_SECRET_ACCESS_KEY",
    "CLOUDFLARE_R2_BUCKET",
  ]) {
    if (isSet(key)) pass(key, "Set.");
    else fail(key, "Required when TTS_STORAGE_BACKEND=r2.");
  }
} else {
  pass("TTS cache backend", "Supabase Storage selected.");
  if (isSet("TTS_STORAGE_BUCKET")) {
    pass("Supabase TTS bucket", `${value("TTS_STORAGE_BUCKET")} configured.`);
  } else {
    warn("Supabase TTS bucket", "TTS_STORAGE_BUCKET missing; app defaults to tts-cache.");
  }
}

if (liveR2) {
  if (backend !== "r2") {
    warn("R2 live smoke test", "Skipped because TTS_STORAGE_BACKEND is not r2.");
  } else if (
    !isSet("CLOUDFLARE_R2_ACCOUNT_ID") ||
    !isSet("CLOUDFLARE_R2_ACCESS_KEY_ID") ||
    !isSet("CLOUDFLARE_R2_SECRET_ACCESS_KEY") ||
    !isSet("CLOUDFLARE_R2_BUCKET")
  ) {
    fail("R2 live smoke test", "Skipped because R2 credentials are incomplete.");
  } else {
    try {
      await runR2SmokeTest();
      pass("R2 live smoke test", "Uploaded a tiny object and read it through a signed URL.");
    } catch (error) {
      fail(
        "R2 live smoke test",
        error instanceof Error ? error.message : "Unknown R2 smoke test failure."
      );
    }
  }
}

const runner = value("SCRIM_RUNNER") || "browser";
if (!["browser", "auto", "daytona"].includes(runner)) {
  warn("SCRIM_RUNNER", `Unknown value "${runner}". App will fall back to browser.`);
} else {
  pass("SCRIM_RUNNER", `${runner} mode.`);
}

if (runner === "daytona" || runner === "auto") {
  if (isSet("DAYTONA_API_KEY")) {
    pass("Daytona", "API key is set for server-side Python runs.");
  } else if (runner === "auto") {
    warn("Daytona", "No API key. Python CodeCasts fall back to browser/Pyodide.");
  } else {
    fail("Daytona", "SCRIM_RUNNER=daytona but DAYTONA_API_KEY is missing.");
  }
} else {
  warn("Daytona", "Browser-only mode. Reliable for demo, but not a Daytona sandbox demo.");
}

for (const file of ["content/scrims/hello-python.json", "content/scrims/hello-react.json"]) {
  if (existsSync(join(root, file))) pass(file, "Demo CodeCast content present.");
  else warn(file, "Missing demo CodeCast content.");
}

const counts = results.reduce(
  (acc, item) => {
    acc[item.level] += 1;
    return acc;
  },
  { pass: 0, warn: 0, fail: 0 }
);

for (const item of results) {
  const icon = item.level === "pass" ? "PASS" : item.level === "warn" ? "WARN" : "FAIL";
  console.log(`[${icon}] ${item.label}${item.detail ? ` - ${item.detail}` : ""}`);
}

console.log(
  `\nSummary: ${counts.pass} pass, ${counts.warn} warning, ${counts.fail} fail.`
);

if (counts.fail > 0 && strict) {
  console.log("Strict mode failed. Fix FAIL items before the live demo.");
  process.exit(1);
}

if (counts.fail > 0) {
  console.log("Non-strict mode: FAIL items are reported but do not fail the command.");
}
