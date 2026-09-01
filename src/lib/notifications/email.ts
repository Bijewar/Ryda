import nodemailer from 'nodemailer';
import { env } from '@/lib/env';
import { isDemoMode, setDemoOtp } from '@/lib/demo-mode';
import { logger } from '@/lib/observability/logger';
import { generateEmailOtp } from '@/lib/auth/otp';

/**
 * Email notifications — Nodemailer + Gmail SMTP.
 *
 * Why Gmail SMTP instead of Resend/SendGrid?
 *   - Free with any Gmail account (just enable 2FA + create an App Password)
 *   - No API key signup, no monthly quota anxiety
 *   - 500 emails/day free — plenty for a portfolio demo
 *   - If you outgrow Gmail, swap the transporter config for any SMTP
 *     provider (Amazon SES, Mailgun, etc.) — the function signatures stay
 *     the same.
 *
 * In demo mode, OTP emails are logged to console + cached in the demo OTP
 * store (visible at `/dev/otp`). No SMTP config needed.
 */

let transporter: nodemailer.Transporter | null = null;

function getTransporter(): nodemailer.Transporter | null {
  if (isDemoMode || !env.SMTP_USER || !env.SMTP_PASS) return null;
  if (transporter) return transporter;
  transporter = nodemailer.createTransport({
    host: env.SMTP_HOST,
    port: env.SMTP_PORT,
    secure: env.SMTP_PORT === 465,
    auth: { user: env.SMTP_USER, pass: env.SMTP_PASS },
  });
  return transporter;
}

/** Send an OTP email — generates a 6-digit code and dispatches it. */
export async function sendOtpEmail(email: string, displayName: string): Promise<string> {
  const code = generateEmailOtp(email);
  if (isDemoMode) {
    setDemoOtp(email, code);
    logger.info({ email, code }, '📧 [DEMO] OTP email');
    return code;
  }
  const transport = getTransporter();
  if (!transport) {
    logger.warn({ email }, 'SMTP not configured — OTP not sent (check SMTP_USER/SMTP_PASS)');
    return code;
  }
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Your Ryda verification code',
    html: otpEmailHtml(displayName, code),
  });
  return code;
}

/** Send a welcome email after successful registration. */
export async function sendWelcomeEmail(email: string, name: string): Promise<void> {
  if (isDemoMode) {
    logger.info({ email, name }, '📧 [DEMO] Welcome email');
    return;
  }
  const transport = getTransporter();
  if (!transport) return;
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Welcome to Ryda',
    html: `<div style="font-family:-apple-system,system-ui,sans-serif;max-width:480px;margin:0 auto;"><h1 style="color:#00FF87;">Ryda</h1><p>Hi ${name},</p><p>Welcome to Ryda v2 — production-grade ride-hailing for Bhopal.</p><p>Book your first ride at ${env.NEXT_PUBLIC_APP_URL}</p></div>`,
  });
}

/** Send a ride receipt email. */
export async function sendRideReceiptEmail(opts: {
  email: string;
  passengerName: string;
  rideId: string;
  farePaise: number;
  currency: string;
  pickupAddress: string;
  dropoffAddress: string;
  completedAt: string;
}): Promise<void> {
  if (isDemoMode) {
    logger.info({ email: opts.email, rideId: opts.rideId }, '📧 [DEMO] Receipt email');
    return;
  }
  const transport = getTransporter();
  if (!transport) return;
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: opts.email,
    subject: `Ryda receipt · ${(opts.farePaise / 100).toFixed(2)} ${opts.currency}`,
    html: receiptEmailHtml(opts),
  });
}

/** Send a password reset email with a one-time link. */
export async function sendPasswordResetEmail(email: string, resetUrl: string): Promise<void> {
  if (isDemoMode) {
    logger.info({ email, resetUrl }, '📧 [DEMO] Password reset email');
    return;
  }
  const transport = getTransporter();
  if (!transport) return;
  await transport.sendMail({
    from: env.EMAIL_FROM,
    to: email,
    subject: 'Reset your Ryda password',
    html: `<p>Click <a href="${resetUrl}">here</a> to reset your password. This link expires in 30 minutes.</p>`,
  });
}

// ── Inline HTML templates (the React Email versions live in /emails) ──────

function otpEmailHtml(name: string, code: string): string {
  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #00FF87;">Ryda</h1>
      <p>Hi ${name},</p>
      <p>Your Ryda verification code is:</p>
      <p style="font-size: 32px; letter-spacing: 8px; font-weight: 700; color: #0A0A0B; background: #00FF87; padding: 16px; text-align: center; border-radius: 8px;">
        ${code}
      </p>
      <p>This code expires in 5 minutes. If you didn't request it, ignore this email.</p>
    </div>
  `;
}

function receiptEmailHtml(opts: {
  passengerName: string;
  farePaise: number;
  currency: string;
  pickupAddress: string;
  dropoffAddress: string;
  completedAt: string;
}): string {
  const fare = (opts.farePaise / 100).toFixed(2);
  return `
    <div style="font-family: -apple-system, system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
      <h1 style="color: #00FF87;">Ryda</h1>
      <p>Hi ${opts.passengerName},</p>
      <p>Thanks for riding with Ryda. Here's your receipt:</p>
      <table style="width: 100%; border-collapse: collapse;">
        <tr><td style="padding: 8px 0;">From</td><td>${opts.pickupAddress}</td></tr>
        <tr><td style="padding: 8px 0;">To</td><td>${opts.dropoffAddress}</td></tr>
        <tr><td style="padding: 8px 0;">Completed</td><td>${opts.completedAt}</td></tr>
        <tr><td style="padding: 16px 0; font-weight: 700; font-size: 18px;">Total</td><td style="font-weight: 700; font-size: 18px;">${fare} ${opts.currency}</td></tr>
      </table>
    </div>
  `;
}
