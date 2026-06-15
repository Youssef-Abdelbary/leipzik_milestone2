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

export async function sendFeedbackRequestEmail({ to, guestName, eventTitle, feedbackUrl }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const html = `
    <!DOCTYPE html>
    <html lang="en">
    <head><meta charset="UTF-8" /><title>Share your feedback</title></head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
        <div style="background:#0F172A;padding:20px 28px;">
          <span style="color:#F8FAFC;font-size:18px;font-weight:700;">PopEyez</span>
          <span style="color:#475569;font-size:13px;margin-left:8px;">/ Post-Event Feedback</span>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <div style="font-size:48px;margin-bottom:16px;">⭐</div>
          <p style="margin:0 0 6px;font-size:15px;color:#64748B;">Hi ${firstName},</p>
          <h1 style="margin:0 0 12px;font-size:24px;font-weight:800;color:#0F172A;">How was the event?</h1>
          <p style="margin:0 0 8px;font-size:16px;font-weight:600;color:#0F172A;">${eventTitle}</p>
          <p style="margin:0 0 28px;font-size:15px;color:#475569;line-height:1.6;">
            We'd love to hear your thoughts. It only takes a minute!
          </p>
          <a href="${feedbackUrl}" style="display:inline-block;padding:14px 36px;background:#0F172A;color:#fff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;">
            Share Feedback →
          </a>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">
            You attended <strong>${eventTitle}</strong>. If this was a mistake, ignore this email.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `How was ${eventTitle}? Share your feedback`,
    text:    `Hi ${firstName},\n\nWe'd love your feedback on ${eventTitle}.\n\nClick here: ${feedbackUrl}\n\n— PopEyez Events`,
    html,
  });
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
export async function sendInvitationEmail({ to, guestName, eventTitle, eventDate, eventTime, eventEndTime, venueName, dressCode, agenda, rsvpUrl }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const agendaHtml = Array.isArray(agenda) && agenda.length > 0
    ? `
      <div style="margin-top:20px;text-align:left;">
        <p style="margin:0 0 10px;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.07em;">Agenda</p>
        ${agenda.map(a => `
          <div style="display:flex;gap:12px;margin-bottom:8px;">
            <span style="font-size:13px;color:#4338CA;font-weight:600;min-width:52px;">${a.time}</span>
            <div>
              <p style="margin:0;font-size:14px;font-weight:600;color:#0F172A;">${a.title}</p>
              ${a.description ? `<p style="margin:2px 0 0;font-size:12px;color:#64748B;">${a.description}</p>` : ''}
            </div>
          </div>
        `).join('')}
      </div>
    ` : '';

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
          <p style="margin:0 0 20px;font-size:18px;font-weight:700;color:#0F172A;">${eventTitle}</p>

          <div style="background:#F8FAFC;border-radius:10px;padding:16px 20px;margin-bottom:24px;text-align:left;">
            ${formattedDate ? `
            <div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;">
              <span style="font-size:16px;">📅</span>
              <div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Date &amp; Time</p>
                <p style="margin:2px 0 0;font-size:14px;color:#0F172A;font-weight:600;">${formattedDate}${eventTime ? ` at ${eventTime}` : ''}${eventEndTime ? ` – ${eventEndTime}` : ''}</p>
              </div>
            </div>` : ''}

            ${venueName && venueName !== 'TBD' ? `
            <div style="display:flex;gap:12px;margin-bottom:10px;align-items:flex-start;">
              <span style="font-size:16px;">📍</span>
              <div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Venue</p>
                <p style="margin:2px 0 0;font-size:14px;color:#0F172A;font-weight:600;">${venueName}</p>
              </div>
            </div>` : ''}

            ${dressCode ? `
            <div style="display:flex;gap:12px;align-items:flex-start;">
              <span style="font-size:16px;">👔</span>
              <div>
                <p style="margin:0;font-size:13px;font-weight:700;color:#94A3B8;text-transform:uppercase;letter-spacing:0.06em;">Dress Code</p>
                <p style="margin:2px 0 0;font-size:14px;color:#0F172A;font-weight:600;">${dressCode}</p>
              </div>
            </div>` : ''}
          </div>

          ${agendaHtml}

          <div style="margin-top:28px;">
            <a href="${rsvpUrl}" style="display:inline-block;padding:14px 36px;background:#0F172A;color:#fff;text-decoration:none;border-radius:10px;font-size:16px;font-weight:700;">
              Respond to Invitation →
            </a>
          </div>
          <p style="margin:16px 0 0;font-size:12px;color:#94A3B8;">
            Or copy this link:<br/>
            <a href="${rsvpUrl}" style="color:#4338CA;word-break:break-all;">${rsvpUrl}</a>
          </p>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">
            You were added as a guest to <strong>${eventTitle}</strong>.
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
    text:    `Hello ${firstName},\n\nYou've been invited to ${eventTitle}${formattedDate ? ` on ${formattedDate}` : ''}.\n\nRSVP here: ${rsvpUrl}\n\n— PopEyez Events`,
    html,
  });
}


