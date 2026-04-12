/* ============================================================
   FESTNEST — utils/otpEmail.js
   OTP Email Template
   - Sends beautiful OTP email using existing email service
   ============================================================ */

'use strict';

const nodemailer = require('nodemailer');

/* ── Zoho SMTP Configuration ── */
const createTransporter = () => {
  const required = ['EMAIL_HOST', 'EMAIL_PORT', 'EMAIL_USER', 'EMAIL_PASS'];
  const missing = required.filter(key => !process.env[key]);
  
  if (missing.length > 0) {
    const err = `Missing SMTP config: ${missing.join(', ')}`;
    console.error(`[EmailTransport] ❌ ${err}`);
    throw new Error(err);
  }

  const port = parseInt(process.env.EMAIL_PORT);
  // Zoho: 465 = SSL, 587 = TLS
  const secure = port === 465;
  
  const config = {
    host:   process.env.EMAIL_HOST,
    port:   port,
    secure: secure,
    auth: {
      user: process.env.EMAIL_USER,
      pass: process.env.EMAIL_PASS,
    },
    connectionTimeout: 10000,
    greetingTimeout: 10000,
    socketTimeout: 10000,
    tls: {
      rejectUnauthorized: false,
    },
  };
  
  console.log(`[EmailTransport] ✅ SMTP Ready: ${config.host}:${config.port} (secure=${config.secure})`);
  return nodemailer.createTransport(config);
};

/**
 * Send OTP email with production-safe error handling
 */
exports.sendOTPEmail = async (email, otp) => {
  console.log(`\n[SendOTPEmail] ═══════════════════════════════════`);
  console.log(`[SendOTPEmail] 📧 Starting OTP email send`);
  console.log(`[SendOTPEmail] Recipient: ${email}`);
  console.log(`[SendOTPEmail] OTP Code: ${otp}`);

  try {
    console.log(`[SendOTPEmail] 🔧 Creating transporter...`);
    const transporter = createTransporter();
    console.log(`[SendOTPEmail] ✅ Transporter created`);

    const htmlContent = `
      <!DOCTYPE html>
      <html lang="en">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background: #f5f5f5; margin: 0; padding: 0; color: #333; }
          .wrapper { max-width: 600px; margin: 0 auto; padding: 20px; }
          .card { background: white; border-radius: 8px; overflow: hidden; box-shadow: 0 1px 3px rgba(0,0,0,0.1); }
          .header { background: #2F80ED; padding: 30px 20px; text-align: center; color: white; }
          .header h1 { margin: 0; font-size: 24px; font-weight: 600; letter-spacing: -0.5px; }
          .header p { margin: 8px 0 0; font-size: 13px; opacity: 0.95; }
          .body { padding: 40px 30px; }
          .body h2 { color: #222; margin: 0 0 15px; font-size: 18px; font-weight: 600; }
          .body p { color: #555; line-height: 1.6; margin: 0 0 20px; font-size: 14px; }
          .otp-section { text-align: center; margin: 35px 0; }
          .otp-label { color: #888; font-size: 12px; text-transform: uppercase; letter-spacing: 0.5px; margin-bottom: 12px; font-weight: 600; }
          .otp-code { 
            background: #f9f9f9;
            border: 2px solid #e0e0e0;
            border-radius: 8px;
            padding: 20px;
            font-size: 42px;
            font-weight: 700;
            color: #2F80ED;
            letter-spacing: 6px;
            font-family: 'Courier New', monospace;
            margin: 10px 0;
            user-select: all;
          }
          .otp-valid { color: #888; font-size: 12px; margin-top: 12px; }
          .note { background: #f0f6ff; border-left: 3px solid #2F80ED; padding: 15px; margin: 25px 0; border-radius: 4px; font-size: 13px; color: #555; }
          .note strong { color: #2F80ED; }
          .footer { border-top: 1px solid #f0f0f0; padding: 20px 30px; text-align: center; color: #999; font-size: 11px; }
          .footer a { color: #2F80ED; text-decoration: none; }
          .divider { height: 1px; background: #f0f0f0; margin: 0; }
        </style>
      </head>
      <body>
        <div class="wrapper">
          <div class="card">
            <div class="header">
              <h1>FestNest</h1>
              <p>Email Verification</p>
            </div>
            <div class="body">
              <h2>Verify Your Email</h2>
              <p>Thanks for signing up! Use the code below to verify your email address:</p>
              
              <div class="otp-section">
                <div class="otp-label">Your Code</div>
                <div class="otp-code">${otp}</div>
                <div class="otp-valid">Valid for 5 minutes</div>
              </div>

              <p>This is a one-time password. Never share it with anyone, including FestNest support.</p>

              <div class="note">
                <strong>Didn't request this?</strong> If you didn't create this account, you can safely ignore this email.
              </div>
            </div>
            <div class="divider"></div>
            <div class="footer">
              <p>© 2026 FestNest. All rights reserved.</p>
              <p>
                <a href="${process.env.FRONTEND_URL || 'https://festnest.in'}">Website</a> | 
                <a href="mailto:support@festnest.in">Support</a>
              </p>
            </div>
          </div>
        </div>
      </body>
      </html>
    `;

    console.log(`[SendOTPEmail] 🚀 Calling transporter.sendMail()...`);
    console.log(`[SendOTPEmail] Mail options: to="${email}", subject="Verify your email - FestNest"`);
    
    const info = await transporter.sendMail({
      from: process.env.EMAIL_FROM || 'FestNest <noreply@festnest.in>',
      to: email,
      subject: 'Verify your email - FestNest',
      html: htmlContent,
      text: `Your OTP code is: ${otp}\n\nValid for 5 minutes.\n\nDo not share this code with anyone.`,
    });

    console.log(`[SendOTPEmail] ✅✅✅ EMAIL SENT SUCCESSFULLY`);
    console.log(`[SendOTPEmail] Message ID: ${info.messageId}`);
    console.log(`[SendOTPEmail] Response: ${info.response}`);
    return { success: true, messageId: info.messageId };

  } catch (err) {
    console.error(`\n[SendOTPEmail] ❌❌❌ SENDMAIL FAILED`);
    console.error(`[SendOTPEmail] Error Message:`, err.message);
    console.error(`[SendOTPEmail] Error Code:`, err.code);
    console.error(`[SendOTPEmail] Error Command:`, err.command);
    console.error(`[SendOTPEmail] SMTP Response:`, err.response);
    console.error(`[SendOTPEmail] Full Error Object:`, JSON.stringify(err, null, 2));
    throw err;
  }
};
