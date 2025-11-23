export interface CustomField {
  name: string;
  label: string;
  type: 'text' | 'select' | 'textarea' | 'number' | 'date';
  required: boolean;
  options?: string[];
  placeholder?: string;
  helperText?: string;
}

export const industryFields: Record<string, CustomField[]> = {
  HOME_SERVICES: [
    {
      name: 'projectDescription',
      label: 'Project Description',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the home improvement project...',
      helperText: 'Required: Detailed description of the work needed',
    },
    {
      name: 'propertyType',
      label: 'Property Type',
      type: 'select',
      required: true,
      options: ['Residential - Single Family', 'Residential - Multi Family', 'Commercial', 'Other'],
    },
    {
      name: 'serviceNeeded',
      label: 'Service Needed',
      type: 'select',
      required: true,
      options: ['Repair', 'Replace/Install', 'Maintenance', 'Consultation', 'Emergency Service'],
    },
    {
      name: 'urgency',
      label: 'Urgency',
      type: 'select',
      required: true,
      options: ['Emergency (24-48 hours)', 'Urgent (This week)', 'Normal (This month)', 'Planning (Future)'],
    },
    {
      name: 'propertyOwnership',
      label: 'Property Ownership',
      type: 'select',
      required: true,
      options: ['Own', 'Rent', 'Property Manager'],
    },
    {
      name: 'budgetRange',
      label: 'Budget Range',
      type: 'select',
      required: false,
      options: ['Under $1,000', '$1,000 - $5,000', '$5,000 - $15,000', '$15,000 - $50,000', 'Over $50,000', 'Not sure'],
    },
  ],

  LEGAL_SERVICES: [
    {
      name: 'caseType',
      label: 'Case Type',
      type: 'select',
      required: true,
      options: ['Personal Injury - Auto Accident', 'Personal Injury - Slip & Fall', 'Personal Injury - Medical Malpractice', 'Personal Injury - Other', 'Family Law - Divorce', 'Family Law - Custody', 'Criminal Defense', 'Estate Planning', 'Other'],
    },
    {
      name: 'caseDescription',
      label: 'Case Description',
      type: 'textarea',
      required: true,
      placeholder: 'Brief description of the legal matter...',
      helperText: 'Required: Overview of the situation',
    },
    {
      name: 'injurySeverity',
      label: 'Injury Severity (if applicable)',
      type: 'select',
      required: false,
      options: ['Minor', 'Moderate', 'Severe', 'Catastrophic', 'Not applicable'],
    },
    {
      name: 'incidentDate',
      label: 'Incident Date',
      type: 'date',
      required: false,
      helperText: 'When did the incident occur?',
    },
    {
      name: 'insuranceCoverage',
      label: 'Insurance Coverage',
      type: 'select',
      required: false,
      options: ['Yes - Have insurance', 'Yes - Other party insured', 'No insurance involved', 'Unknown'],
    },
    {
      name: 'priorAttorney',
      label: 'Prior Attorney Contact',
      type: 'select',
      required: true,
      options: ['No', 'Yes - consulted only', 'Yes - currently represented', 'Yes - previously represented'],
    },
  ],

  FINANCIAL_SERVICES: [
    {
      name: 'serviceType',
      label: 'Service Type',
      type: 'select',
      required: true,
      options: ['Life Insurance', 'Health Insurance', 'Auto Insurance', 'Home Insurance', 'Mortgage - Purchase', 'Mortgage - Refinance', 'Personal Loan', 'Investment Services', 'Other'],
    },
    {
      name: 'coverageAmount',
      label: 'Coverage/Loan Amount',
      type: 'select',
      required: false,
      options: ['Under $100K', '$100K - $250K', '$250K - $500K', '$500K - $1M', 'Over $1M', 'Not sure'],
    },
    {
      name: 'creditScoreRange',
      label: 'Credit Score Range',
      type: 'select',
      required: false,
      options: ['Excellent (720+)', 'Good (680-719)', 'Fair (640-679)', 'Poor (under 640)', 'Not sure'],
    },
    {
      name: 'currentCoverage',
      label: 'Current Coverage/Mortgage',
      type: 'select',
      required: false,
      options: ['Yes - looking to switch', 'Yes - looking to add', 'No - first time', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['Immediate (this week)', 'Soon (this month)', 'Planning (1-3 months)', 'Researching (3+ months)'],
    },
  ],

  REAL_ESTATE: [
    {
      name: 'lookingFor',
      label: 'Looking For',
      type: 'select',
      required: true,
      options: ['Buy a home', 'Sell a home', 'Buy & Sell', 'Rent/Lease', 'Investment property', 'Commercial property'],
    },
    {
      name: 'location',
      label: 'Location/Area of Interest',
      type: 'text',
      required: true,
      placeholder: 'City, neighborhood, or zip code',
    },
    {
      name: 'priceRange',
      label: 'Price Range',
      type: 'select',
      required: false,
      options: ['Under $200K', '$200K - $400K', '$400K - $600K', '$600K - $800K', '$800K - $1M', 'Over $1M', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['Immediate (ready now)', 'Soon (1-3 months)', 'Planning (3-6 months)', 'Long-term (6+ months)'],
    },
    {
      name: 'preApproved',
      label: 'Pre-Approval Status (Buyers)',
      type: 'select',
      required: false,
      options: ['Yes - pre-approved', 'In process', 'Not yet', 'Cash buyer', 'Not applicable'],
    },
    {
      name: 'currentSituation',
      label: 'Current Situation',
      type: 'select',
      required: false,
      options: ['First-time buyer', 'Current homeowner', 'Relocating', 'Downsizing', 'Upsizing', 'Investor', 'Other'],
    },
  ],

  HEALTHCARE: [
    {
      name: 'serviceInterest',
      label: 'Service of Interest',
      type: 'select',
      required: true,
      options: ['Dental - General', 'Dental - Cosmetic', 'Plastic Surgery', 'Weight Loss', 'Addiction Treatment', 'Physical Therapy', 'Mental Health', 'Other'],
    },
    {
      name: 'insuranceStatus',
      label: 'Insurance Status',
      type: 'select',
      required: false,
      options: ['Have insurance', 'No insurance - self-pay', 'Medicare/Medicaid', 'Not sure'],
    },
    {
      name: 'urgency',
      label: 'Urgency',
      type: 'select',
      required: true,
      options: ['Urgent - need soon', 'Normal - willing to wait', 'Consultation only', 'Just researching'],
    },
    {
      name: 'preferredContact',
      label: 'Preferred Contact Method',
      type: 'select',
      required: false,
      options: ['Phone', 'Email', 'Text message', 'No preference'],
    },
  ],

  B2B_SAAS: [
    {
      name: 'companySize',
      label: 'Company Size',
      type: 'select',
      required: true,
      options: ['1-10 employees', '11-50 employees', '51-200 employees', '201-500 employees', '500+ employees'],
    },
    {
      name: 'industry',
      label: 'Industry',
      type: 'text',
      required: true,
      placeholder: 'e.g., Healthcare, Finance, Retail',
    },
    {
      name: 'currentSolution',
      label: 'Current Solution',
      type: 'select',
      required: false,
      options: ['Using competitor', 'Using in-house solution', 'Using spreadsheets', 'No current solution', 'Other'],
    },
    {
      name: 'budget',
      label: 'Annual Budget',
      type: 'select',
      required: false,
      options: ['Under $10K', '$10K - $50K', '$50K - $100K', '$100K - $500K', 'Over $500K', 'Not determined'],
    },
    {
      name: 'timeline',
      label: 'Implementation Timeline',
      type: 'select',
      required: true,
      options: ['Immediate', '1-3 months', '3-6 months', '6-12 months', 'Just researching'],
    },
    {
      name: 'decisionMaker',
      label: 'Decision Role',
      type: 'select',
      required: true,
      options: ['Decision maker', 'Influencer', 'Evaluator/Researcher', 'End user'],
    },
  ],

  EDUCATION: [
    {
      name: 'programInterest',
      label: 'Program of Interest',
      type: 'text',
      required: true,
      placeholder: 'e.g., MBA, Software Development, Marketing',
    },
    {
      name: 'educationLevel',
      label: 'Current Education Level',
      type: 'select',
      required: false,
      options: ['High School', 'Some College', 'Associate Degree', 'Bachelor Degree', 'Master Degree', 'Doctorate'],
    },
    {
      name: 'studyPreference',
      label: 'Study Preference',
      type: 'select',
      required: true,
      options: ['Online', 'In-person', 'Hybrid', 'No preference'],
    },
    {
      name: 'startDate',
      label: 'Desired Start Date',
      type: 'select',
      required: false,
      options: ['Next term', '3-6 months', '6-12 months', 'Not sure'],
    },
  ],

  AUTOMOTIVE: [
    {
      name: 'interestType',
      label: 'Interest Type',
      type: 'select',
      required: true,
      options: ['Buy new car', 'Buy used car', 'Lease', 'Service/Repair', 'Trade-in', 'Other'],
    },
    {
      name: 'vehicleType',
      label: 'Vehicle Type',
      type: 'select',
      required: false,
      options: ['Sedan', 'SUV', 'Truck', 'Van', 'Sports car', 'Electric', 'Hybrid', 'Other'],
    },
    {
      name: 'budgetRange',
      label: 'Budget Range',
      type: 'select',
      required: false,
      options: ['Under $20K', '$20K - $35K', '$35K - $50K', '$50K - $75K', 'Over $75K', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['This week', 'This month', '1-3 months', 'Just looking'],
    },
  ],

  GENERAL: [],
};

export function getFieldsForSector(sector: string): CustomField[] {
  return industryFields[sector] || [];
}
