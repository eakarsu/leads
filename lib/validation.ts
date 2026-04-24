import { z } from 'zod';

// Password schema with strength requirements
export const passwordSchema = z
  .string()
  .min(8, 'Password must be at least 8 characters')
  .regex(/[A-Z]/, 'Password must contain at least one uppercase letter')
  .regex(/[a-z]/, 'Password must contain at least one lowercase letter')
  .regex(/[0-9]/, 'Password must contain at least one number')
  .regex(/[^A-Za-z0-9]/, 'Password must contain at least one special character');

export function getPasswordStrength(password: string): {
  score: number;
  label: string;
  color: 'error' | 'warning' | 'info' | 'success';
  suggestions: string[];
} {
  let score = 0;
  const suggestions: string[] = [];

  if (password.length >= 8) score++;
  else suggestions.push('Use at least 8 characters');

  if (/[A-Z]/.test(password)) score++;
  else suggestions.push('Add an uppercase letter');

  if (/[a-z]/.test(password)) score++;
  else suggestions.push('Add a lowercase letter');

  if (/[0-9]/.test(password)) score++;
  else suggestions.push('Add a number');

  if (/[^A-Za-z0-9]/.test(password)) score++;
  else suggestions.push('Add a special character');

  if (password.length >= 12) score++;

  const labels: Record<number, { label: string; color: 'error' | 'warning' | 'info' | 'success' }> = {
    0: { label: 'Very Weak', color: 'error' },
    1: { label: 'Weak', color: 'error' },
    2: { label: 'Fair', color: 'warning' },
    3: { label: 'Good', color: 'info' },
    4: { label: 'Strong', color: 'success' },
    5: { label: 'Very Strong', color: 'success' },
    6: { label: 'Excellent', color: 'success' },
  };

  const { label, color } = labels[score] || labels[0];
  return { score: Math.min(score, 4), label, color, suggestions };
}

