export interface FieldMapping {
  label: string;
  dbField: string;
  type: 'string' | 'number' | 'date' | 'boolean' | 'relation';
  relation?: string; // e.g., 'owner.name'
}

export const FIELD_MAPPINGS: Record<string, FieldMapping[]> = {
  Lead: [
    { label: 'Full Name', dbField: 'fullName', type: 'string' },
    { label: 'Email', dbField: 'email', type: 'string' },
    { label: 'Phone', dbField: 'phone', type: 'string' },
    { label: 'Company', dbField: 'company', type: 'string' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Lead Source', dbField: 'source', type: 'string' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
    { label: 'Owner', dbField: 'owner.name', type: 'relation', relation: 'owner' },
  ],
  Contact: [
    { label: 'First Name', dbField: 'firstName', type: 'string' },
    { label: 'Last Name', dbField: 'lastName', type: 'string' },
    { label: 'Email', dbField: 'email', type: 'string' },
    { label: 'Phone', dbField: 'phone', type: 'string' },
    { label: 'Title', dbField: 'title', type: 'string' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
    { label: 'Owner', dbField: 'owner.name', type: 'relation', relation: 'owner' },
  ],
  Account: [
    { label: 'Name', dbField: 'name', type: 'string' },
    { label: 'Industry', dbField: 'industry', type: 'string' },
    { label: 'Type', dbField: 'type', type: 'string' },
    { label: 'Website', dbField: 'website', type: 'string' },
    { label: 'Phone', dbField: 'phone', type: 'string' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
    { label: 'Owner', dbField: 'owner.name', type: 'relation', relation: 'owner' },
  ],
  Opportunity: [
    { label: 'Name', dbField: 'name', type: 'string' },
    { label: 'Stage', dbField: 'stage', type: 'string' },
    { label: 'Amount', dbField: 'amount', type: 'number' },
    { label: 'Probability', dbField: 'probability', type: 'number' },
    { label: 'Close Date', dbField: 'expectedCloseDate', type: 'date' },
    { label: 'Account', dbField: 'client.name', type: 'relation', relation: 'client' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
    { label: 'Owner', dbField: 'owner.name', type: 'relation', relation: 'owner' },
  ],
  Case: [
    { label: 'Case Number', dbField: 'caseNumber', type: 'string' },
    { label: 'Subject', dbField: 'subject', type: 'string' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Priority', dbField: 'priority', type: 'string' },
    { label: 'Origin', dbField: 'origin', type: 'string' },
    { label: 'Contact', dbField: 'contact.lastName', type: 'relation', relation: 'contact' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
    { label: 'Owner', dbField: 'owner.name', type: 'relation', relation: 'owner' },
  ],
  Campaign: [
    { label: 'Name', dbField: 'name', type: 'string' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Type', dbField: 'channel', type: 'string' },
    { label: 'Start Date', dbField: 'startDate', type: 'date' },
    { label: 'End Date', dbField: 'endDate', type: 'date' },
    { label: 'Expected Revenue', dbField: 'expectedRevenue', type: 'number' },
    { label: 'Actual Cost', dbField: 'actualCost', type: 'number' },
  ],
  Task: [
    { label: 'Subject', dbField: 'subject', type: 'string' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Priority', dbField: 'priority', type: 'string' },
    { label: 'Due Date', dbField: 'dueDate', type: 'date' },
    { label: 'Related To', dbField: 'relatedToType', type: 'string' },
    { label: 'Assigned To', dbField: 'assignee.name', type: 'relation', relation: 'assignee' },
    { label: 'Created Date', dbField: 'createdAt', type: 'date' },
  ],
  Contract: [
    { label: 'Contract Number', dbField: 'contractNumber', type: 'string' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Start Date', dbField: 'startDate', type: 'date' },
    { label: 'End Date', dbField: 'endDate', type: 'date' },
    { label: 'Value', dbField: 'contractValue', type: 'number' },
  ],
  Quote: [
    { label: 'Quote Number', dbField: 'quoteNumber', type: 'string' },
    { label: 'Name', dbField: 'name', type: 'string' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Total Price', dbField: 'totalPrice', type: 'number' },
    { label: 'Expiration Date', dbField: 'expirationDate', type: 'date' },
  ],
  Order: [
    { label: 'Order Number', dbField: 'orderNumber', type: 'string' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Order Date', dbField: 'orderDate', type: 'date' },
    { label: 'Total Amount', dbField: 'totalAmount', type: 'number' },
  ],
  Invoice: [
    { label: 'Invoice Number', dbField: 'invoiceNumber', type: 'string' },
    { label: 'Account', dbField: 'account.name', type: 'relation', relation: 'account' },
    { label: 'Status', dbField: 'status', type: 'string' },
    { label: 'Invoice Date', dbField: 'invoiceDate', type: 'date' },
    { label: 'Due Date', dbField: 'dueDate', type: 'date' },
    { label: 'Total Amount', dbField: 'totalAmount', type: 'number' },
  ],
};

// Helper: get label for a dbField
export function getLabelForDbField(objectType: string, dbField: string): string {
  const mapping = FIELD_MAPPINGS[objectType]?.find((f) => f.dbField === dbField);
  return mapping?.label || dbField;
}

// Helper: get dbField for a label
export function getDbFieldForLabel(objectType: string, label: string): string {
  const mapping = FIELD_MAPPINGS[objectType]?.find((f) => f.label === label);
  return mapping?.dbField || label;
}

// Helper: get field type
export function getFieldType(objectType: string, dbField: string): string {
  const mapping = FIELD_MAPPINGS[objectType]?.find((f) => f.dbField === dbField);
  return mapping?.type || 'string';
}
