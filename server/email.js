const nodemailer = require('nodemailer');

const SMTP_HOST = process.env.SMTP_HOST || 'smtp.gmail.com';
const SMTP_PORT = parseInt(process.env.SMTP_PORT || '587');
const SMTP_USER = process.env.SMTP_USER; // Your Gmail / SMTP email
const SMTP_PASS = process.env.SMTP_PASS; // Your Gmail App Password / SMTP password

let transporter = null;

if (SMTP_USER && SMTP_PASS) {
  const isGmail = SMTP_USER.toLowerCase().endsWith('@gmail.com') || SMTP_HOST.includes('gmail.com');
  
  const transportConfig = isGmail 
    ? {
        service: 'gmail',
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        }
      }
    : {
        host: SMTP_HOST,
        port: SMTP_PORT,
        secure: SMTP_PORT === 465, // true for 465, false for 587
        auth: {
          user: SMTP_USER,
          pass: SMTP_PASS
        },
        tls: {
          rejectUnauthorized: false // bypass SSL validation issues
        }
      };

  transporter = nodemailer.createTransport(transportConfig);
}

const sendVerificationEmail = async (toEmail, code) => {
  if (!transporter) {
    console.log(`\n======================================================`);
    console.log(`[SMTP CONFIGURATION MISSING]`);
    console.log(`To send real emails to ${toEmail}, set these Environment Variables:`);
    console.log(`SMTP_USER=your_email@gmail.com`);
    console.log(`SMTP_PASS=your_app_password`);
    console.log(`OTP Code generated: ${code}`);
    console.log(`======================================================\n`);
    return false;
  }

  const mailOptions = {
    from: `"Pulse Workspace" <${SMTP_USER}>`,
    to: toEmail,
    subject: `${code} is your Pulse Verification Code`,
    html: `
      <div style="background-color: #0f111a; padding: 40px 20px; font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; color: #ffffff; text-align: center;">
        <div style="max-width: 500px; margin: 0 auto; background: rgba(30, 41, 59, 0.4); border: 1px solid rgba(255, 255, 255, 0.08); border-radius: 16px; padding: 32px; box-shadow: 0 20px 40px rgba(0, 0, 0, 0.3);">
          
          <!-- Logo Header -->
          <div style="margin-bottom: 24px;">
            <span style="font-size: 24px; font-weight: 800; letter-spacing: 2px; background: linear-gradient(135deg, #6366f1 0%, #a855f7 100%); -webkit-background-clip: text; -webkit-text-fill-color: transparent; color: #6366f1;">PULSE</span>
          </div>
          
          <h2 style="font-size: 22px; font-weight: 700; margin-bottom: 12px; color: #ffffff;">Verify Your Account</h2>
          <p style="font-size: 14px; color: #94a3b8; line-height: 1.6; margin-bottom: 24px;">
            Thank you for registering on Pulse. Enter the 6-digit verification code below to activate your account.
          </p>
          
          <!-- OTP Display Card -->
          <div style="background: linear-gradient(135deg, rgba(99, 102, 241, 0.1) 0%, rgba(168, 85, 247, 0.1) 100%); border: 1px solid rgba(99, 102, 241, 0.2); border-radius: 12px; padding: 16px 24px; display: inline-block; margin-bottom: 24px;">
            <span style="font-size: 32px; font-weight: 800; letter-spacing: 6px; color: #a855f7; font-family: monospace;">${code}</span>
          </div>
          
          <p style="font-size: 12px; color: #64748b; line-height: 1.5;">
            This verification code is valid for 15 minutes. If you did not request this, please ignore this email.
          </p>
          
          <hr style="border: 0; border-top: 1px solid rgba(255, 255, 255, 0.08); margin: 32px 0 16px 0;" />
          
          <p style="font-size: 11px; color: #475569;">
            Pulse, Next-Generation Team Collaboration Workspace.
          </p>
        </div>
      </div>
    `
  };

  try {
    const info = await transporter.sendMail(mailOptions);
    console.log(`Verification email sent to ${toEmail} successfully: ${info.messageId}`);
    return true;
  } catch (error) {
    console.error(`Error sending email to ${toEmail}:`, error);
    return false;
  }
};

module.exports = { sendVerificationEmail };
