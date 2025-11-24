/**
 * Get friendly field names for display (Client-side only)
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
