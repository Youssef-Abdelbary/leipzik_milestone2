import nodemailer from 'nodemailer';

let _transporter = null;

function getTransporter() {
  if (_transporter) return _transporter;
  _transporter = nodemailer.createTransport({
    host:   process.env.SMTP_HOST   || 'smtp.gmail.com',
    port:   Number(process.env.SMTP_PORT || 587),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
  return _transporter;
}

/**
 * Send a broadcast message to a guest.
 */
export async function sendBroadcastEmail({ to, guestName, subject, body, readUrl, eventTitle }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

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
        <div style="background:#0F172A;padding:20px 28px;">
          <span style="color:#F8FAFC;font-size:18px;font-weight:700;">PopEyez</span>
          <span style="color:#475569;font-size:13px;margin-left:8px;">/ ${eventTitle || 'Event'}</span>
        </div>
        <div style="padding:28px;">
          <p style="margin:0 0 6px;font-size:15px;color:#64748B;">Hello ${firstName},</p>
          <p style="margin:0 0 24px;font-size:22px;font-weight:700;color:#0F172A;line-height:1.3;">${subject}</p>
          <div style="background:#F8FAFC;border-left:3px solid #0F172A;border-radius:0 8px 8px 0;padding:16px 20px;margin-bottom:24px;">
            <p style="margin:0;font-size:15px;color:#374151;line-height:1.7;white-space:pre-wrap;">${body}</p>
          </div>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0 0 8px;font-size:12px;color:#94A3B8;">
            You received this because you are a guest at <strong>${eventTitle || 'the event'}</strong>.
          </p>
          <a href="${readUrl}" style="font-size:12px;color:#64748B;text-decoration:underline;">Mark as received</a>
        </div>
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
 * Send an RSVP invitation email to a guest.
 * NEW: used by controllerGuest.js sendInvitation
 */
export async function sendInvitationEmail({ to, guestName, eventTitle, eventDate, eventTime, rsvpUrl }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head>
      <meta charset="UTF-8" />
      <meta name="viewport" content="width=device-width, initial-scale=1.0" />
      <title>You're invited to ${eventTitle}</title>
    </head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
        <div style="background:#0F172A;padding:20px 28px;">
          <span style="color:#F8FAFC;font-size:18px;font-weight:700;">PopEyez</span>
          <span style="color:#475569;font-size:13px;margin-left:8px;">/ Invitation</span>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">🎟</div>
          <p style="margin:0 0 6px;font-size:15px;color:#64748B;">Hello ${firstName},</p>
          <h1 style="margin:0 0 12px;font-size:28px;font-weight:800;color:#0F172A;">You're Invited!</h1>
          <p style="margin:0 0 8px;font-size:17px;font-weight:600;color:#0F172A;">${eventTitle}</p>
          ${formattedDate ? `<p style="margin:0 0 24px;font-size:14px;color:#64748B;">📅 ${formattedDate}${eventTime ? ` at ${eventTime}` : ''}</p>` : '<div style="margin-bottom:24px;"></div>'}
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            Please let us know whether you'll be attending. It only takes a second.
          </p>
          <a href="${rsvpUrl}" style="display:inline-block;padding:14px 36px;background:#0F172A;color:#fff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;">
            Respond to Invitation →
          </a>
          <p style="margin:20px 0 0;font-size:12px;color:#94A3B8;">
            Or copy this link:<br/>
            <a href="${rsvpUrl}" style="color:#4338CA;word-break:break-all;">${rsvpUrl}</a>
          </p>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">
            You were added as a guest to <strong>${eventTitle}</strong>.
            If you believe this is a mistake, you can safely ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `You're invited to ${eventTitle}`,
    text:    `Hello ${firstName},\n\nYou've been invited to ${eventTitle}${formattedDate ? ` on ${formattedDate}` : ''}.\n\nPlease RSVP here: ${rsvpUrl}\n\n— PopEyez Events`,
    html,
  });
}

/**
 * Check whether SMTP credentials are configured.
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}