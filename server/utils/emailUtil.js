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

// ─── Shared email shell ───────────────────────────────────────────────────────
// All emails share this outer wrapper so the brand stays consistent.
function emailShell({ subtitle, bodyHtml, footerHtml, footerNote }) {
  return `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <meta name="color-scheme" content="dark"/>
  <meta name="supported-color-schemes" content="dark"/>
  <title>PopEyez</title>
</head>
<body style="margin:0;padding:0;background:#0a0a12;color:#ede9ff;font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Helvetica,Arial,sans-serif;">
  <!-- Outer wrapper -->
  <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="background:#0a0a12;background-image:radial-gradient(ellipse 80% 50% at 50% -10%, rgba(139,109,255,0.14), transparent), radial-gradient(ellipse 60% 40% at 90% 100%, rgba(62,207,184,0.09), transparent);padding:32px 16px;">
    <tr><td align="center">
      <!-- Card -->
      <table role="presentation" width="100%" style="max-width:560px;background:#13131e;border-radius:16px;border:1px solid rgba(255,255,255,0.08);overflow:hidden;">

        <!-- Header bar -->
        <tr>
          <td style="background:linear-gradient(135deg,#1a1030 0%,#0d1f2d 100%);border-bottom:1px solid rgba(139,109,255,0.25);padding:0;">
            <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
              <tr>
                <td style="padding:18px 28px;">
                  <table role="presentation" cellpadding="0" cellspacing="0">
                    <tr>
                      <!-- Logo ring / mark (inline SVG) -->
                      <td style="vertical-align:middle;padding-right:14px;">
                        <div style="width:44px;height:44px;border-radius:50%;background:linear-gradient(135deg,rgba(139,109,255,0.15) 0%,rgba(62,207,184,0.15) 100%);border:1.5px solid rgba(139,109,255,0.4);display:flex;align-items:center;justify-content:center;overflow:hidden;">
                          <svg width="44" height="44" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                            <!-- Outer gradient ring -->
                            <defs>
                              <linearGradient id="lg1" x1="0%" y1="0%" x2="100%" y2="100%">
                                <stop offset="0%" stop-color="#8b6dff"/>
                                <stop offset="100%" stop-color="#3ecfb8"/>
                              </linearGradient>
                            </defs>
                            <circle cx="22" cy="22" r="20" fill="none" stroke="url(#lg1)" stroke-width="1.5" stroke-dasharray="5 3"/>
                            <!-- Inner eye shape -->
                            <ellipse cx="22" cy="22" rx="7" ry="5" fill="none" stroke="#8b6dff" stroke-width="1.5"/>
                            <circle cx="22" cy="22" r="2.5" fill="#3ecfb8"/>
                          </svg>
                        </div>
                      </td>
                      <!-- Brand name + subtitle -->
                      <td style="vertical-align:middle;">
                        <div style="font-size:18px;font-weight:900;letter-spacing:-0.03em;background:linear-gradient(90deg,#8b6dff,#3ecfb8);-webkit-background-clip:text;background-clip:text;color:#8b6dff;line-height:1.1;">PopEyez</div>
                        <div style="font-size:11px;color:rgba(237,233,255,0.45);font-weight:600;letter-spacing:0.06em;text-transform:uppercase;margin-top:2px;">${subtitle || 'Events Platform'}</div>
                      </td>
                    </tr>
                  </table>
                </td>
              </tr>
            </table>
          </td>
        </tr>
        <!-- Gradient accent line under header -->
        <tr>
          <td style="height:2px;background:linear-gradient(90deg,#8b6dff 0%,#3ecfb8 60%,transparent 100%);padding:0;"></td>
        </tr>

        <!-- Body -->
        <tr><td style="padding:32px 28px;">${bodyHtml}</td></tr>

        <!-- Footer -->
        <tr>
          <td style="background:#0f0f19;border-top:1px solid rgba(255,255,255,0.06);padding:20px 28px;text-align:center;">
            ${footerHtml || ''}
            <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto 10px;">
              <tr>
                <td style="vertical-align:middle;padding-right:6px;">
                  <svg width="16" height="16" viewBox="0 0 44 44" xmlns="http://www.w3.org/2000/svg">
                    <defs>
                      <linearGradient id="lg2" x1="0%" y1="0%" x2="100%" y2="100%">
                        <stop offset="0%" stop-color="#8b6dff"/>
                        <stop offset="100%" stop-color="#3ecfb8"/>
                      </linearGradient>
                    </defs>
                    <circle cx="22" cy="22" r="20" fill="none" stroke="url(#lg2)" stroke-width="2" stroke-dasharray="5 3"/>
                    <ellipse cx="22" cy="22" rx="7" ry="5" fill="none" stroke="#8b6dff" stroke-width="2"/>
                    <circle cx="22" cy="22" r="2.5" fill="#3ecfb8"/>
                  </svg>
                </td>
                <td style="vertical-align:middle;font-size:12px;font-weight:700;color:rgba(237,233,255,0.35);letter-spacing:0.02em;">PopEyez</td>
              </tr>
            </table>
            <p style="margin:0;font-size:11px;color:rgba(237,233,255,0.25);">
              ${footerNote || 'You received this because you were added to an event · powered by the opal platform'}
            </p>
          </td>
        </tr>

      </table>
    </td></tr>
  </table>
</body>
</html>`;
}

