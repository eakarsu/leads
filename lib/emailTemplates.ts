const baseStyles = `
  body { font-family: Arial, sans-serif; background: #f5f5f5; margin: 0; padding: 20px; }
  .container { max-width: 600px; margin: 0 auto; background: #fff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 4px rgba(0,0,0,0.1); }
  .header { background: #1976d2; color: #fff; padding: 24px; text-align: center; }
  .content { padding: 32px 24px; }
  .btn { display: inline-block; padding: 12px 32px; background: #1976d2; color: #fff; text-decoration: none; border-radius: 6px; font-weight: bold; }
  .footer { padding: 16px 24px; text-align: center; color: #999; font-size: 12px; border-top: 1px solid #eee; }
`;

export function passwordResetEmail(resetUrl: string, userName: string): string {
  return `
    <!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
    <div class="container">
      <div class="header"><h1>Password Reset</h1></div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>We received a request to reset your password. Click the button below to create a new password:</p>
        <p style="text-align:center;margin:32px 0"><a href="${resetUrl}" class="btn">Reset Password</a></p>
        <p>This link will expire in 1 hour. If you didn't request this, you can safely ignore this email.</p>
      </div>
      <div class="footer">LeadGenFlow AI - AI-Powered Lead Generation Platform</div>
    </div>
    </body></html>
  `;
}

export function emailVerificationEmail(verifyUrl: string, userName: string): string {
  return `
    <!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
    <div class="container">
      <div class="header"><h1>Verify Your Email</h1></div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>Welcome to LeadGenFlow AI! Please verify your email address by clicking the button below:</p>
        <p style="text-align:center;margin:32px 0"><a href="${verifyUrl}" class="btn">Verify Email</a></p>
        <p>This link will expire in 24 hours.</p>
      </div>
      <div class="footer">LeadGenFlow AI - AI-Powered Lead Generation Platform</div>
    </div>
    </body></html>
  `;
}

export function passwordChangedEmail(userName: string): string {
  return `
    <!DOCTYPE html><html><head><style>${baseStyles}</style></head><body>
    <div class="container">
      <div class="header"><h1>Password Changed</h1></div>
      <div class="content">
        <p>Hi ${userName},</p>
        <p>Your password has been successfully changed. If you did not make this change, please contact support immediately.</p>
      </div>
      <div class="footer">LeadGenFlow AI - AI-Powered Lead Generation Platform</div>
    </div>
    </body></html>
  `;
}
