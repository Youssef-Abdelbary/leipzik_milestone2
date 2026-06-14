import nodemailer from 'nodemailer';

// Reuse one transporter for the lifetime of the process
let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;

  // Uses env vars — organizer sets SMTP credentials once in .env
  // Works with Gmail, SendGrid SMTP, Mailtrap (for dev), etc.
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',  // true = 465, false = 587 STARTTLS
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });

  return _transporter;
}

/**
 * Send a broadcast email to one guest.
 *
 * @param {object} opts
 * @param {string} opts.to          - Guest email address
 * @param {string} opts.guestName   - Guest full name for personalisation
 * @param {string} opts.subject     - Email subject (= broadcast title)
 * @param {string} opts.body        - Plain text message body
 * @param {string} opts.readUrl     - URL that marks this message as read when visited
 * @param {string} opts.eventTitle  - Name of the event (shown in footer)
 */
export async function sendBroadcastEmail({ to, guestName, subject, body, readUrl, eventTitle }) {
  const transporter = getTransporter();

  const firstName = (guestName || 'Guest').split(' ')[0];

  // HTML email — readable on phone, includes a tracking pixel + unobtrusive "mark as read" link
  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>${subject}</title>
    </head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">

        <!-- Header -->
        <div style="background:#0F172A;padding:20px 28px;">
          <span style="color:#F8FAFC;font-size:18px;font-weight:700;">PopEyez</span>
          <span style="color:#475569;font-size:13px;margin-left:8px;">/ ${eventTitle || 'Event'}</span>
        </div>

        <!-- Body -->
        <div style="padding:28px;">
          <p style="margin:0 0 6px;font-size:15px;color:#64748B;">Hello ${firstName},</p>
          <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0F172A;line-height:1.3;">${subject}</p>
          <div style="background:#F8FAFC;border-left:3px solid #0F172A;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</p>
          </div>
        </div>

        <!-- Footer -->
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;">
            You received this because you are a guest at <strong>${eventTitle || 'the event'}</strong>.
          </p>
          <!-- Clicking this marks the message as read — tells the organizer you received it -->
          <a href="${readUrl}" style="font-size:12px;color:#64748B;text-decoration:underline;">
            Mark as received
          </a>
        </div>

        <!-- 1×1 tracking pixel — loads when email is opened in most clients -->
        <img src="${readUrl}?pixel=1" width="1" height="1" style="display:block;width:1px;height:1px;border:0;" alt="" />
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text:    `${body}\n\n— PopEyez Events\nMark as received: ${readUrl}`,
    html,
  });
}

/**
 * Check whether SMTP is configured.
 * Used to decide whether to attempt email sending.
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}