/**
 * Send RSVP confirmation with embedded QR code (inline, not attachment).
 */
export async function sendRsvpConfirmationWithQR({ to, guestName, eventTitle, eventDate, startTime, venueName, dressCode, qrBuffer, qrCode }) {
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
    <head><meta charset="UTF-8"/><title>You're confirmed!</title></head>
    <body style="margin:0;padding:0;background:#F8FAFC;font-family:system-ui,-apple-system,sans-serif;">
      <div style="max-width:560px;margin:32px auto;background:#fff;border-radius:12px;border:1px solid #E2E8F0;overflow:hidden;">
        <div style="background:#0F172A;padding:20px 28px;">
          <span style="color:#F8FAFC;font-size:18px;font-weight:700;">PopEyez</span>
          <span style="color:#475569;font-size:13px;margin-left:8px;">/ You're confirmed!</span>
        </div>
        <div style="padding:32px 28px;text-align:center;">
          <div style="font-size:52px;margin-bottom:16px;">🎉</div>
          <h1 style="margin:0 0 8px;font-size:26px;font-weight:800;color:#0F172A;">You're going!</h1>
          <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#0F172A;">${eventTitle}</p>
          ${formattedDate ? `<p style="margin:0 0 24px;font-size:14px;color:#64748B;">${formattedDate}${startTime ? ` at ${startTime}` : ''}</p>` : '<p style="margin:0 0 24px;"></p>'}
          ${venueName && venueName !== 'TBD' ? `<p style="margin:-16px 0 24px;font-size:13px;color:#64748B;">📍 ${venueName}</p>` : ''}
          ${dressCode ? `<p style="margin:-12px 0 20px;font-size:13px;color:#64748B;">👔 ${dressCode}</p>` : ''}

          <div style="background:#F8FAFC;border:1px solid #E2E8F0;border-radius:14px;padding:28px 24px;margin-bottom:24px;display:inline-block;">
            <p style="margin:0 0 18px;font-size:14px;font-weight:700;color:#0F172A;">Your Check-in QR Code</p>
            <img src="cid:qrcode_checkin" alt="QR Code" style="width:200px;height:200px;display:block;margin:0 auto;border-radius:8px;" />
            <p style="margin:16px 0 6px;font-size:13px;color:#64748B;line-height:1.5;">
              Show this at the entrance for <strong>instant check-in</strong>.
            </p>
            <p style="margin:0;font-size:11px;color:#94A3B8;font-family:monospace;letter-spacing:0.05em;">${qrCode}</p>
          </div>

          <p style="margin:0;font-size:13px;color:#94A3B8;">Save this email — you'll need it on event day!</p>
        </div>
        <div style="background:#F8FAFC;border-top:1px solid #E2E8F0;padding:16px 28px;text-align:center;">
          <p style="margin:0;font-size:12px;color:#94A3B8;">
            You confirmed your attendance at <strong>${eventTitle}</strong>.
          </p>
        </div>
      </div>
    </body>
    </html>
  `;

  await transporter.sendMail({
    from: `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `🎉 You're confirmed for ${eventTitle} — your QR code inside`,
    text: `Hi ${firstName},\n\nYou're confirmed for ${eventTitle}!\n\nShow your check-in code at the entrance: ${qrCode}\n\n— PopEyez Events`,
    html,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrBuffer,
        cid: 'qrcode_checkin', // referenced as cid: in html above
      },
    ],
  });
}

/**
 * Check whether SMTP credentials are configured.
 */
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}