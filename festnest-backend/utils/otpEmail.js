'use strict';

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOTPEmail = async (email, otp) => {
  console.log("\n[SendOTPEmail] 🚀 Sending OTP via SendGrid");

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Verify your email - FestNest',
    html: `
      <div style="font-family: Arial; padding: 20px;">
        <h2>FestNest Verification Code</h2>
        <p>Hello,</p>
        <p>Your OTP code is:</p>
        <h1 style="letter-spacing: 6px;">${otp}</h1>
        <p>This code is valid for 5 minutes.</p>
        <p>If you didn't request this, ignore this email.</p>
      </div>
    `,
  };

  try {
    const response = await sgMail.send(msg);

    console.log("[SendOTPEmail] ✅ EMAIL SENT");
    console.log("[SendOTPEmail] Status:", response[0].statusCode);

    return response;
  } catch (error) {
    console.error("[SendOTPEmail] ❌ SENDGRID ERROR:", error.message);
    if (error.response) {
      console.error(error.response.body);
    }
    throw error;
  }
};