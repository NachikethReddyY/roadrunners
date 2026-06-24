import { z } from "zod";

export const emailSchema = z
  .string()
  .trim()
  .toLowerCase()
  .email("Enter a valid email address");

export function normalizeOtpCode(value: string | number) {
  return String(value).replace(/\D/g, "").padStart(6, "0").slice(-6);
}

export const otpCodeSchema = z
  .string()
  .trim()
  .transform(normalizeOtpCode)
  .refine((value) => /^\d{6}$/.test(value), {
    message: "Enter the 6-digit code from your email",
  });