// ─── Shared CTA button ────────────────────────────────────────────────────────
function ctaBtn(href, label) {
  return `
    <table role="presentation" cellpadding="0" cellspacing="0" style="margin:0 auto;">
      <tr>
        <td style="border-radius:12px;background:linear-gradient(135deg,#8b6dff 0%,#4de7e3 100%);box-shadow:0 12px 28px rgba(77,231,227,0.18),0 12px 28px rgba(139,109,255,0.16);">
          <a href="${href}"
             style="display:inline-block;padding:14px 32px;border-radius:12px;
                    color:#071018;text-decoration:none;font-size:15px;font-weight:800;
                    letter-spacing:0.01em;font-family:inherit;">
            ${label}
          </a>
        </td>
      </tr>
    </table>`;
}

// ─── Glass panel with gradient border (email-safe table wrapper) ──────────────
function glassPanel(innerHtml) {
  return `
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      <tr>
        <td style="background:linear-gradient(135deg,#8b6dff 0%,#3ecfb8 100%);border-radius:14px;padding:1px;">
          <div style="background:#0f0f19;border-radius:13px;padding:20px 22px;">
            ${innerHtml}
          </div>
        </td>
      </tr>
    </table>`;
}

// ─── Credential field (label + highlighted value block) ───────────────────────
function credentialField(label, value, { accent = '#8b6dff', monospace = false, href = null } = {}) {
  const valueHtml = href
    ? `<a href="${href}" style="color:${accent};text-decoration:none;word-break:break-all;">${value}</a>`
    : value;
  const valueStyle = monospace
    ? `margin:8px 0 0;font-size:15px;font-weight:700;color:#ede9ff;
       font-family:Consolas,Menlo,Monaco,'Courier New',monospace;letter-spacing:0.05em;
       background:rgba(255,255,255,0.04);border:1px solid rgba(255,255,255,0.08);
       border-radius:8px;padding:10px 14px;word-break:break-all;display:block;`
    : `margin:8px 0 0;font-size:14px;font-weight:600;color:#ede9ff;word-break:break-all;display:block;`;

  return `
    <div style="margin-bottom:18px;">
      <p style="margin:0;font-size:11px;font-weight:700;color:rgba(237,233,255,0.35);
                text-transform:uppercase;letter-spacing:0.08em;">
        <span style="display:inline-block;width:8px;height:8px;border-radius:50%;
                     background:${accent};margin-right:8px;vertical-align:middle;"></span>${label}
      </p>
      <span style="${valueStyle}">${valueHtml}</span>
    </div>`;
}

