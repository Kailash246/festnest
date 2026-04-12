'use strict';

const sgMail = require('@sendgrid/mail');

sgMail.setApiKey(process.env.SENDGRID_API_KEY);

exports.sendOTPEmail = async (email, otp) => {
  console.log("\n[SendOTPEmail] 🚀 Sending OTP via SendGrid");

  const msg = {
    to: email,
    from: process.env.EMAIL_FROM,
    subject: 'Verify your email - FestNest',
    html: `<h2>Your OTP is: ${otp}</h2>`,
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