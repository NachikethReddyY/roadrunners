import { createMailTransport, getSmtpConfig } from "@/lib/email/smtp";
import { AUTH_OTP_TTL_MINUTES } from "@/lib/auth/otp";

type SendAuthCodeEmailParams = {
  to: string;
  code: string;
};

export async function sendAuthCodeEmail({
  to,
  code,
}: SendAuthCodeEmailParams): Promise<void> {
  const config = getSmtpConfig();
  const transport = createMailTransport(config);

  await transport.sendMail({
    from: config.from,
    to,
    subject: "Your RoadRunners sign-in code",
    text: [
      "Your RoadRunners sign-in code is:",
      "",
      code,
      "",
      `This code expires in ${AUTH_OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.`,
    ].join("\n"),
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 420px; line-height: 1.5; color: #1a1a1a;">
        <p style="margin: 0 0 16px;">Your RoadRunners sign-in code is:</p>
        <p style="margin: 0 0 24px; font-size: 32px; font-weight: 700; letter-spacing: 0.2em;">${code}</p>
        <p style="margin: 0; font-size: 14px; color: #666;">This code expires in ${AUTH_OTP_TTL_MINUTES} minutes. If you did not request it, you can ignore this email.</p>
      </div>
    `,
  });
}
