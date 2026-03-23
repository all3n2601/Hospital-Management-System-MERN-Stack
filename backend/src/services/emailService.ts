import nodemailer from 'nodemailer';
import { logger } from '../middleware/requestLogger';

/**
 * Sends an email with the generated document PDF as an attachment.
 * If required env vars are missing, logs a warning and returns without throwing
 * (graceful no-op for local dev).
 */
export async function sendDocumentEmail(
  to: string,
  documentType: string,
  patientName: string,
  pdfBuffer: Buffer
): Promise<void> {
  const host = process.env.EMAIL_HOST;
  const port = parseInt(process.env.EMAIL_PORT ?? '587', 10);
  const user = process.env.EMAIL_USER;
  const pass = process.env.EMAIL_PASS;

  if (!host || !user || !pass) {
    logger.warn('Email env vars (EMAIL_HOST, EMAIL_USER, EMAIL_PASS) not set — skipping email send');
    return;
  }

  const transporter = nodemailer.createTransport({
    host,
    port,
    auth: { user, pass },
  });

  const formattedType = documentType
    .split('_')
    .map((w) => w.charAt(0).toUpperCase() + w.slice(1))
    .join(' ');

  await transporter.sendMail({
    from: user,
    to,
    subject: `Your ${formattedType} - Medicore HMS`,
    text: `Dear ${patientName},\n\nPlease find attached your ${formattedType}.\n\nRegards,\nMedicore Hospital Management System`,
    attachments: [
      {
        filename: `${documentType}.pdf`,
        content: pdfBuffer,
        contentType: 'application/pdf',
      },
    ],
  });
}