// Entity form schemas
export const leadFormSchema = z.object({
  fullName: z.string().min(1, 'Full name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
  status: z.string().optional(),
  clientId: z.string().optional(),
  campaignId: z.string().optional(),
});

export const clientFormSchema = z.object({
  name: z.string().min(1, 'Company name is required'),
  industry: z.string().min(1, 'Industry is required'),
  contactName: z.string().min(1, 'Contact name is required'),
  contactEmail: z.string().email('Invalid email address'),
  website: z.string().optional(),
  contactPhone: z.string().optional(),
  notes: z.string().optional(),
});

export const campaignFormSchema = z.object({
  name: z.string().min(1, 'Campaign name is required'),
  clientId: z.string().min(1, 'Client is required'),
  channel: z.string().min(1, 'Channel is required'),
  description: z.string().optional(),
  targetPersona: z.string().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const contactFormSchema = z.object({
  firstName: z.string().min(1, 'First name is required'),
  lastName: z.string().min(1, 'Last name is required'),
  email: z.string().email('Invalid email').optional().or(z.literal('')),
  phone: z.string().optional(),
  company: z.string().optional(),
  title: z.string().optional(),
});

export const opportunityFormSchema = z.object({
  name: z.string().min(1, 'Opportunity name is required'),
  amount: z.number().min(0, 'Amount must be positive').optional(),
  stage: z.string().min(1, 'Stage is required'),
  closeDate: z.string().optional(),
  probability: z.number().min(0).max(100).optional(),
});

export const taskFormSchema = z.object({
  title: z.string().min(1, 'Task title is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
  dueDate: z.string().optional(),
});

export const caseFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  priority: z.string().optional(),
});

export const productFormSchema = z.object({
  name: z.string().min(1, 'Product name is required'),
  description: z.string().optional(),
  price: z.number().min(0, 'Price must be positive').optional(),
  category: z.string().optional(),
});

export const quoteFormSchema = z.object({
  name: z.string().min(1, 'Quote name is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  status: z.string().optional(),
  expiryDate: z.string().optional(),
});

export const contractFormSchema = z.object({
  name: z.string().min(1, 'Contract name is required'),
  status: z.string().optional(),
  value: z.number().min(0, 'Value must be positive').optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

export const orderFormSchema = z.object({
  orderNumber: z.string().min(1, 'Order number is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  status: z.string().optional(),
});

export const invoiceFormSchema = z.object({
  invoiceNumber: z.string().min(1, 'Invoice number is required'),
  amount: z.number().min(0, 'Amount must be positive'),
  status: z.string().optional(),
  dueDate: z.string().optional(),
});

// Survey form schema
export const surveyFormSchema = z.object({
  name: z.string().min(1, 'Survey name is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  isAnonymous: z.boolean().optional(),
  allowMultiple: z.boolean().optional(),
  startDate: z.string().optional(),
  endDate: z.string().optional(),
});

// Web form schema
export const webFormSchema = z.object({
  name: z.string().min(1, 'Form name is required'),
  formType: z.string().min(1, 'Form type is required'),
  description: z.string().optional(),
  redirectUrl: z.string().optional(),
  isActive: z.boolean().optional(),
  captchaEnabled: z.boolean().optional(),
});

// Workflow rule schema
export const workflowRuleSchema = z.object({
  name: z.string().min(1, 'Rule name is required'),
  objectType: z.string().min(1, 'Object type is required'),
  triggerType: z.string().min(1, 'Trigger type is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Journey form schema
export const journeyFormSchema = z.object({
  name: z.string().min(1, 'Journey name is required'),
  description: z.string().optional(),
  status: z.string().optional(),
  type: z.string().optional(),
  triggerType: z.string().optional(),
});

// Marketing event schema
export const marketingEventSchema = z.object({
  name: z.string().min(1, 'Event name is required'),
  type: z.string().optional(),
  status: z.string().optional(),
  startDateTime: z.string().min(1, 'Start date is required'),
  endDateTime: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  locationType: z.string().optional(),
  venue: z.string().optional(),
  maxAttendees: z.number().min(0).optional(),
});

// Scheduled report schema
export const scheduledReportSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  reportType: z.string().optional(),
  frequency: z.string().min(1, 'Frequency is required'),
  format: z.string().optional(),
  time: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Mass email schema
export const massEmailSchema = z.object({
  name: z.string().min(1, 'Job name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  recipientType: z.string().min(1, 'Recipient type is required'),
  scheduledAt: z.string().optional(),
});

// Asset form schema
export const assetFormSchema = z.object({
  name: z.string().min(1, 'Asset name is required'),
  serialNumber: z.string().optional(),
  status: z.string().optional(),
  description: z.string().optional(),
  quantity: z.number().min(1).optional(),
  price: z.number().min(0).optional(),
  purchaseDate: z.string().optional(),
});

// Entitlement form schema
export const entitlementFormSchema = z.object({
  name: z.string().min(1, 'Entitlement name is required'),
  status: z.string().optional(),
  startDate: z.string().min(1, 'Start date is required'),
  endDate: z.string().min(1, 'End date is required'),
  description: z.string().optional(),
  remainingCases: z.number().optional(),
});

// Report form schema
export const reportFormSchema = z.object({
  name: z.string().min(1, 'Report name is required'),
  objectType: z.string().min(1, 'Object type is required'),
  format: z.string().optional(),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Role form schema
export const roleFormSchema = z.object({
  name: z.string().min(1, 'Role name is required'),
  label: z.string().min(1, 'Label is required'),
  description: z.string().optional(),
  parentRoleId: z.string().optional(),
});

// Chatter group schema
export const chatterGroupSchema = z.object({
  name: z.string().min(1, 'Group name is required'),
  description: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Note form schema
export const noteFormSchema = z.object({
  content: z.string().min(1, 'Content is required'),
  contactId: z.string().optional(),
  leadId: z.string().optional(),
  opportunityId: z.string().optional(),
});

// Event form schema (calendar events)
export const eventFormSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  startTime: z.string().min(1, 'Start time is required'),
  endTime: z.string().min(1, 'End time is required'),
  location: z.string().optional(),
  isAllDay: z.boolean().optional(),
});

// Knowledge article schema
export const knowledgeArticleSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  content: z.string().min(1, 'Content is required'),
  summary: z.string().optional(),
  status: z.string().optional(),
  categoryId: z.string().optional(),
  isPublic: z.boolean().optional(),
});

// Calendar event schema
export const calendarEventSchema = z.object({
  subject: z.string().min(1, 'Subject is required'),
  description: z.string().optional(),
  startDateTime: z.string().min(1, 'Start date/time is required'),
  endDateTime: z.string().min(1, 'End date/time is required'),
  location: z.string().optional(),
  isAllDay: z.boolean().optional(),
  isPrivate: z.boolean().optional(),
  status: z.string().optional(),
  reminderMinutes: z.number().optional(),
});

// Activity form schema
export const activityFormSchema = z.object({
  type: z.string().min(1, 'Activity type is required'),
  content: z.string().min(1, 'Content is required'),
  leadId: z.string().min(1, 'Lead is required'),
});

// Email template form schema
export const emailTemplateFormSchema = z.object({
  name: z.string().min(1, 'Template name is required'),
  subject: z.string().min(1, 'Subject is required'),
  body: z.string().min(1, 'Body is required'),
  category: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Custom object schema
export const customObjectSchema = z.object({
  name: z.string().min(1, 'Object name is required'),
  label: z.string().min(1, 'Label is required'),
  pluralLabel: z.string().min(1, 'Plural label is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Process flow schema
export const processFlowSchema = z.object({
  name: z.string().min(1, 'Flow name is required'),
  objectType: z.string().min(1, 'Object type is required'),
  description: z.string().optional(),
  isActive: z.boolean().optional(),
});

// Notification schema
export const notificationFormSchema = z.object({
  title: z.string().min(1, 'Title is required'),
  message: z.string().min(1, 'Message is required'),
  type: z.string().optional(),
  link: z.string().optional(),
});

export const registerFormSchema = z
  .object({
    businessSector: z.string().min(1, 'Business sector is required'),
    companyName: z.string().min(1, 'Company name is required'),
    contactName: z.string().min(1, 'Contact name is required'),
    email: z.string().email('Invalid email address'),
    password: passwordSchema,
    confirmPassword: z.string(),
    industry: z.string().optional(),
    website: z.string().optional(),
    phone: z.string().optional(),
  })
  .refine((data) => data.password === data.confirmPassword, {
    message: 'Passwords do not match',
    path: ['confirmPassword'],
  });

export function validateForm<T>(
  schema: z.ZodSchema<T>,
  data: unknown
): { success: true; data: T } | { success: false; errors: Record<string, string> } {
  const result = schema.safeParse(data);
  if (result.success) {
    return { success: true, data: result.data };
  }
  const errors: Record<string, string> = {};
  for (const issue of result.error.issues) {
    const path = issue.path.join('.');
    if (!errors[path]) {
      errors[path] = issue.message;
    }
  }
  return { success: false, errors };
}
