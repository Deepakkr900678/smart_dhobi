const nodemailer = require("nodemailer");

/* =========================
   TRANSPORTER CONFIG
========================= */
const transporter = nodemailer.createTransport({
  service: "gmail",
  auth: {
    user: process.env.EMAIL_USERNAME, 
    pass: process.env.EMAIL_PASSWORD, 
  },
});

/* =========================
   GENERIC EMAIL FUNCTION
========================= */
const sendEmail = async ({ to, subject, html }) => {
  try {
    const info = await transporter.sendMail({
      from: `"SmartDhobi" <${process.env.EMAIL_USERNAME}>`,
      to,
      subject,
      html,
    });

    console.log("📧 Email sent:", info.messageId);
  } catch (err) {
    console.error("❌ sendEmail error:", err.message);
    throw err;
  }
};

/* =========================
   OTP EMAIL TEMPLATE
========================= */
const getOtpTemplate = (otp) => {
  return `
  <div style="font-family: Arial, sans-serif; background-color:#f4f6f8; padding:20px;">
    
    <div style="max-width:500px; margin:auto; background:#ffffff; border-radius:10px; padding:30px; text-align:center; box-shadow:0 2px 10px rgba(0,0,0,0.05);">
      
      <h2 style="color:#2c3e50; margin-bottom:10px;">
        SmartDhobi
      </h2>

      <p style="color:#555; font-size:16px;">
        Use the OTP below to continue your request:
      </p>

      <div style="font-size:32px; font-weight:bold; letter-spacing:6px; color:#1abc9c; margin:25px 0;">
        ${otp}
      </div>

      <p style="color:#777; font-size:14px;">
        This OTP is valid for <b>5 minutes</b>.
      </p>

      <p style="color:#999; font-size:12px; margin-top:25px;">
        If you didn’t request this, you can safely ignore this email.
      </p>

      <hr style="margin:30px 0;" />

      <p style="font-size:12px; color:#bbb;">
        © ${new Date().getFullYear()} SmartDhobi. All rights reserved.
      </p>

    </div>
  </div>
  `;
};

/* =========================
   SEND OTP EMAIL
========================= */
const sendOtpEmail = async (email, otp) => {
  return await sendEmail({
    to: email,
    subject: "Your SmartDhobi OTP Code",
    html: getOtpTemplate(otp),
  });
};

/* =========================
   EXPORTS
========================= */
module.exports = {
  sendEmail,
  sendOtpEmail,
};