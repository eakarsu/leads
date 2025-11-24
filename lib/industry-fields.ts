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

  HOSPITALITY: [
    {
      name: 'businessType',
      label: 'Business Type',
      type: 'select',
      required: true,
      options: ['Hotel/Motel', 'Restaurant', 'Event Venue', 'Catering', 'Bar/Nightclub', 'Bed & Breakfast', 'Other'],
    },
    {
      name: 'serviceNeeded',
      label: 'Service Needed',
      type: 'select',
      required: true,
      options: ['Booking/Reservation Software', 'POS System', 'Event Management', 'Marketing Services', 'Staff Training', 'Consulting', 'Other'],
    },
    {
      name: 'currentCapacity',
      label: 'Capacity/Size',
      type: 'select',
      required: false,
      options: ['Small (1-20 seats/rooms)', 'Medium (21-100 seats/rooms)', 'Large (100-500 seats/rooms)', 'Enterprise (500+ seats/rooms)'],
    },
    {
      name: 'budget',
      label: 'Budget Range',
      type: 'select',
      required: false,
      options: ['Under $5K', '$5K - $20K', '$20K - $50K', '$50K - $100K', 'Over $100K', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['Immediate (this week)', 'Urgent (this month)', 'Soon (1-3 months)', 'Planning (3+ months)'],
    },
  ],

  FITNESS_WELLNESS: [
    {
      name: 'businessType',
      label: 'Business Type',
      type: 'select',
      required: true,
      options: ['Gym/Fitness Center', 'Yoga Studio', 'Personal Training', 'CrossFit Box', 'Pilates Studio', 'Martial Arts', 'Spa/Wellness Center', 'Other'],
    },
    {
      name: 'membershipGoal',
      label: 'Membership Goal/Current Size',
      type: 'select',
      required: false,
      options: ['Startup (0-50 members)', 'Growing (51-200 members)', 'Established (201-500 members)', 'Large (500+ members)'],
    },
    {
      name: 'serviceNeeded',
      label: 'Service Needed',
      type: 'select',
      required: true,
      options: ['Membership Management', 'Lead Generation', 'Marketing Services', 'Equipment Financing', 'Software/Technology', 'Consulting', 'Other'],
    },
    {
      name: 'challenges',
      label: 'Main Challenge',
      type: 'select',
      required: false,
      options: ['Getting new members', 'Retention/churn', 'Billing/payments', 'Scheduling/booking', 'Marketing', 'Other'],
    },
    {
      name: 'budget',
      label: 'Monthly Budget',
      type: 'select',
      required: false,
      options: ['Under $500/mo', '$500 - $1,500/mo', '$1,500 - $5,000/mo', 'Over $5,000/mo', 'Not sure'],
    },
  ],

  CONSTRUCTION: [
    {
      name: 'projectType',
      label: 'Project Type',
      type: 'select',
      required: true,
      options: ['New Construction', 'Remodeling/Renovation', 'Addition', 'Commercial Build-out', 'Repair/Restoration', 'Other'],
    },
    {
      name: 'projectScope',
      label: 'Project Scope',
      type: 'textarea',
      required: true,
      placeholder: 'Describe the construction project in detail...',
      helperText: 'Include size, materials, special requirements',
    },
    {
      name: 'propertyType',
      label: 'Property Type',
      type: 'select',
      required: true,
      options: ['Residential - Single Family', 'Residential - Multi Family', 'Commercial - Office', 'Commercial - Retail', 'Industrial', 'Other'],
    },
    {
      name: 'projectValue',
      label: 'Project Value/Budget',
      type: 'select',
      required: false,
      options: ['Under $50K', '$50K - $250K', '$250K - $1M', '$1M - $5M', 'Over $5M', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Project Timeline',
      type: 'select',
      required: true,
      options: ['Immediate - ready to start', 'Soon (1-3 months)', 'Planning (3-6 months)', 'Future (6+ months)'],
    },
    {
      name: 'permitsStatus',
      label: 'Permits Status',
      type: 'select',
      required: false,
      options: ['Permits in hand', 'Permits pending', 'Need help with permits', 'Not applicable'],
    },
  ],

  ECOMMERCE: [
    {
      name: 'businessStage',
      label: 'Business Stage',
      type: 'select',
      required: true,
      options: ['Pre-launch/Planning', 'New (0-6 months)', 'Growing (6 months - 2 years)', 'Established (2+ years)'],
    },
    {
      name: 'platform',
      label: 'Current Platform',
      type: 'select',
      required: false,
      options: ['Shopify', 'WooCommerce', 'Amazon', 'Etsy', 'eBay', 'Custom built', 'No store yet', 'Other'],
    },
    {
      name: 'serviceNeeded',
      label: 'Service Needed',
      type: 'select',
      required: true,
      options: ['Store setup/migration', 'Marketing/Advertising', 'SEO/Traffic', 'Payment processing', 'Fulfillment/Logistics', 'Product sourcing', 'Consulting', 'Other'],
    },
    {
      name: 'monthlyRevenue',
      label: 'Monthly Revenue',
      type: 'select',
      required: false,
      options: ['Not yet launched', 'Under $5K', '$5K - $25K', '$25K - $100K', '$100K - $500K', 'Over $500K'],
    },
    {
      name: 'productCategory',
      label: 'Product Category',
      type: 'text',
      required: false,
      placeholder: 'e.g., Fashion, Electronics, Home Goods',
    },
    {
      name: 'budget',
      label: 'Budget',
      type: 'select',
      required: false,
      options: ['Under $1K', '$1K - $5K', '$5K - $20K', '$20K - $50K', 'Over $50K', 'Not sure'],
    },
  ],

  INSURANCE: [
    {
      name: 'insuranceType',
      label: 'Insurance Type',
      type: 'select',
      required: true,
      options: ['Life Insurance', 'Health Insurance', 'Auto Insurance', 'Home/Property Insurance', 'Business Insurance', 'Disability Insurance', 'Long-term Care', 'Other'],
    },
    {
      name: 'coverageAmount',
      label: 'Coverage Amount Needed',
      type: 'select',
      required: false,
      options: ['Under $100K', '$100K - $250K', '$250K - $500K', '$500K - $1M', 'Over $1M', 'Not sure'],
    },
    {
      name: 'currentCoverage',
      label: 'Current Coverage Status',
      type: 'select',
      required: true,
      options: ['No coverage - first time', 'Have coverage - looking to add', 'Have coverage - looking to replace', 'Coverage expired', 'Not sure'],
    },
    {
      name: 'applicantAge',
      label: 'Applicant Age Range',
      type: 'select',
      required: false,
      options: ['Under 25', '25-34', '35-44', '45-54', '55-64', '65+'],
    },
    {
      name: 'healthStatus',
      label: 'Health Status',
      type: 'select',
      required: false,
      options: ['Excellent', 'Good', 'Fair', 'Pre-existing conditions', 'Prefer not to say'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['Immediate', 'This month', '1-3 months', 'Just researching'],
    },
  ],

  SOLAR_ENERGY: [
    {
      name: 'propertyType',
      label: 'Property Type',
      type: 'select',
      required: true,
      options: ['Residential - Single Family', 'Residential - Multi Family', 'Commercial Building', 'Agricultural', 'Industrial', 'Other'],
    },
    {
      name: 'ownership',
      label: 'Property Ownership',
      type: 'select',
      required: true,
      options: ['Own', 'Rent (need landlord approval)', 'Business owner', 'Property manager'],
    },
    {
      name: 'monthlyElectricBill',
      label: 'Average Monthly Electric Bill',
      type: 'select',
      required: false,
      options: ['Under $100', '$100 - $200', '$200 - $400', '$400 - $800', 'Over $800', 'Not sure'],
    },
    {
      name: 'motivation',
      label: 'Primary Motivation',
      type: 'select',
      required: true,
      options: ['Save money', 'Environmental concerns', 'Energy independence', 'Increase property value', 'Tax incentives', 'Other'],
    },
    {
      name: 'roofCondition',
      label: 'Roof Condition',
      type: 'select',
      required: false,
      options: ['Excellent - new/recent', 'Good - no issues', 'Fair - may need work soon', 'Poor - needs replacement', 'Not sure'],
    },
    {
      name: 'timeline',
      label: 'Timeline',
      type: 'select',
      required: true,
      options: ['Ready to install ASAP', 'Next 1-3 months', 'Next 3-6 months', 'Just researching'],
    },
    {
      name: 'financingPreference',
      label: 'Financing Preference',
      type: 'select',
      required: false,
      options: ['Cash purchase', 'Solar loan', 'Lease', 'PPA (Power Purchase Agreement)', 'Not sure yet'],
    },
  ],

  GENERAL: [],
};

export function getFieldsForSector(sector: string): CustomField[] {
  return industryFields[sector] || [];
}