// ─── Detail row (icon dot + label + value) ────────────────────────────────────
function detailRow(dotColor, label, value) {
  return `
    <tr>
      <td style="padding:8px 0;vertical-align:top;">
        <table role="presentation" cellpadding="0" cellspacing="0" width="100%">
          <tr>
            <td width="20" style="vertical-align:top;padding-top:4px;">
              <div style="width:8px;height:8px;border-radius:50%;background:${dotColor};"></div>
            </td>
            <td style="vertical-align:top;">
              <p style="margin:0;font-size:11px;font-weight:700;color:rgba(237,233,255,0.35);text-transform:uppercase;letter-spacing:0.08em;">${label}</p>
              <p style="margin:2px 0 0;font-size:14px;font-weight:600;color:#ede9ff;">${value}</p>
            </td>
          </tr>
        </table>
      </td>
    </tr>`;
}


// ─── Feedback request ─────────────────────────────────────────────────────────
export async function sendFeedbackRequestEmail({ to, guestName, eventTitle, feedbackUrl }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const body = `
    <p style="margin:0 0 6px;font-size:14px;color:rgba(237,233,255,0.5);">Hi ${firstName},</p>
    <h1 style="margin:0 0 16px;font-size:26px;font-weight:900;color:#ede9ff;letter-spacing:-0.03em;line-height:1.2;">
      How was the event?
    </h1>
    <p style="margin:0 0 6px;font-size:16px;font-weight:700;color:#ede9ff;">${eventTitle}</p>
    <p style="margin:0 0 28px;font-size:14px;color:rgba(237,233,255,0.52);line-height:1.7;">
      Your feedback takes less than a minute and helps the organiser make the next event even better.
    </p>
    <!-- Star row (decorative) -->
    <p style="text-align:center;font-size:26px;letter-spacing:8px;margin:0 0 28px;">
      <span style="color:#f5a623;">★★★★★</span>
    </p>
    ${ctaBtn(feedbackUrl, 'Leave Your Feedback →')}
  `;

  const footer = `
    <p style="margin:0;font-size:12px;color:rgba(237,233,255,0.35);">
      You attended <strong style="color:rgba(237,233,255,0.6);">${eventTitle}</strong>.
      If this doesn't apply to you, ignore this email.
    </p>
  `;

  const html = emailShell({ subtitle: 'Post-Event Feedback', bodyHtml: body, footerHtml: footer });

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `How was ${eventTitle}? Share your feedback`,
    text:    `Hi ${firstName},\n\nWe'd love your feedback on ${eventTitle}.\n\nClick here: ${feedbackUrl}\n\n— PopEyez Events`,
    html,
  });
}


