const { Resend } = require('resend');

const apiKey = process.env.RESEND_API_KEY;
let client = null;

if (apiKey) {
  client = new Resend(apiKey);
}

const FROM = process.env.RESEND_FROM || 'onboarding@resend.dev';
const CEO_EMAIL = process.env.CEO_NOTIFY_EMAIL || process.env.CEO_EMAIL || '';

function esc(s) {
  return String(s == null ? '' : s)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

// 1. Send Alert to CEO
async function sendProspectAlert(prospect) {
  if (!client) {
    console.warn('[mail] Resend not configured — skipping alert');
    return;
  }
  if (!CEO_EMAIL) return;

  const isStudent = prospect.prospectType === 'student';
  const si = prospect.studentInfo || {};
  const days = Array.isArray(si.daysAvailable) ? si.daysAvailable.join(', ') : '';

  const rows = [
    ['Name', prospect.fullName],
    ['Email', prospect.email],
    ['WhatsApp', prospect.whatsapp || '—'],
    ['Source', prospect.source || 'direct'],
    ['Category', prospect.leadCategory],
    ['Type', isStudent ? 'Student' : 'General']
  ];
  if (isStudent) {
    rows.push(['School', si.school || '—']);
    if (si.course) rows.push(['Course', si.course]);
    if (days) rows.push(['Days available', days]);
  } else {
    rows.push(['Looking for', (prospect.lookingFor || '—').replace('_', ' ')]);
  }

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;padding:24px">
      <h2 style="margin:0 0 8px;color:#0b1b3b">New ${isStudent ? 'Student' : 'Prospect'}: ${esc(prospect.fullName)}</h2>
      <table cellspacing="0" cellpadding="6" style="border-collapse:collapse;font-size:14px;width:100%">
        ${rows.map(([k, v]) => `
          <tr>
            <td style="border-bottom:1px solid #e6e9f2;color:#6c757d;width:120px">${esc(k)}</td>
            <td style="border-bottom:1px solid #e6e9f2">${esc(v)}</td>
          </tr>
        `).join('')}
      </table>
      <div style="margin-top:24px">
        <a href="https://brianceotnt.devs.li/admin/prospects/${prospect._id}"
           style="background:#0d6efd;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">
          Open in Admin Dashboard
        </a>
      </div>
    </div>
  `;

  try {
    await client.emails.send({
      from: FROM,
      to: CEO_EMAIL,
      subject: `New ${isStudent ? 'Student' : 'Prospect'}: ${prospect.fullName} (${prospect.leadCategory})`,
      html
    });
    console.log('[mail] Alert sent to CEO');
  } catch (err) {
    console.error('[mail] Alert failed:', err.message);
  }
}

// 2. Send Welcome Email to Prospect
async function sendProspectWelcome(prospect) {
  if (!client) return;

  const firstName = (prospect.fullName || '').split(' ')[0] || 'there';
  const isStudent = prospect.prospectType === 'student';

  const html = `
    <div style="font-family:Inter,Arial,sans-serif;max-width:560px;padding:24px">
      <h2 style="margin:0 0 12px;color:#0b1b3b">Hi ${esc(firstName)},</h2>
      <p style="color:#333;line-height:1.55">
        This is Brian from <strong>BRIAN — CEO TNT</strong>. Thank you for reaching out
        ${isStudent ? 'about the student program' : 'about the business opportunity'}.
      </p>
      <p style="color:#333;line-height:1.55">
        I personally review every message, so expect a reply from me on WhatsApp soon.
        If you haven't already, you can also book a 15-minute Zoom call with me directly to fast-track the process.
      </p>
      <div style="margin-top:20px;margin-bottom:20px">
        <a href="https://brianceotnt.devs.li/thank-you"
           style="background:#0d6efd;color:#fff;text-decoration:none;padding:10px 18px;border-radius:8px;font-weight:600">
          Book a Call
        </a>
      </div>
      <p style="color:#6c757d;font-size:13px;margin-top:24px">
        — Brian (CEO TNT)
      </p>
    </div>
  `;

  try {
    await client.emails.send({
      from: FROM,
      to: prospect.email,
      subject: `Thanks for reaching out — Brian (CEO TNT)`,
      html
    });
    console.log('[mail] Welcome sent to', prospect.email);
  } catch (err) {
    console.warn('[mail] Welcome failed:', err.message);
  }
}

module.exports = { sendProspectAlert, sendProspectWelcome };
