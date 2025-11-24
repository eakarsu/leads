import { prisma } from '@/lib/prisma';

/**
 * Track field changes for audit trail
 * @param objectType - Type of object (Lead, Contact, Opportunity, etc.)
 * @param objectId - ID of the record being changed
 * @param oldRecord - Previous state of the record
 * @param newRecord - New state of the record
 * @param userId - ID of user making the change
 * @param fieldsToTrack - Optional: specific fields to track. If not provided, tracks all changes
 */
export async function trackFieldChanges(
  objectType: string,
  objectId: string,
  oldRecord: any,
  newRecord: any,
  userId: string,
  fieldsToTrack?: string[]
) {
  const changes: Array<{
    objectType: string;
    objectId: string;
    fieldName: string;
    oldValue: string | null;
    newValue: string | null;
    changedBy: string;
  }> = [];

  const fieldsToCheck = fieldsToTrack || Object.keys(newRecord);

  for (const field of fieldsToCheck) {
    // Skip certain fields that shouldn't be tracked
    if (['id', 'createdAt', 'updatedAt', 'hashedPassword'].includes(field)) {
      continue;
    }

    const oldValue = oldRecord ? oldRecord[field] : null;
    const newValue = newRecord[field];

    // Check if value actually changed
    if (JSON.stringify(oldValue) !== JSON.stringify(newValue)) {
      changes.push({
        objectType,
        objectId,
        fieldName: field,
        oldValue: oldValue ? formatValue(oldValue) : null,
        newValue: newValue ? formatValue(newValue) : null,
        changedBy: userId,
      });
    }
  }

  // Bulk create field history records
  if (changes.length > 0) {
    await prisma.fieldHistory.createMany({
      data: changes,
    });
  }

  return changes;
}

/**
 * Format a value for storage in field history
 */
function formatValue(value: any): string {
  if (value === null || value === undefined) {
    return '';
  }

  if (value instanceof Date) {
    return value.toISOString();
  }

  if (typeof value === 'object') {
    return JSON.stringify(value);
  }

  return String(value);
}

/**
 * Get friendly field names for display
 */
export function getFieldLabel(fieldName: string): string {
  const labels: Record<string, string> = {
    fullName: 'Full Name',
    firstName: 'First Name',
    lastName: 'Last Name',
    email: 'Email',
    phone: 'Phone',
    title: 'Job Title',
    company: 'Company',
    status: 'Status',
    qualificationScore: 'Qualification Score',
    leadSource: 'Lead Source',
    stage: 'Stage',
    amount: 'Amount',
    probability: 'Probability',
    expectedCloseDate: 'Expected Close Date',
    closedDate: 'Closed Date',
    priority: 'Priority',
    dueDate: 'Due Date',
    assignedTo: 'Assigned To',
    ownerId: 'Owner',
    contactId: 'Contact',
    opportunityId: 'Opportunity',
    campaignId: 'Campaign',
    notes: 'Notes',
    description: 'Description',
    website: 'Website',
    linkedinUrl: 'LinkedIn URL',
  };

  return labels[fieldName] || fieldName.charAt(0).toUpperCase() + fieldName.slice(1);
}