// ─── Broadcast message ────────────────────────────────────────────────────────
export async function sendBroadcastEmail({ to, guestName, subject, body, readUrl, eventTitle }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:14px;color:rgba(237,233,255,0.5);">Hello ${firstName},</p>
    <h1 style="margin:0 0 20px;font-size:22px;font-weight:800;color:#ede9ff;letter-spacing:-0.02em;line-height:1.3;">
      ${subject}
    </h1>
    <!-- Message bubble -->
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0" style="margin-bottom:24px;">
      <tr>
        <td style="background:rgba(30,30,41,0.72);border:1px solid rgba(255,255,255,0.08);border-left:3px solid #8b6dff;border-radius:0 12px 12px 0;padding:18px 20px;">
          <p style="margin:0;font-size:14px;color:rgba(237,233,255,0.75);line-height:1.75;white-space:pre-wrap;">${body}</p>
        </td>
      </tr>
    </table>
  `;

  const footerHtml = `
    <p style="margin:0 0 8px;font-size:12px;color:rgba(237,233,255,0.35);">
      You received this because you are a guest at <strong style="color:rgba(237,233,255,0.6);">${eventTitle || 'the event'}</strong>.
    </p>
    <a href="${readUrl}" style="font-size:12px;color:#4de7e3;text-decoration:none;font-weight:700;">Mark as received</a>
  `;

  const html = emailShell({ subtitle: eventTitle || 'Message', bodyHtml, footerHtml }) +
    `<img src="${readUrl}?pixel=1" width="1" height="1" style="display:none;" alt=""/>`;

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject,
    text:    `${body}\n\n— PopEyez Events\nMark as received: ${readUrl}`,
    html,
  });
}


// ─── Invitation ───────────────────────────────────────────────────────────────
export async function sendInvitationEmail({ to, guestName, eventTitle, eventDate, eventTime, eventEndTime, venueName, dressCode, agenda, rsvpUrl }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const detailsRows = [
    formattedDate ? detailRow('#8b6dff', 'Date &amp; Time', `${formattedDate}${eventTime ? ` at ${eventTime}` : ''}${eventEndTime ? ` – ${eventEndTime}` : ''}`) : '',
    venueName && venueName !== 'TBD' ? detailRow('#3ecfb8', 'Venue', venueName) : '',
    dressCode ? detailRow('#c084fc', 'Dress Code', dressCode) : '',
  ].filter(Boolean).join('');

  const agendaHtml = Array.isArray(agenda) && agenda.length > 0 ? `
    <p style="margin:24px 0 12px;font-size:12px;font-weight:700;color:rgba(237,233,255,0.35);text-transform:uppercase;letter-spacing:0.08em;">Agenda</p>
    <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
      ${agenda.map(a => `
        <tr>
          <td width="56" style="vertical-align:top;padding:6px 0;">
            <span style="font-size:12px;color:#8b6dff;font-weight:700;">${a.time}</span>
          </td>
          <td style="vertical-align:top;padding:6px 0 6px 8px;">
            <p style="margin:0;font-size:14px;font-weight:600;color:#ede9ff;">${a.title}</p>
            ${a.description ? `<p style="margin:2px 0 0;font-size:12px;color:rgba(237,233,255,0.45);">${a.description}</p>` : ''}
          </td>
        </tr>
      `).join('')}
    </table>
  ` : '';

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:14px;color:rgba(237,233,255,0.5);">Hello ${firstName},</p>
    <h1 style="margin:0 0 6px;font-size:28px;font-weight:900;color:#ede9ff;letter-spacing:-0.03em;">You're Invited!</h1>
    <p style="margin:0 0 24px;font-size:17px;font-weight:700;color:#8b6dff;">${eventTitle}</p>

    ${detailsRows ? `
    <div style="background:#0f0f19;border-radius:12px;padding:18px 20px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailsRows}
      </table>
    </div>` : ''}

    ${agendaHtml}

    <div style="margin-top:28px;text-align:center;">
      ${ctaBtn(rsvpUrl, 'Respond to Invitation →')}
    </div>
    <p style="margin:16px 0 0;font-size:11px;color:rgba(237,233,255,0.28);text-align:center;word-break:break-all;">
      <a href="${rsvpUrl}" style="color:rgba(139,109,255,0.7);text-decoration:none;">${rsvpUrl}</a>
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;font-size:12px;color:rgba(237,233,255,0.35);">
      You were added as a guest to <strong style="color:rgba(237,233,255,0.6);">${eventTitle}</strong>.
    </p>
  `;

  const html = emailShell({ subtitle: 'Invitation', bodyHtml, footerHtml });

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `You're invited to ${eventTitle}`,
    text:    `Hello ${firstName},\n\nYou've been invited to ${eventTitle}${formattedDate ? ` on ${formattedDate}` : ''}.\n\nRSVP here: ${rsvpUrl}\n\n— PopEyez Events`,
    html,
  });
}


