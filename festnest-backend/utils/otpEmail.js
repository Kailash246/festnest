/* ============================================================
   FESTNEST — utils/otpEmail.js
   OTP Email Template
   - Sends beautiful OTP email using existing email service
   ============================================================ */

'use strict';

const nodemailer = require('nodemailer');

/* ── Reuse email config from environment ── */
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

/**
 * Send OTP email
 * @param {string} email - Recipient email
 */
exports.sendOTPEmail = async (email) => {
  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    console.warn('⚠️  Email not configured — OTP email skipped.');
    return;
  }

  try {
    const transporter = createTransporter();

    /* ── Generate fresh OTP for display ── */
    const otp = Math.floor(100000 + Math.random() * 900000).toString();

    const htmlContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; margin: 0; padding: 0; }
          .container { max-width: 600px; margin: 0 auto; padding: 20px; background: #f8f9fa; }
          .card { background: white; border-radius: 16px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1); }
          .header { background: linear-gradient(135deg, #2F80ED, #7B2FF7); padding: 40px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 28px; }
          .header p { margin: 8px 0 0; opacity: 0.85; font-size: 14px; }
          .content { padding: 40px 20px; }
          .content h2 { color: #1a1a1a; margin: 0 0 16px; font-size: 22px; }
          .content p { color: #666; line-height: 1.6; margin: 0 0 20px; }
          .otp-box { 
            background: linear-gradient(135deg, #2F80ED, #7B2FF7);
            border-radius: 12px;
            padding: 30px;
            text-align: center;
            margin: 30px 0;
          }
          .otp-code { 
            font-size: 48px;
            font-weight: 700;
            color: white;
            letter-spacing: 8px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
          }
          .otp-info {
            color: rgba(255,255,255,0.9);
            font-size: 14px;
            margin-top: 15px;
          }
          .warning {
            background: #FFF3CD;
            border-left: 4px solid #FFC107;
            padding: 15px;
            border-radius: 8px;
            margin: 20px 0;
            color: #856404;
            font-size: 13px;
          }
          .footer {
            border-top: 1px solid #eee;
            padding: 20px;
            text-align: center;
            color: #999;
            font-size: 12px;
          }
          .footer a { color: #5A4BFF; text-decoration: none; }
        </style>
      </head>
      <body>
        <div class="container">
          <div class="card">
            <div class="header">
              <h1>🪺 FestNest</h1>
              <p>Verify Your Email</p>
            </div>
            <div class="content">
              <h2>Your OTP Code</h2>
              <p>Welcome to FestNest! Here's your one-time password to verify your email:</p>
              
              <div class="otp-box">
                <div class="otp-code">${otp}</div>
                <div class="otp-info">
                  ⏱️ Valid for 5 minutes
                </div>
              </div>

              <p>This OTP will expire in <strong>5 minutes</strong>. Do not share it with anyone.</p>

              <div class="warning">
                <strong>⚠️ Security Notice:</strong> Never share your OTP with anyone. FestNest staff will never ask for your OTP via email, call, or message.
              </div>

              <p style="margin-bottom: 0;">
                If you didn't request this OTP, please ignore this email or contact our support team.
              </p>
            </div>
            <div class="footer">
              <p>FestNest Technologies Pvt. Ltd. · Made with ❤️ for students</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'https://festnest.in'}">FestNest</a> | 
                <a href="${process.env.FRONTEND_URL || 'https://festnest.in'}/pages/privacy.html">Privacy Policy</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FestNest <noreply@festnest.in>',
      to: email,
      subject: '🔐 Your FestNest Verification Code',
      html: htmlContent,
      text: `Your FestNest verification code is: ${otp}. This code will expire in 5 minutes.`,
    });

    console.log(`📧 OTP email sent to ${email}: ${info.messageId}`);
    return info;
  } catch (error) {
    console.error('❌ OTP email error:', error.message);
    throw error;
  }
};

/**
 * Send OTP error notification (admin only - for debugging)
 */
exports.sendOTPErrorNotification = async (email, error) => {
  if (process.env.NODE_ENV !== 'development') {
    return;
  }

  if (!process.env.EMAIL_USER || !process.env.EMAIL_PASS) {
    return;
  }

  try {
    const transporter = createTransporter();
    await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FestNest <noreply@festnest.in>',
      to: process.env.ADMIN_EMAIL || 'admin@festnest.in',
      subject: '[FestNest] OTP System Error',
      html: `
        <p>OTP verification error for email: <strong>${email}</strong></p>
        <p>Error: ${error.message}</p>
        <p>Time: ${new Date().toISOString()}</p>
      `,
    });
  } catch (err) {
    console.error('Failed to send error notification:', err.message);
  }
};
