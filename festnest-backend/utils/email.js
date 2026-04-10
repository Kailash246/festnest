/* ============================================================
   FESTNEST — utils/email.js
   Email notifications using Nodemailer + Gmail (free)
   ============================================================ */

'use strict';

const nodemailer = require('nodemailer');

/* ── Create reusable transporter ── */
const createTransporter = () => {
  return nodemailer.createTransport({
    host:   process.env.EMAIL_HOST || 'smtp.gmail.com',
    port:   parseInt(process.env.EMAIL_PORT) || 587,
    secure: false,  /* TLS */
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
  });
};

/* ── Base email sender ── */
const sendEmail = async ({ to, subject, html, text }) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — skipping email send.');
    return;
  }

  const transporter = createTransporter();
  const info = await transporter.sendMail({
    from:    process.env.EMAIL_FROM || 'FestNest <noreply@festnest.in>',
    to,
    subject,
    html,
    text: text || subject,
  });

  console.log(`📧 Email sent to ${to}: ${info.messageId}`);
  return info;
};

/* ════════════════════════════════════════
   EMAIL TEMPLATES
   ════════════════════════════════════════ */

/* ── Welcome email after registration ── */
exports.sendWelcomeEmail = async (user) => {
  await sendEmail({
    to:      user.email,
    subject: '🪺 Welcome to FestNest — Gather, Connect, Compete & Win!',
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);padding:32px;border-radius:16px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:28px;">🪺 FestNest</h1>
          <p style="color:rgba(255,255,255,0.85);margin:8px 0 0;">Gather, Connect, Compete & Win</p>
        </div>
        <h2 style="color:#1A1A1A;">Hey ${user.firstName}! 👋</h2>
        <p style="color:#666;line-height:1.7;">Welcome to FestNest — India's #1 campus event discovery platform!</p>
        <p style="color:#666;line-height:1.7;">You now have access to <strong>2,400+ campus events</strong> from 850+ colleges across India.</p>
        <div style="background:#F3E8FF;border-radius:12px;padding:20px;margin:20px 0;">
          <h3 style="margin:0 0 12px;color:#5A4BFF;">🚀 What you can do now:</h3>
          <ul style="color:#666;line-height:1.8;margin:0;padding-left:20px;">
            <li>Browse hackathons, cultural fests, and sports events</li>
            <li>Save events you're interested in</li>
            <li>Register directly from each event page</li>
            <li>${user.role === 'organizer' ? 'Post your college events and reach 48k+ students' : 'Track your registrations and wins'}</li>
          </ul>
        </div>
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL}" style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block;">
            Explore Events →
          </a>
        </div>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">
          FestNest · Made with ❤️ for students<br>
          <a href="${process.env.FRONTEND_URL}" style="color:#5A4BFF;">festnest.in</a>
        </p>
      </div>`,
  });
};

/* ── Event submitted confirmation ── */
exports.sendEventSubmittedEmail = async (user, event) => {
  await sendEmail({
    to:      user.email,
    subject: `✅ Event Received: "${event.title}" is under review`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);padding:28px;border-radius:16px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🪺 FestNest</h1>
        </div>
        <h2 style="color:#1A1A1A;">Event Submitted! 🎉</h2>
        <p style="color:#666;line-height:1.7;">Hi ${user.firstName}, your event has been received and is now under review by our team.</p>
        <div style="background:#E8F5E9;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #00BFA5;">
          <h3 style="margin:0 0 8px;color:#1A1A1A;">${event.title}</h3>
          <p style="margin:0;color:#666;font-size:14px;">
            📅 ${new Date(event.startDate).toLocaleDateString('en-IN', { day:'numeric',month:'long',year:'numeric' })}&nbsp;&nbsp;
            📍 ${event.college}&nbsp;&nbsp;
            🏆 ${event.prizes.pool || 'TBD'}
          </p>
        </div>
        <p style="color:#666;line-height:1.7;"><strong>What happens next?</strong></p>
        <ol style="color:#666;line-height:1.8;">
          <li>Our team reviews your event details (within 24 hours)</li>
          <li>We may contact you if any details need clarification</li>
          <li>Once approved, your event goes live instantly on FestNest</li>
          <li>You'll receive a confirmation email when it's live</li>
        </ol>
        <p style="color:#666;font-size:13px;">Need help? Email us at <a href="mailto:support@festnest.in" style="color:#5A4BFF;">support@festnest.in</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">FestNest</p>
      </div>`,
  });
};

/* ── Event approved notification ── */
exports.sendEventApprovedEmail = async (user, event) => {
  await sendEmail({
    to:      user.email,
    subject: `🎉 Your event is LIVE! "${event.title}" is now on FestNest`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);padding:28px;border-radius:16px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🪺 FestNest</h1>
        </div>
        <h2 style="color:#1A1A1A;">Your Event is Live! 🚀</h2>
        <p style="color:#666;line-height:1.7;">Congratulations! <strong>${event.title}</strong> has been approved and is now live on FestNest, reaching 48,000+ students!</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL}/pages/event-detail.html?id=${event._id}" style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block;">
            View Your Event →
          </a>
        </div>
        <p style="color:#666;font-size:13px;text-align:center;">Share this link with your students to boost registrations!</p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">FestNest</p>
      </div>`,
  });
};

/* ── Event rejected notification ── */
exports.sendEventRejectedEmail = async (user, event, reason) => {
  await sendEmail({
    to:      user.email,
    subject: `ℹ️ Event Update: "${event.title}" needs revision`,
    html: `
      <div style="font-family:sans-serif;max-width:600px;margin:0 auto;padding:20px;">
        <div style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);padding:28px;border-radius:16px;text-align:center;margin-bottom:24px;">
          <h1 style="color:#fff;margin:0;font-size:24px;">🪺 FestNest</h1>
        </div>
        <h2 style="color:#1A1A1A;">Event Needs Revision</h2>
        <p style="color:#666;line-height:1.7;">Hi ${user.firstName}, we reviewed <strong>${event.title}</strong> and couldn't approve it at this time.</p>
        <div style="background:#FFF3E0;border-radius:12px;padding:20px;margin:20px 0;border-left:4px solid #FF8A00;">
          <h3 style="margin:0 0 8px;color:#1A1A1A;">Reason:</h3>
          <p style="margin:0;color:#666;">${reason}</p>
        </div>
        <p style="color:#666;line-height:1.7;">Please update your event details and resubmit. Our team will review it again within 24 hours.</p>
        <div style="text-align:center;margin:28px 0;">
          <a href="${process.env.FRONTEND_URL}/pages/post-event.html" style="background:linear-gradient(135deg,#2F80ED,#7B2FF7);color:#fff;padding:14px 32px;border-radius:12px;text-decoration:none;font-weight:700;display:inline-block;">
            Resubmit Event →
          </a>
        </div>
        <p style="color:#666;font-size:13px;">Questions? Email <a href="mailto:support@festnest.in" style="color:#5A4BFF;">support@festnest.in</a></p>
        <hr style="border:none;border-top:1px solid #eee;margin:24px 0;">
        <p style="color:#999;font-size:12px;text-align:center;">FestNest</p>
      </div>`,
  });
};