// ─── RSVP confirmation with QR code ──────────────────────────────────────────
export async function sendRsvpConfirmationWithQR({ to, guestName, eventTitle, eventDate, startTime, venueName, dressCode, qrBuffer, qrCode }) {
  const transporter = getTransporter();
  const firstName = (guestName || 'Guest').split(' ')[0];

  const formattedDate = eventDate
    ? new Date(eventDate).toLocaleDateString('en-GB', {
        weekday: 'long', day: 'numeric', month: 'long', year: 'numeric',
      })
    : null;

  const detailsRows = [
    formattedDate ? detailRow('#3ecfb8', 'Date &amp; Time', `${formattedDate}${startTime ? ` at ${startTime}` : ''}`) : '',
    venueName && venueName !== 'TBD' ? detailRow('#8b6dff', 'Venue', venueName) : '',
    dressCode ? detailRow('#c084fc', 'Dress Code', dressCode) : '',
  ].filter(Boolean).join('');

  const bodyHtml = `
    <div style="text-align:center;margin-bottom:24px;">
      <!-- Check badge -->
      <div style="display:inline-block;width:56px;height:56px;border-radius:50%;
                  background:rgba(62,207,184,0.12);border:2px solid rgba(62,207,184,0.4);
                  line-height:56px;text-align:center;margin-bottom:16px;">
        <span style="font-size:26px;line-height:56px;">✓</span>
      </div>
      <h1 style="margin:0 0 6px;font-size:26px;font-weight:900;color:#ede9ff;letter-spacing:-0.03em;">You're going!</h1>
      <p style="margin:0 0 4px;font-size:16px;font-weight:700;color:#ede9ff;">${eventTitle}</p>
      ${formattedDate ? `<p style="margin:0;font-size:13px;color:rgba(237,233,255,0.45);">${formattedDate}${startTime ? ` · ${startTime}` : ''}</p>` : ''}
    </div>

    ${detailsRows ? `
    <div style="background:#0f0f19;border-radius:12px;padding:16px 20px;margin-bottom:24px;">
      <table role="presentation" width="100%" cellpadding="0" cellspacing="0">
        ${detailsRows}
      </table>
    </div>` : ''}

    <!-- QR code card -->
    <div style="background:#0f0f19;border:1px solid rgba(255,255,255,0.08);border-radius:14px;
                padding:28px 24px;text-align:center;margin-bottom:24px;">
      <p style="margin:0 0 16px;font-size:13px;font-weight:700;color:rgba(237,233,255,0.6);
                text-transform:uppercase;letter-spacing:0.08em;">Your Check-in QR Code</p>
      <img src="cid:qrcode_checkin" alt="QR Code"
           style="width:200px;height:200px;display:block;margin:0 auto;border-radius:10px;
                  background:#fff;padding:8px;box-sizing:border-box;"/>
      <p style="margin:16px 0 6px;font-size:13px;color:rgba(237,233,255,0.52);line-height:1.5;">
        Show this at the entrance for <strong style="color:#ede9ff;">instant check-in</strong>.
      </p>
      <p style="margin:0;font-size:11px;color:rgba(237,233,255,0.28);font-family:monospace;letter-spacing:0.06em;">${qrCode}</p>
    </div>

    <p style="margin:0;text-align:center;font-size:13px;color:rgba(237,233,255,0.35);">
      Save this email — you'll need it on event day!
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;font-size:12px;color:rgba(237,233,255,0.35);">
      You confirmed your attendance at <strong style="color:rgba(237,233,255,0.6);">${eventTitle}</strong>.
    </p>
  `;

  const html = emailShell({ subtitle: "You're confirmed!", bodyHtml, footerHtml });

  await transporter.sendMail({
    from: `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: `You're confirmed for ${eventTitle} — your QR code inside`,
    text: `Hi ${firstName},\n\nYou're confirmed for ${eventTitle}!\n\nShow your check-in code at the entrance: ${qrCode}\n\n— PopEyez Events`,
    html,
    attachments: [
      {
        filename: 'qrcode.png',
        content: qrBuffer,
        cid: 'qrcode_checkin',
      },
    ],
  });
}


