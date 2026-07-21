import { Resend } from 'resend';

function configuredEmailClient() {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) throw new Error('RESEND_API_KEY is required to send email');
  return new Resend(apiKey);
}

function configuredSender(override?: string) {
  const sender = override?.trim() || process.env.EMAIL_FROM?.trim();
  if (!sender) throw new Error('EMAIL_FROM is required to send email');
  return sender;
}

export interface SendEmailParams {
  to: string | string[];
  subject: string;
  html: string;
  from?: string;
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
  }>;
}

export async function sendEmail(params: SendEmailParams) {
  try {
    const resend = configuredEmailClient();
    const { data, error } = await resend.emails.send({
      from: configuredSender(params.from),
      to: Array.isArray(params.to) ? params.to : [params.to],
      subject: params.subject,
      html: params.html,
      cc: params.cc ? (Array.isArray(params.cc) ? params.cc : [params.cc]) : undefined,
      bcc: params.bcc ? (Array.isArray(params.bcc) ? params.bcc : [params.bcc]) : undefined,
      replyTo: params.replyTo,
      attachments: params.attachments,
    });

    if (error) {
      console.error('Error sending email:', error);
      return { success: false, error: error.message };
    }

    return { success: true, data };
  } catch (error: unknown) {
    console.error('Error sending email:', error);
    return { success: false, error: error instanceof Error ? error.message : 'Email delivery failed' };
  }
}

export async function sendEmailFromTemplate(
  templateHtml: string,
  variables: Record<string, string>,
  params: Omit<SendEmailParams, 'html'>
) {
  let html = templateHtml;

  // Replace template variables
  Object.entries(variables).forEach(([key, value]) => {
    const regex = new RegExp(`{{${key}}}`, 'g');
    html = html.replace(regex, value);
  });

  return sendEmail({ ...params, html });
}