// ─── Staff account welcome ────────────────────────────────────────────────────
export async function sendStaffWelcomeEmail({ to, fullname, email, password, loginUrl }) {
  const transporter = getTransporter();
  const firstName = (fullname || 'Staff member').split(' ')[0];

  const credentialsHtml = [
    credentialField('Login URL', loginUrl, { accent: '#8b6dff', href: loginUrl }),
    credentialField('Email / Username', email, { accent: '#3ecfb8', monospace: true }),
    credentialField('Temporary Password', password, { accent: '#c084fc', monospace: true }),
  ].join('');

  const bodyHtml = `
    <p style="margin:0 0 6px;font-size:14px;color:rgba(237,233,255,0.5);">Hi ${firstName},</p>
    <h1 style="margin:0 0 16px;font-size:28px;font-weight:900;color:#ede9ff;letter-spacing:-0.03em;line-height:1.2;">
      Your staff account is ready
    </h1>
    <p style="margin:0 0 24px;font-size:14px;color:rgba(237,233,255,0.52);line-height:1.7;">
      An event organizer created a PopEyez staff account for you. Use the credentials below to sign in.
    </p>

    <div style="margin-bottom:24px;">
      <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:rgba(237,233,255,0.35);
                text-transform:uppercase;letter-spacing:0.08em;">Your login credentials</p>
      ${glassPanel(credentialsHtml)}
    </div>

    <!-- Security notice -->
    <div style="background:rgba(245,166,35,0.08);border:1px solid rgba(245,166,35,0.22);
                border-radius:10px;padding:14px 16px;margin-bottom:24px;">
      <p style="margin:0;font-size:13px;color:rgba(237,233,255,0.65);line-height:1.6;">
        <strong style="color:#f5a623;">Keep this email private</strong> — it contains your temporary password.
        Change your password after your first sign-in.
      </p>
    </div>

    <p style="margin:0 0 12px;font-size:12px;font-weight:700;color:rgba(237,233,255,0.35);
              text-transform:uppercase;letter-spacing:0.08em;">How to log in</p>
    <div style="background:#0f0f19;border-radius:12px;padding:16px 20px;margin-bottom:28px;">
      <ol style="margin:0;padding-left:20px;font-size:14px;color:rgba(237,233,255,0.65);line-height:1.9;">
        <li style="margin-bottom:4px;">Open the login page using the link above.</li>
        <li style="margin-bottom:4px;">Enter your email address and the temporary password.</li>
        <li>After signing in, change your password from your profile if prompted.</li>
      </ol>
    </div>

    <div style="text-align:center;">
      ${ctaBtn(loginUrl, 'Go to Login →')}
    </div>
    <p style="margin:16px 0 0;font-size:11px;color:rgba(237,233,255,0.28);text-align:center;word-break:break-all;">
      <a href="${loginUrl}" style="color:rgba(139,109,255,0.7);text-decoration:none;">${loginUrl}</a>
    </p>
  `;

  const footerHtml = `
    <p style="margin:0;font-size:12px;color:rgba(237,233,255,0.35);">
      Keep this email secure — it contains your login password.
    </p>
  `;

  const html = emailShell({
    subtitle: 'Staff Account',
    bodyHtml,
    footerHtml,
    footerNote: 'You received this because a staff account was created for you · powered by the opal platform',
  });

  await transporter.sendMail({
    from:    `"PopEyez Events" <${process.env.SMTP_USER}>`,
    to,
    subject: 'Your PopEyez staff account login details',
    text:    `Hi ${firstName},\n\nYour staff account has been created.\n\nLogin URL: ${loginUrl}\nEmail: ${email}\nTemporary password: ${password}\n\nSign in with your email and password, then update your password from your profile if needed.\n\n— PopEyez Events`,
    html,
  });
}


// ─── SMTP health check ────────────────────────────────────────────────────────
export function isEmailConfigured() {
  return Boolean(process.env.SMTP_USER && process.env.SMTP_PASS);
}
