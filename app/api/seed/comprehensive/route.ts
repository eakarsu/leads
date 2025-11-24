import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { prisma } from '@/lib/prisma';

// Sector-specific data configurations
const SECTOR_DATA = {
  HOME_SERVICES: {
    companies: ['ProClean Services', 'HomeHero Repairs', 'Elite Plumbing Co', 'QuickFix HVAC', 'GreenLawn Care', 'Perfect Painting Pro', 'Electrical Experts LLC', 'Roofing Masters Inc', 'Handyman Solutions', 'Carpet Clean Kings', 'Window Washing Wizards', 'Garage Door Gurus', 'Pest Control Plus', 'Pool Service Pros', 'Landscaping Legends'],
    contacts: ['John Martinez', 'Sarah Johnson', 'Mike Davis', 'Lisa Anderson', 'Tom Wilson', 'Jennifer Brown', 'Robert Garcia', 'Mary Williams', 'David Miller', 'Patricia Jones', 'Michael Taylor', 'Linda Moore', 'James White', 'Barbara Harris', 'Christopher Martin'],
    jobTitles: ['Operations Manager', 'Service Director', 'Owner', 'General Manager', 'Fleet Manager', 'Project Coordinator', 'Service Supervisor', 'Regional Manager', 'Business Owner', 'Operations Director', 'Customer Success Manager', 'Quality Control Manager', 'Sales Director', 'Account Manager', 'Service Manager'],
    products: [
      { name: 'Plumbing Service Package', price: 2500, category: 'Service Plans' },
      { name: 'HVAC Maintenance Contract', price: 5000, category: 'Maintenance' },
      { name: 'Lawn Care Subscription', price: 1200, category: 'Recurring Services' },
      { name: 'Electrical Safety Inspection', price: 850, category: 'Inspection Services' },
      { name: 'Roof Repair Service', price: 3500, category: 'Repairs' },
      { name: 'Interior Painting Package', price: 4200, category: 'Painting' },
      { name: 'Carpet Deep Cleaning', price: 650, category: 'Cleaning' },
      { name: 'Pest Control Annual Plan', price: 1800, category: 'Pest Control' },
      { name: 'Pool Maintenance Monthly', price: 250, category: 'Pool Service' },
      { name: 'Garage Door Installation', price: 2800, category: 'Installation' },
      { name: 'Window Cleaning Service', price: 350, category: 'Cleaning' },
      { name: 'Handyman Hour Bundle', price: 600, category: 'General Service' },
      { name: 'Landscaping Design Package', price: 5500, category: 'Landscaping' },
      { name: 'Emergency Service Call', price: 450, category: 'Emergency' },
      { name: 'Seasonal Maintenance Plan', price: 2200, category: 'Maintenance' },
    ],
    opportunities: ['Annual Maintenance Contract', 'Emergency Repair Services', 'Equipment Upgrade', 'Home Renovation Project', 'Seasonal Service Package', 'Commercial Property Maintenance', 'Multi-Unit Service Agreement', 'Property Management Contract', 'New Construction Services', 'Warranty Service Plan', 'VIP Customer Package', 'Preventive Maintenance Plan', 'System Replacement Project', 'Energy Efficiency Upgrade', 'Smart Home Integration'],
    tasks: ['Schedule site inspection', 'Send service quote', 'Follow up on estimate', 'Prepare detailed proposal', 'Coordinate with subcontractors', 'Order materials and supplies', 'Schedule installation date', 'Send payment invoice', 'Book follow-up appointment', 'Request customer testimonial', 'Update service records', 'Send maintenance reminder', 'Process warranty claim', 'Schedule equipment delivery', 'Confirm service appointment'],
  },
  LEGAL_SERVICES: {
    companies: ['Smith & Associates Law', 'Justice Legal Group', 'Corporate Counsel LLP', 'Family Law Partners', 'IP Defense Attorneys', 'Employment Law Experts', 'Real Estate Legal Services', 'Tax Law Specialists', 'Criminal Defense Team', 'Estate Planning Pro', 'Immigration Law Group', 'Personal Injury Advocates', 'Business Law Advisors', 'Litigation Partners LLC', 'Regulatory Compliance Firm'],
    contacts: ['Jennifer Roberts', 'David Chen', 'Maria Garcia', 'Robert Taylor', 'Emily White', 'William Thompson', 'Susan Anderson', 'Richard Martinez', 'Karen Wilson', 'Joseph Lee', 'Nancy Brown', 'Thomas Moore', 'Carol Davis', 'Daniel Jackson', 'Margaret Harris'],
    jobTitles: ['Managing Partner', 'Senior Attorney', 'Legal Director', 'Practice Manager', 'Chief Legal Officer', 'Partner', 'Associate Attorney', 'Of Counsel', 'Legal Administrator', 'Paralegal Manager', 'Senior Counsel', 'Practice Head', 'General Counsel', 'Lead Attorney', 'Legal Operations Director'],
    products: [
      { name: 'Corporate Legal Retainer', price: 15000, category: 'Retainer Services' },
      { name: 'IP Protection Package', price: 8000, category: 'Intellectual Property' },
      { name: 'Contract Review Service', price: 3500, category: 'Consulting' },
      { name: 'Employment Law Advisory', price: 6000, category: 'Employment Law' },
      { name: 'Litigation Support Package', price: 25000, category: 'Litigation' },
      { name: 'M&A Due Diligence', price: 35000, category: 'Corporate' },
      { name: 'Trademark Registration', price: 2500, category: 'IP' },
      { name: 'Estate Planning Bundle', price: 4500, category: 'Estate Planning' },
      { name: 'Real Estate Transaction', price: 3000, category: 'Real Estate' },
      { name: 'Immigration Case Management', price: 5500, category: 'Immigration' },
      { name: 'Compliance Audit Service', price: 12000, category: 'Compliance' },
      { name: 'Tax Law Consultation', price: 7500, category: 'Tax Law' },
      { name: 'Document Drafting Service', price: 2000, category: 'General' },
      { name: 'Mediation Services', price: 4000, category: 'ADR' },
      { name: 'Legal Risk Assessment', price: 8500, category: 'Consulting' },
    ],
    opportunities: ['Annual Legal Retainer', 'M&A Legal Support', 'Compliance Review', 'Litigation Case', 'IP Portfolio Management', 'Corporate Restructuring', 'Employment Dispute Resolution', 'Real Estate Closing', 'Estate Planning Services', 'Immigration Application', 'Tax Planning Strategy', 'Regulatory Filing Support', 'Contract Negotiation', 'Dispute Mediation', 'General Counsel Services'],
    tasks: ['Schedule consultation call', 'Send engagement letter', 'Prepare case summary', 'Draft legal documents', 'Review contract terms', 'File court documents', 'Conduct legal research', 'Prepare client presentation', 'Schedule deposition', 'Send billing statement', 'Update case status', 'Coordinate with opposing counsel', 'Prepare settlement offer', 'Schedule strategy meeting', 'Request discovery documents'],
  },
  FINANCIAL_SERVICES: {
    companies: ['Wealth Management Pro', 'Capital Advisors Inc', 'Investment Solutions Group', 'FinTech Innovations', 'Retirement Planning Co', 'Premier Investment Group', 'Financial Freedom Partners', 'Strategic Wealth Advisors', 'Global Asset Management', 'Private Banking Services', 'Trust & Estate Planners', 'Risk Management Associates', 'Portfolio Optimization Firm', 'Retirement Solutions Inc', 'Corporate Finance Advisors'],
    contacts: ['William Brown', 'Amanda Lee', 'Christopher Moore', 'Jessica Taylor', 'Daniel Kim', 'Elizabeth Turner', 'Michael Roberts', 'Sarah Phillips', 'Andrew Campbell', 'Jennifer Evans', 'Matthew Parker', 'Laura Collins', 'Kevin Stewart', 'Rachel Morris', 'Brian Cooper'],
    jobTitles: ['Financial Advisor', 'Portfolio Manager', 'Investment Director', 'CFO', 'Risk Manager', 'Wealth Advisor', 'Financial Planner', 'Investment Analyst', 'Chief Investment Officer', 'VP of Private Banking', 'Estate Planning Specialist', 'Asset Manager', 'Financial Consultant', 'Retirement Advisor', 'Corporate Finance Manager'],
    products: [
      { name: 'Investment Advisory Package', price: 25000, category: 'Advisory Services' },
      { name: 'Portfolio Management', price: 50000, category: 'Management' },
      { name: 'Financial Planning Service', price: 10000, category: 'Planning' },
      { name: 'Retirement Planning Bundle', price: 15000, category: 'Retirement' },
      { name: 'Estate Planning Services', price: 12000, category: 'Estate' },
      { name: 'Tax Optimization Strategy', price: 8500, category: 'Tax Planning' },
      { name: 'Risk Assessment Package', price: 7000, category: 'Risk Management' },
      { name: '401k Advisory Service', price: 20000, category: 'Corporate' },
      { name: 'Trust Management', price: 30000, category: 'Trust Services' },
      { name: 'Investment Research Access', price: 6000, category: 'Research' },
      { name: 'Private Banking Service', price: 45000, category: 'Banking' },
      { name: 'Asset Allocation Review', price: 5500, category: 'Advisory' },
      { name: 'Insurance Planning', price: 4500, category: 'Insurance' },
      { name: 'College Savings Plan', price: 3500, category: 'Education' },
      { name: 'Business Succession Planning', price: 18000, category: 'Business' },
    ],
    opportunities: ['Annual Advisory Contract', 'Portfolio Restructuring', '401k Management', 'Estate Planning Engagement', 'Corporate Investment Strategy', 'Retirement Planning Services', 'Trust Administration', 'Wealth Transfer Planning', 'Tax-Loss Harvesting', 'Private Banking Relationship', 'Alternative Investment Access', 'Insurance Portfolio Review', 'Business Exit Strategy', 'Charitable Giving Plan', 'Multi-Generation Wealth Management'],
    tasks: ['Review financial statements', 'Prepare investment proposal', 'Schedule portfolio review', 'Conduct risk assessment', 'Update financial plan', 'Rebalance investment portfolio', 'Prepare quarterly report', 'Schedule client meeting', 'Research investment opportunities', 'Review insurance coverage', 'Calculate retirement projections', 'Prepare tax documents', 'Update beneficiary designations', 'Review estate documents', 'Coordinate with CPA and attorney'],
  },
  REAL_ESTATE: {
    companies: ['Premier Properties LLC', 'Commercial Realty Group', 'Residential Experts Inc', 'Property Management Pro', 'Urban Development Co', 'Luxury Estates International', 'Industrial Property Partners', 'Retail Space Solutions', 'Multi-Family Housing Corp', 'Investment Property Group', 'Downtown Real Estate', 'Suburban Properties Inc', 'Waterfront Realty', 'Mountain View Properties', 'City Center Developments'],
    contacts: ['Patricia Miller', 'James Anderson', 'Linda Martinez', 'Kevin Thompson', 'Nancy Rodriguez', 'Steven Parker', 'Michelle Turner', 'Robert Hughes', 'Sandra Collins', 'Andrew Bennett', 'Jessica Foster', 'Daniel Brooks', 'Christina Reed', 'Matthew Powell', 'Angela Watson'],
    jobTitles: ['Real Estate Agent', 'Property Manager', 'Development Director', 'Broker', 'Asset Manager', 'Senior Broker', 'Leasing Director', 'Commercial Agent', 'Residential Director', 'Portfolio Manager', 'Real Estate Director', 'Investment Manager', 'Property Owner', 'Acquisitions Manager', 'VP of Real Estate'],
    products: [
      { name: 'Property Management Service', price: 3000, category: 'Management' },
      { name: 'Leasing Package', price: 5000, category: 'Leasing' },
      { name: 'Marketing Bundle', price: 2500, category: 'Marketing' },
      { name: 'Commercial Property Sale', price: 850000, category: 'Sales' },
      { name: 'Residential Home Sale', price: 450000, category: 'Residential' },
      { name: 'Property Valuation Service', price: 1500, category: 'Appraisal' },
      { name: 'Tenant Screening Package', price: 800, category: 'Services' },
      { name: 'Commercial Lease Agreement', price: 7500, category: 'Leasing' },
      { name: 'HOA Management', price: 4200, category: 'Management' },
      { name: 'Investment Property Analysis', price: 2800, category: 'Consulting' },
      { name: 'Property Staging Service', price: 3500, category: 'Marketing' },
      { name: 'Real Estate Photography', price: 650, category: 'Marketing' },
      { name: '1031 Exchange Consulting', price: 5500, category: 'Investment' },
      { name: 'Property Inspection Service', price: 950, category: 'Inspection' },
      { name: 'Virtual Tour Production', price: 1200, category: 'Technology' },
    ],
    opportunities: ['Property Listing Agreement', 'Commercial Lease', 'Property Sale', 'Multi-Property Portfolio', 'Investment Property Purchase', 'Property Development Deal', 'Commercial Building Sale', 'Residential Community', 'Office Space Lease', 'Retail Location', 'Industrial Warehouse', 'Luxury Home Sale', 'Property Management Contract', 'REO Property Purchase', 'Land Development Project'],
    tasks: ['Schedule property showing', 'Prepare listing materials', 'Send comparable analysis', 'Order property inspection', 'Review lease terms', 'Prepare purchase offer', 'Coordinate closing date', 'Send property photos', 'Update listing details', 'Schedule open house', 'Prepare market analysis', 'Contact potential buyers', 'Review financing options', 'Coordinate with title company', 'Send investment returns analysis'],
  },
  HEALTHCARE: {
    companies: ['HealthFirst Medical', 'WellCare Clinic', 'Advanced Surgery Center', 'MedTech Solutions', 'Dental Excellence Group', 'Regional Hospital Network', 'Urgent Care Centers', 'Specialty Medical Group', 'Family Practice Associates', 'Diagnostic Imaging Center', 'Rehabilitation Services Inc', 'Home Health Care Plus', 'Pediatric Medical Group', 'Orthopedic Surgery Center', 'Mental Health Partners'],
    contacts: ['Dr. Michael Johnson', 'Dr. Sarah Williams', 'Nurse Manager Lisa Brown', 'Administrator John Davis', 'Dr. Emily Chen', 'Dr. Robert Martinez', 'Practice Manager Angela White', 'Dr. Jennifer Lee', 'COO Thomas Anderson', 'Dr. Christopher Taylor', 'CFO Patricia Moore', 'Dr. David Harris', 'Clinical Director Susan Clark', 'Dr. Matthew Robinson', 'VP Operations Rachel Lewis'],
    jobTitles: ['Chief Medical Officer', 'Practice Manager', 'Healthcare Administrator', 'Medical Director', 'Department Head', 'Hospital CEO', 'Clinical Operations Director', 'Chief Nursing Officer', 'VP of Clinical Services', 'Practice Administrator', 'Healthcare IT Director', 'Chief Financial Officer', 'Physician Group Leader', 'Quality Assurance Director', 'Patient Services Manager'],
    products: [
      { name: 'EMR Software License', price: 12000, category: 'Software' },
      { name: 'Medical Equipment Package', price: 45000, category: 'Equipment' },
      { name: 'Telehealth Solution', price: 8000, category: 'Technology' },
      { name: 'Practice Management System', price: 18000, category: 'Software' },
      { name: 'PACS Imaging System', price: 75000, category: 'Radiology' },
      { name: 'Patient Portal Platform', price: 6500, category: 'Technology' },
      { name: 'Medical Billing Software', price: 9500, category: 'Revenue Cycle' },
      { name: 'Laboratory Information System', price: 22000, category: 'Lab Management' },
      { name: 'Pharmacy Management System', price: 15000, category: 'Pharmacy' },
      { name: 'Scheduling & Appointment System', price: 5500, category: 'Software' },
      { name: 'Clinical Documentation Tool', price: 7800, category: 'Documentation' },
      { name: 'Medical Supply Management', price: 11000, category: 'Inventory' },
      { name: 'Patient Monitoring System', price: 32000, category: 'Equipment' },
      { name: 'Healthcare Analytics Platform', price: 14500, category: 'Analytics' },
      { name: 'Credentialing Management', price: 4200, category: 'Compliance' },
    ],
    opportunities: ['EMR System Implementation', 'Equipment Upgrade', 'Practice Expansion', 'Hospital-wide EHR Deployment', 'Telehealth Platform Launch', 'Medical Imaging Upgrade', 'Practice Acquisition', 'Multi-Location Rollout', 'Revenue Cycle Optimization', 'Clinical Integration', 'Patient Engagement System', 'Population Health Management', 'Value-Based Care Initiative', 'Specialty Practice Software', 'Healthcare Interoperability'],
    tasks: ['Schedule demo appointment', 'Prepare ROI analysis', 'Send equipment brochure', 'Arrange site assessment', 'Prepare compliance documentation', 'Schedule clinical workflow review', 'Send case studies', 'Coordinate IT evaluation', 'Prepare implementation timeline', 'Review HIPAA requirements', 'Schedule physician presentation', 'Send pricing proposal', 'Arrange reference calls', 'Prepare training plan', 'Review integration requirements'],
  },
  B2B_SAAS: {
    companies: ['CloudTech Solutions', 'Enterprise Software Co', 'SaaS Innovations Inc', 'Platform Pro', 'Data Analytics Corp', 'AI Software Labs', 'Collaboration Tools Inc', 'Security Solutions Platform', 'Marketing Automation Co', 'Sales Enablement Pro', 'Customer Success Platform', 'Business Intelligence Suite', 'Workflow Automation Inc', 'Cloud Infrastructure Co', 'API Management Solutions'],
    contacts: ['Alex Turner', 'Samantha Green', 'Brian Wilson', 'Michelle Lee', 'Ryan Cooper', 'Jordan Mitchell', 'Taylor Richardson', 'Casey Foster', 'Morgan Phillips', 'Drew Martinez', 'Cameron Brooks', 'Riley Anderson', 'Quinn Thompson', 'Avery Walker', 'Parker Hughes'],
    jobTitles: ['CTO', 'VP of Engineering', 'Product Manager', 'Head of IT', 'DevOps Director', 'Chief Product Officer', 'Director of Technology', 'VP of Operations', 'Technical Architect', 'Engineering Manager', 'IT Director', 'Platform Lead', 'Infrastructure Manager', 'Head of Innovation', 'Chief Technology Strategist'],
    products: [
      { name: 'Enterprise Platform License', price: 50000, category: 'Software Licenses' },
      { name: 'API Integration Package', price: 15000, category: 'Integration' },
      { name: 'Premium Support Plan', price: 12000, category: 'Support' },
      { name: 'Advanced Analytics Module', price: 28000, category: 'Analytics' },
      { name: 'Security & Compliance Add-on', price: 18500, category: 'Security' },
      { name: 'Custom Development Package', price: 45000, category: 'Professional Services' },
      { name: 'Multi-Tenant Architecture', price: 35000, category: 'Infrastructure' },
      { name: 'AI/ML Features Bundle', price: 40000, category: 'AI/ML' },
      { name: 'White Label Solution', price: 60000, category: 'Customization' },
      { name: 'Dedicated Instance', price: 75000, category: 'Hosting' },
      { name: 'Advanced Workflow Engine', price: 22000, category: 'Automation' },
      { name: 'Enterprise SSO Integration', price: 8500, category: 'Security' },
      { name: 'Data Migration Services', price: 25000, category: 'Professional Services' },
      { name: 'Training & Onboarding Program', price: 12500, category: 'Training' },
      { name: 'Premium API Access', price: 16000, category: 'Developer Tools' },
    ],
    opportunities: ['Enterprise License Deal', 'Platform Migration', 'Custom Integration', 'Multi-Year Contract', 'Enterprise Expansion', 'Strategic Partnership', 'Global Deployment', 'Platform Consolidation', 'Digital Transformation Initiative', 'API Modernization', 'Cloud Migration Project', 'Custom Feature Development', 'White Label Partnership', 'Data Integration Project', 'Enterprise-wide Rollout'],
    tasks: ['Schedule product demo', 'Prepare technical proposal', 'Send pricing details', 'Arrange technical deep-dive', 'Conduct security review', 'Prepare architecture diagram', 'Schedule stakeholder presentation', 'Send API documentation', 'Coordinate proof of concept', 'Prepare ROI calculator', 'Review integration requirements', 'Schedule engineering call', 'Send case studies', 'Prepare implementation roadmap', 'Conduct competitive analysis'],
  },
  EDUCATION: {
    companies: ['University Tech Services', 'K-12 Solutions Inc', 'Learning Management Co', 'Educational Software Group', 'Campus Services Pro', 'Higher Education Systems', 'School District Technology', 'Online Learning Platform', 'Student Success Solutions', 'Academic Software Inc', 'Campus Safety Systems', 'EdTech Innovations', 'Library Management Co', 'Assessment Solutions Group', 'Career Services Platform'],
    contacts: ['Principal Mary Johnson', 'Dean Thomas Anderson', 'IT Director Susan Miller', 'Superintendent David Brown', 'Dr. Jennifer Lee', 'Chancellor Robert Wilson', 'Director Patricia Moore', 'VP Michael Harris', 'Provost Linda Taylor', 'CIO James Martin', 'President Sarah Clark', 'Director Kevin White', 'Assistant Dean Laura Turner', 'Technology Lead Daniel Garcia', 'Academic VP Amanda Rodriguez'],
    jobTitles: ['School Principal', 'University Dean', 'IT Director', 'Superintendent', 'Department Chair', 'University President', 'Provost', 'Chief Information Officer', 'Director of Technology', 'Academic Affairs VP', 'District Superintendent', 'Campus Director', 'Educational Technology Director', 'Enrollment Director', 'Student Services VP'],
    products: [
      { name: 'Learning Management System', price: 25000, category: 'Software' },
      { name: 'Student Information System', price: 35000, category: 'Administration' },
      { name: 'Campus WiFi Solution', price: 18000, category: 'Infrastructure' },
      { name: 'Online Course Platform', price: 28000, category: 'E-Learning' },
      { name: 'Student Portal & Mobile App', price: 15000, category: 'Student Services' },
      { name: 'Admissions Management System', price: 22000, category: 'Enrollment' },
      { name: 'Assessment & Testing Platform', price: 16500, category: 'Assessment' },
      { name: 'Library Management System', price: 12000, category: 'Library' },
      { name: 'Campus Security System', price: 45000, category: 'Safety' },
      { name: 'Financial Aid Management', price: 19000, category: 'Financial' },
      { name: 'Alumni Relations Platform', price: 9500, category: 'Advancement' },
      { name: 'Classroom Technology Bundle', price: 32000, category: 'Classroom' },
      { name: 'Parent Communication System', price: 7800, category: 'Communication' },
      { name: 'Attendance Tracking System', price: 8500, category: 'Operations' },
      { name: 'Analytics & Reporting Suite', price: 14000, category: 'Analytics' },
    ],
    opportunities: ['Campus-wide LMS Deployment', 'IT Infrastructure Upgrade', 'Security System', 'District-wide SIS Implementation', 'Online Learning Expansion', 'Digital Transformation', 'Campus Modernization Project', 'Student Success Initiative', 'Cloud Migration', 'Multi-Campus Rollout', 'Assessment Platform Upgrade', 'Library System Replacement', 'Parent Portal Launch', 'Admissions System Overhaul', 'Campus Safety Enhancement'],
    tasks: ['Schedule campus visit', 'Prepare education proposal', 'Send case studies', 'Arrange faculty presentation', 'Conduct needs assessment', 'Prepare budget justification', 'Schedule IT evaluation', 'Send compliance documentation', 'Coordinate pilot program', 'Prepare training schedule', 'Review accessibility requirements', 'Send vendor references', 'Schedule board presentation', 'Prepare implementation timeline', 'Review integration with existing systems'],
  },
  AUTOMOTIVE: {
    companies: ['Auto Dealership Network', 'Service Center Pro', 'Fleet Management Inc', 'Car Wash Solutions', 'Auto Parts Wholesale', 'Luxury Auto Group', 'Commercial Truck Sales', 'Used Car Superstore', 'Auto Body Repair Center', 'Tire & Service Centers', 'Auto Auction Services', 'Collision Repair Network', 'Quick Lube Franchise', 'Auto Glass Solutions', 'Mobile Mechanic Services'],
    contacts: ['Sales Manager Tony Garcia', 'Service Director Karen White', 'Owner Mark Johnson', 'Fleet Manager Lisa Davis', 'Parts Manager Joe Smith', 'GM Robert Martinez', 'Finance Director Susan Thompson', 'Operations VP Michael Anderson', 'Fixed Ops Director Jennifer Brown', 'Regional Manager David Wilson', 'Controller Patricia Moore', 'Service Manager Christopher Lee', 'Sales Director Amanda Taylor', 'Parts Director Kevin Harris', 'Body Shop Manager Daniel Clark'],
    jobTitles: ['Sales Manager', 'Service Director', 'General Manager', 'Fleet Manager', 'Operations Manager', 'Dealer Principal', 'Fixed Operations Director', 'Used Car Manager', 'Finance Manager', 'Parts Director', 'Body Shop Manager', 'Regional Director', 'Service Advisor Manager', 'BDC Director', 'Controller'],
    products: [
      { name: 'Dealership Management Software', price: 20000, category: 'Software' },
      { name: 'Service Bay Equipment', price: 35000, category: 'Equipment' },
      { name: 'Inventory Management System', price: 15000, category: 'Software' },
      { name: 'CRM for Automotive', price: 18000, category: 'Customer Management' },
      { name: 'Parts Ordering System', price: 12000, category: 'Parts Management' },
      { name: 'Finance & Insurance Platform', price: 16500, category: 'F&I' },
      { name: 'Digital Marketing Suite', price: 9500, category: 'Marketing' },
      { name: 'Service Scheduling Software', price: 8000, category: 'Service' },
      { name: 'Vehicle Appraisal Tools', price: 6500, category: 'Appraisal' },
      { name: 'Customer Data Platform', price: 14000, category: 'Analytics' },
      { name: 'Mobile Service App', price: 10000, category: 'Mobile' },
      { name: 'Diagnostic Equipment', price: 28000, category: 'Service Equipment' },
      { name: 'Video Marketing Platform', price: 7200, category: 'Marketing' },
      { name: 'Loaner Car Management', price: 5500, category: 'Operations' },
      { name: 'Compliance Management System', price: 11000, category: 'Compliance' },
    ],
    opportunities: ['DMS Implementation', 'Equipment Upgrade', 'Facility Expansion', 'Multi-Store Rollout', 'Service Department Modernization', 'Digital Retailing Platform', 'Fixed Ops Optimization', 'Parts Department Upgrade', 'Customer Experience Enhancement', 'F&I Technology Upgrade', 'Body Shop Equipment', 'Mobile Service Launch', 'Marketing Automation', 'Fleet Management Contract', 'Data Analytics Initiative'],
    tasks: ['Schedule dealership tour', 'Prepare equipment quote', 'Send ROI calculator', 'Conduct needs assessment', 'Arrange demo drive', 'Prepare financing options', 'Send case studies', 'Schedule manager meetings', 'Prepare competitive analysis', 'Send implementation timeline', 'Review current processes', 'Arrange reference calls', 'Prepare training plan', 'Send pricing proposal', 'Coordinate vendor introductions'],
  },
  HOSPITALITY: {
    companies: ['Grand Hotel Group', 'Restaurant Management Co', 'Boutique Stays Inc', 'Event Venues LLC', 'Catering Services Pro', 'Luxury Resort Properties', 'Quick Service Restaurants', 'Bar & Lounge Management', 'Conference Centers Inc', 'Vacation Rental Network', 'Country Club Services', 'Spa & Wellness Resorts', 'Food Service Management', 'Hotel Chain Operations', 'Entertainment Venues Group'],
    contacts: ['Hotel Manager Patricia Wilson', 'Restaurant Owner Carlos Martinez', 'Events Director Amanda Lee', 'GM Robert Taylor', 'Chef Michael Brown', 'Resort Director Jennifer Garcia', 'Operations VP Thomas Anderson', 'F&B Manager Susan White', 'Director Lisa Thompson', 'Regional Manager Kevin Moore', 'Owner David Harris', 'VP Hospitality Rachel Martin', 'General Manager James Lee', 'Catering Director Michelle Clark', 'Property Manager Christopher Rodriguez'],
    jobTitles: ['General Manager', 'Hotel Manager', 'Restaurant Owner', 'Events Director', 'Operations Manager', 'Director of Operations', 'Food & Beverage Manager', 'Resort Manager', 'Regional Director', 'Executive Chef', 'Revenue Manager', 'Guest Services Manager', 'Catering Manager', 'Property Director', 'VP of Hospitality'],
    products: [
      { name: 'Hotel Management System', price: 30000, category: 'Software' },
      { name: 'POS System', price: 12000, category: 'Hardware' },
      { name: 'Reservation Platform', price: 8000, category: 'Software' },
      { name: 'Revenue Management System', price: 22000, category: 'Revenue' },
      { name: 'Guest Experience Platform', price: 15000, category: 'Guest Services' },
      { name: 'Table Management System', price: 6500, category: 'Restaurant' },
      { name: 'Event Management Software', price: 18000, category: 'Events' },
      { name: 'Housekeeping Management', price: 9500, category: 'Operations' },
      { name: 'Channel Management System', price: 11000, category: 'Distribution' },
      { name: 'Kitchen Display System', price: 7800, category: 'Kitchen' },
      { name: 'Spa Management Software', price: 10500, category: 'Spa' },
      { name: 'Mobile Guest App', price: 13000, category: 'Mobile' },
      { name: 'Inventory Management', price: 8500, category: 'F&B' },
      { name: 'Guest WiFi & Analytics', price: 12500, category: 'Technology' },
      { name: 'Loyalty Program Platform', price: 16000, category: 'Marketing' },
    ],
    opportunities: ['PMS Upgrade', 'Restaurant POS System', 'Event Booking Platform', 'Multi-Property Deployment', 'Revenue Management System', 'Digital Transformation', 'Guest Experience Enhancement', 'Channel Manager Implementation', 'Kitchen Technology Upgrade', 'Mobile Check-in Solution', 'Spa Management System', 'F&B Operations Optimization', 'Property Renovation Tech', 'Loyalty Program Launch', 'Enterprise Integration'],
    tasks: ['Schedule property walkthrough', 'Send demo credentials', 'Prepare implementation plan', 'Conduct site survey', 'Arrange system demo', 'Prepare ROI analysis', 'Send integration requirements', 'Schedule manager presentation', 'Prepare training schedule', 'Review current workflows', 'Send case studies', 'Coordinate pilot program', 'Prepare pricing proposal', 'Arrange reference calls', 'Review technical requirements'],
  },
  FITNESS_WELLNESS: {
    companies: ['Elite Fitness Center', 'Yoga Studio Pro', 'Personal Training Inc', 'Wellness Spa Group', 'CrossFit Performance', 'Pilates Studio Network', 'Boxing & Martial Arts Gym', 'Athletic Performance Center', 'Wellness & Recovery Spa', 'Boutique Fitness Clubs', 'Corporate Wellness Solutions', 'Physical Therapy Centers', 'Nutrition Coaching Co', 'Mind-Body Wellness Studios', 'Group Fitness Franchise'],
    contacts: ['Owner Jennifer Adams', 'Head Trainer Mike Johnson', 'Studio Manager Sarah Lee', 'Wellness Director Lisa White', 'Coach Ryan Martinez', 'Director Amanda Clark', 'Owner Robert Wilson', 'Operations Manager Kevin Brown', 'Wellness VP Patricia Moore', 'Franchise Owner David Anderson', 'Program Director Michelle Taylor', 'Facility Manager Thomas Garcia', 'PT Director Dr. Susan Harris', 'Regional Manager Christopher Lewis', 'GM Jessica Thompson'],
    jobTitles: ['Gym Owner', 'Fitness Director', 'Studio Manager', 'Head Trainer', 'Wellness Coordinator', 'General Manager', 'Operations Director', 'Franchise Owner', 'Wellness Program Director', 'Athletic Director', 'Physical Therapy Director', 'Regional Manager', 'Facility Manager', 'Membership Director', 'VP of Operations'],
    products: [
      { name: 'Gym Management Software', price: 8000, category: 'Software' },
      { name: 'Fitness Equipment Package', price: 25000, category: 'Equipment' },
      { name: 'Member App Solution', price: 6000, category: 'Mobile' },
      { name: 'Class Scheduling System', price: 5500, category: 'Scheduling' },
      { name: 'Member Check-in System', price: 4200, category: 'Access Control' },
      { name: 'Personal Training Software', price: 6800, category: 'Training' },
      { name: 'Nutrition Tracking App', price: 4500, category: 'Wellness' },
      { name: 'Billing & Payment Platform', price: 7200, category: 'Payments' },
      { name: 'Virtual Training Platform', price: 9500, category: 'Digital' },
      { name: 'Body Composition Analysis', price: 12000, category: 'Assessment' },
      { name: 'Group Training Equipment', price: 18000, category: 'Equipment' },
      { name: 'Spa Management System', price: 8500, category: 'Spa' },
      { name: 'Member Engagement Platform', price: 10500, category: 'Marketing' },
      { name: 'Performance Tracking Tools', price: 7800, category: 'Analytics' },
      { name: 'Franchise Management System', price: 15000, category: 'Multi-Location' },
    ],
    opportunities: ['Studio Software Upgrade', 'Equipment Financing', 'App Development', 'Multi-Location Rollout', 'Digital Transformation', 'Member Experience Platform', 'Equipment Refresh', 'Virtual Training Launch', 'Corporate Wellness Program', 'Franchise Technology Stack', 'Billing System Upgrade', 'Performance Center Build-out', 'Wellness Platform Integration', 'Member App Enhancement', 'Facility Expansion Technology'],
    tasks: ['Schedule gym tour', 'Send equipment catalog', 'Prepare membership analysis', 'Conduct facility assessment', 'Arrange software demo', 'Send financing options', 'Prepare ROI calculator', 'Schedule owner meeting', 'Send case studies', 'Review current operations', 'Prepare implementation plan', 'Coordinate equipment demo', 'Send member engagement report', 'Arrange reference calls', 'Prepare training schedule'],
  },
  CONSTRUCTION: {
    companies: ['BuildRight Construction', 'Commercial Builders Inc', 'Renovation Experts LLC', 'Infrastructure Solutions', 'Green Building Co', 'Residential Construction Group', 'Heavy Civil Contractors', 'General Contracting Services', 'Specialty Trades Inc', 'Design-Build Partners', 'Industrial Construction Co', 'Concrete & Foundation Experts', 'MEP Contractors', 'Commercial Roofing Systems', 'Site Development Services'],
    contacts: ['Project Manager Tom Anderson', 'Owner David Wilson', 'Estimator Jennifer Lee', 'Foreman Carlos Rodriguez', 'Safety Director Lisa Brown', 'VP Construction Robert Martinez', 'Operations Manager Susan White', 'Superintendent Michael Thompson', 'Preconstruction Director Patricia Garcia', 'Regional Manager Kevin Moore', 'Controller Amanda Harris', 'Business Development VP James Taylor', 'Chief Estimator Christopher Clark', 'Quality Manager Rachel Lewis', 'Field Operations Director Daniel Walker'],
    jobTitles: ['Project Manager', 'Construction Manager', 'Estimator', 'Site Superintendent', 'Operations Director', 'VP of Construction', 'Preconstruction Manager', 'Field Superintendent', 'Business Development Manager', 'Chief Estimator', 'Project Executive', 'Safety Director', 'General Superintendent', 'Regional Director', 'Operations VP'],
    products: [
      { name: 'Project Management Software', price: 15000, category: 'Software' },
      { name: 'Heavy Equipment', price: 85000, category: 'Equipment' },
      { name: 'Safety Training Program', price: 5000, category: 'Training' },
      { name: 'Estimating & Bidding Software', price: 12000, category: 'Preconstruction' },
      { name: 'Field Productivity Tools', price: 8500, category: 'Field Management' },
      { name: 'Document Management System', price: 9000, category: 'Documentation' },
      { name: 'Equipment Tracking System', price: 7500, category: 'Asset Management' },
      { name: 'Scheduling Software', price: 10500, category: 'Planning' },
      { name: 'Time & Material Tracking', price: 6800, category: 'Labor Management' },
      { name: 'Quality Control Platform', price: 8200, category: 'Quality' },
      { name: 'Subcontractor Management', price: 9500, category: 'Subcontractors' },
      { name: 'BIM Coordination Software', price: 18000, category: 'Design' },
      { name: 'Mobile Inspection Tools', price: 5500, category: 'Inspection' },
      { name: 'Equipment Rental Management', price: 11000, category: 'Equipment' },
      { name: 'Financial Management System', price: 16000, category: 'Accounting' },
    ],
    opportunities: ['Equipment Purchase', 'Software Implementation', 'Safety Program', 'Enterprise Software Upgrade', 'Fleet Management System', 'Digital Transformation', 'Multi-Project Platform', 'BIM Implementation', 'Field Technology Rollout', 'Equipment Financing Deal', 'Estimating Software Upgrade', 'Subcontractor Portal', 'Quality Management System', 'Mobile Solutions Deployment', 'Financial System Integration'],
    tasks: ['Schedule site visit', 'Prepare bid proposal', 'Send equipment specs', 'Conduct needs assessment', 'Arrange software demo', 'Prepare ROI analysis', 'Send implementation timeline', 'Review current processes', 'Coordinate stakeholder meetings', 'Prepare financing options', 'Send case studies', 'Schedule equipment demo', 'Prepare training plan', 'Review safety requirements', 'Arrange reference calls'],
  },
  ECOMMERCE: {
    companies: ['Online Retail Pro', 'Ecommerce Solutions Inc', 'Direct-to-Consumer Brands', 'Marketplace Sellers LLC', 'Digital Commerce Co', 'Multi-Channel Merchants', 'Dropshipping Network', 'Subscription Box Services', 'B2B Ecommerce Platform', 'Fashion Retail Online', 'Electronics Marketplace', 'Home Goods Direct', 'Beauty & Cosmetics Online', 'Food & Beverage Ecommerce', 'Amazon FBA Business'],
    contacts: ['Ecommerce Director Amy Chen', 'Marketing Manager Brian White', 'Owner Jessica Taylor', 'Operations Lead Mike Davis', 'Growth Manager Sarah Kim', 'CEO Jennifer Martinez', 'COO Robert Anderson', 'VP Digital Commerce Lisa Thompson', 'Marketing Director Kevin Wilson', 'Operations VP Susan Garcia', 'Growth Director Thomas Moore', 'Product Manager Amanda Harris', 'Director Christopher Lee', 'Fulfillment Manager Patricia Brown', 'Merchandising Director Daniel Clark'],
    jobTitles: ['Ecommerce Director', 'Digital Marketing Manager', 'Operations Manager', 'Growth Lead', 'Marketplace Manager', 'VP of Ecommerce', 'Chief Digital Officer', 'Online Merchandising Manager', 'Fulfillment Director', 'Customer Experience Manager', 'Performance Marketing Director', 'Supply Chain Manager', 'Conversion Optimization Lead', 'Marketplace Operations Manager', 'Ecommerce Strategy Director'],
    products: [
      { name: 'Ecommerce Platform', price: 35000, category: 'Software' },
      { name: 'Marketing Automation Suite', price: 18000, category: 'Marketing' },
      { name: 'Inventory Management System', price: 12000, category: 'Operations' },
      { name: 'Order Management System', price: 22000, category: 'Order Processing' },
      { name: 'Customer Data Platform', price: 28000, category: 'Customer Intelligence' },
      { name: 'Personalization Engine', price: 25000, category: 'CX' },
      { name: 'Multi-Channel Integration', price: 16000, category: 'Integrations' },
      { name: 'Warehouse Management System', price: 30000, category: 'Fulfillment' },
      { name: 'Analytics & BI Platform', price: 19000, category: 'Analytics' },
      { name: 'Email Marketing Platform', price: 9500, category: 'Email' },
      { name: 'Product Information Management', price: 15000, category: 'PIM' },
      { name: 'Customer Service Platform', price: 14000, category: 'Support' },
      { name: 'Returns Management System', price: 11000, category: 'Reverse Logistics' },
      { name: 'Subscription Management', price: 17000, category: 'Subscriptions' },
      { name: 'Search & Merchandising Tool', price: 13500, category: 'Site Search' },
    ],
    opportunities: ['Platform Migration', 'Marketing Suite Implementation', 'Fulfillment Integration', 'Multi-Channel Expansion', 'Customer Experience Upgrade', 'International Expansion', 'Subscription Model Launch', 'Marketplace Integration', 'B2B Commerce Launch', 'Omnichannel Strategy', 'Personalization Initiative', 'Mobile Commerce Optimization', 'Data Analytics Platform', 'Warehouse Automation', 'Customer Loyalty Program'],
    tasks: ['Schedule platform demo', 'Send migration proposal', 'Prepare ROI analysis', 'Review current tech stack', 'Conduct platform assessment', 'Prepare integration plan', 'Send case studies', 'Arrange stakeholder presentation', 'Prepare data migration plan', 'Review performance metrics', 'Send pricing proposal', 'Coordinate technical review', 'Prepare implementation roadmap', 'Review security requirements', 'Arrange reference calls'],
  },
  INSURANCE: {
    companies: ['Premier Insurance Group', 'Risk Management Solutions', 'Life & Health Advisors', 'Commercial Insurance Co', 'Independent Agents Network', 'Property & Casualty Brokers', 'Employee Benefits Group', 'Specialty Insurance Underwriters', 'Reinsurance Solutions', 'Insurance Technology Co', 'Workers Comp Specialists', 'Auto Insurance Agency', 'Captive Insurance Managers', 'Surplus Lines Brokers', 'Insurance Wholesalers Inc'],
    contacts: ['Agent Director Robert Thompson', 'Underwriter Maria Garcia', 'Broker Lisa Anderson', 'Claims Manager John Wilson', 'Agency Owner David Lee', 'Regional VP Jennifer Martinez', 'Underwriting Director Michael Brown', 'President Susan White', 'VP Operations Thomas Moore', 'Chief Underwriter Patricia Harris', 'Claims Director Kevin Taylor', 'Agency Principal Amanda Clark', 'Risk Manager Christopher Wilson', 'Compliance Director Rachel Lewis', 'Business Development VP Daniel Garcia'],
    jobTitles: ['Agency Owner', 'Insurance Broker', 'Underwriting Manager', 'Claims Director', 'Risk Advisor', 'Regional Vice President', 'Chief Underwriting Officer', 'Agency Principal', 'VP of Sales', 'Claims Operations Manager', 'Producer', 'Account Executive', 'Underwriter', 'Risk Management Director', 'Compliance Officer'],
    products: [
      { name: 'Agency Management System', price: 20000, category: 'Software' },
      { name: 'CRM for Insurance', price: 15000, category: 'CRM' },
      { name: 'Claims Processing Software', price: 25000, category: 'Operations' },
      { name: 'Policy Administration System', price: 35000, category: 'Policy Management' },
      { name: 'Underwriting Workbench', price: 28000, category: 'Underwriting' },
      { name: 'Document Management System', price: 12000, category: 'Documents' },
      { name: 'Rating & Quote Engine', price: 18000, category: 'Rating' },
      { name: 'Commission Management', price: 14000, category: 'Accounting' },
      { name: 'Customer Portal Platform', price: 16000, category: 'Customer Service' },
      { name: 'Risk Assessment Tools', price: 22000, category: 'Risk Management' },
      { name: 'Compliance & Licensing', price: 9500, category: 'Compliance' },
      { name: 'Analytics & Reporting Suite', price: 19000, category: 'Business Intelligence' },
      { name: 'Mobile Agent App', price: 11000, category: 'Mobile' },
      { name: 'Workflow Automation', price: 13500, category: 'Automation' },
      { name: 'Data Integration Platform', price: 17000, category: 'Integration' },
    ],
    opportunities: ['AMS Implementation', 'CRM Upgrade', 'Digital Transformation', 'Policy Admin System Replacement', 'Underwriting Platform Modernization', 'Claims System Upgrade', 'Multi-Location Deployment', 'Customer Portal Launch', 'Agency Network Rollout', 'Data Analytics Initiative', 'Mobile Solution Deployment', 'Cloud Migration Project', 'Compliance System Implementation', 'Integration Platform', 'Workflow Automation Project'],
    tasks: ['Schedule system demo', 'Send compliance docs', 'Prepare cost-benefit analysis', 'Conduct needs assessment', 'Review current systems', 'Prepare integration plan', 'Send case studies', 'Arrange stakeholder meetings', 'Prepare implementation timeline', 'Review regulatory requirements', 'Send pricing proposal', 'Coordinate data migration plan', 'Prepare training schedule', 'Arrange reference calls', 'Review security and compliance'],
  },
  SOLAR_ENERGY: {
    companies: ['SolarTech Solutions', 'Green Energy Systems', 'Renewable Power Co', 'Solar Installation Pros', 'Clean Energy Group', 'Commercial Solar Contractors', 'Residential Solar Experts', 'Community Solar Projects', 'Solar Farm Developers', 'Energy Storage Specialists', 'Solar EPC Company', 'Rooftop Solar Installers', 'Solar Equipment Distributors', 'Renewable Energy Advisors', 'Solar Financing Solutions'],
    contacts: ['CEO Jennifer Green', 'Sales Director Mike Anderson', 'Project Manager Lisa Martinez', 'Engineer Tom Wilson', 'Operations Lead Sarah Chen', 'VP Solar Development Robert Garcia', 'Installation Manager David Brown', 'Business Development Director Amanda White', 'Engineering Manager Kevin Thompson', 'Regional Manager Susan Moore', 'Project Director Christopher Harris', 'Operations VP Patricia Taylor', 'Sales Manager Michael Clark', 'Energy Analyst Rachel Lewis', 'Finance Director Daniel Rodriguez'],
    jobTitles: ['CEO', 'Sales Director', 'Project Manager', 'Solar Engineer', 'Installation Manager', 'VP of Solar Development', 'Director of Operations', 'Business Development Manager', 'Engineering Director', 'Project Director', 'Regional Manager', 'Installation Supervisor', 'Energy Consultant', 'Finance Manager', 'Technical Director'],
    products: [
      { name: 'Solar Panel System', price: 45000, category: 'Equipment' },
      { name: 'Energy Storage Solution', price: 25000, category: 'Batteries' },
      { name: 'Monitoring Software', price: 3000, category: 'Software' },
      { name: 'Commercial Solar Installation', price: 250000, category: 'Commercial' },
      { name: 'Residential Solar Package', price: 35000, category: 'Residential' },
      { name: 'Solar Inverter System', price: 12000, category: 'Equipment' },
      { name: 'EV Charging Integration', price: 18000, category: 'EV Charging' },
      { name: 'Solar Racking System', price: 8500, category: 'Mounting' },
      { name: 'Energy Management System', price: 15000, category: 'Software' },
      { name: 'Microinverter System', price: 14000, category: 'Equipment' },
      { name: 'Battery Backup System', price: 22000, category: 'Storage' },
      { name: 'Solar Panel Maintenance', price: 2500, category: 'Maintenance' },
      { name: 'Solar Design & Engineering', price: 7500, category: 'Services' },
      { name: 'Grid-Tie System', price: 38000, category: 'Systems' },
      { name: 'Off-Grid Solar Solution', price: 55000, category: 'Off-Grid' },
    ],
    opportunities: ['Commercial Solar Installation', 'Residential Project', 'Energy Storage', 'Community Solar Development', 'Solar Farm Project', 'Multi-Site Commercial Installation', 'Battery Storage Integration', 'Solar + Storage Hybrid', 'Municipal Solar Program', 'Industrial Solar Project', 'Solar Financing Deal', 'EV Charging + Solar', 'Microgrid Development', 'Portfolio Solar Upgrade', 'Agricultural Solar Installation'],
    tasks: ['Schedule site assessment', 'Prepare energy analysis', 'Send financing options', 'Conduct shading analysis', 'Prepare system design', 'Send incentive information', 'Review utility requirements', 'Coordinate engineering review', 'Prepare permit documents', 'Send proposal and pricing', 'Schedule stakeholder meeting', 'Conduct site survey', 'Prepare ROI calculator', 'Review interconnection requirements', 'Send case studies and references'],
  },
  GENERAL: {
    companies: ['ABC Corporation', 'XYZ Enterprises', 'Global Solutions Inc', 'Business Services Co', 'Professional Consulting Group', 'Strategic Advisors LLC', 'Business Growth Partners', 'Management Solutions Inc', 'Enterprise Consulting Group', 'Innovation Labs', 'Professional Services Firm', 'Business Development Co', 'Strategy & Operations Group', 'Corporate Solutions Inc', 'Advisory Partners International'],
    contacts: ['Manager John Doe', 'Director Jane Smith', 'Owner Bob Johnson', 'VP Mary Williams', 'Executive Tom Brown', 'President Sarah Davis', 'COO Michael Wilson', 'Director Robert Martinez', 'VP Jennifer Anderson', 'Partner Kevin Taylor', 'Executive Director Lisa Moore', 'Managing Director Christopher Garcia', 'Operations Manager Amanda Thompson', 'Business Owner David Harris', 'Strategic Advisor Patricia White'],
    jobTitles: ['General Manager', 'Business Director', 'Owner', 'VP Operations', 'Executive Director', 'President', 'Chief Operating Officer', 'Managing Partner', 'Senior Director', 'Vice President', 'Business Owner', 'Operations Director', 'Strategic Advisor', 'Managing Director', 'Chief Executive Officer'],
    products: [
      { name: 'Professional Services Package', price: 10000, category: 'Services' },
      { name: 'Consulting Services', price: 15000, category: 'Consulting' },
      { name: 'Business Solutions', price: 20000, category: 'Solutions' },
      { name: 'Strategic Planning Package', price: 25000, category: 'Strategy' },
      { name: 'Management Consulting', price: 35000, category: 'Consulting' },
      { name: 'Business Process Improvement', price: 18000, category: 'Process Optimization' },
      { name: 'Technology Consulting', price: 28000, category: 'IT Consulting' },
      { name: 'Change Management Services', price: 22000, category: 'Change Management' },
      { name: 'Project Management Office Setup', price: 30000, category: 'PMO' },
      { name: 'Business Analytics Services', price: 16000, category: 'Analytics' },
      { name: 'Operational Excellence Program', price: 32000, category: 'Operations' },
      { name: 'Digital Transformation Consulting', price: 45000, category: 'Digital' },
      { name: 'Training & Development Program', price: 12000, category: 'Training' },
      { name: 'Risk Management Consulting', price: 19000, category: 'Risk' },
      { name: 'M&A Advisory Services', price: 50000, category: 'M&A' },
    ],
    opportunities: ['Service Agreement', 'Consulting Project', 'Annual Contract', 'Strategic Advisory Engagement', 'Business Transformation Project', 'Multi-Year Partnership', 'Process Improvement Initiative', 'Technology Implementation', 'Organizational Change Program', 'Executive Advisory Services', 'Performance Optimization', 'Digital Strategy Engagement', 'Training & Development Program', 'Risk Assessment Project', 'M&A Transaction Support'],
    tasks: ['Schedule meeting', 'Send proposal', 'Follow up on quote', 'Conduct discovery call', 'Prepare statement of work', 'Send case studies', 'Schedule executive presentation', 'Prepare needs assessment', 'Send pricing options', 'Review project requirements', 'Coordinate stakeholder interviews', 'Prepare engagement letter', 'Send capability presentation', 'Arrange reference calls', 'Finalize contract terms'],
  },
};

export async function POST(req: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { sector, count = 10 } = await req.json();

    if (!sector || !SECTOR_DATA[sector as keyof typeof SECTOR_DATA]) {
      return NextResponse.json(
        { error: 'Invalid sector. Must be one of: ' + Object.keys(SECTOR_DATA).join(', ') },
        { status: 400 }
      );
    }

    const sectorData = SECTOR_DATA[sector as keyof typeof SECTOR_DATA];
    const created = {
      clients: [] as any[],
      campaigns: [] as any[],
      leads: [] as any[],
      contacts: [] as any[],
      opportunities: [] as any[],
      tasks: [] as any[],
      products: [] as any[],
      activities: [] as any[],
      emails: [] as any[],
      workflows: [] as any[],
    };

    // 1. Create Clients
    for (let i = 0; i < Math.min(count, sectorData.companies.length); i++) {
      const client = await prisma.clientCompany.create({
        data: {
          name: sectorData.companies[i],
          industry: sector,
          website: `https://www.${sectorData.companies[i].toLowerCase().replace(/\s/g, '')}.com`,
          contactName: sectorData.contacts[i % sectorData.contacts.length],
          contactEmail: `${sectorData.contacts[i % sectorData.contacts.length].toLowerCase().replace(/\s/g, '.')}@${sectorData.companies[i].toLowerCase().replace(/\s/g, '')}.com`,
          contactPhone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          notes: `${sector} client - ${sectorData.companies[i]}`,
        },
      });
      created.clients.push(client);
    }

    // 2. Create Products (after clients are created)
    for (let i = 0; i < sectorData.products.length; i++) {
      const prod = sectorData.products[i];
      const product = await prisma.product.create({
        data: {
          clientId: created.clients[i % created.clients.length].id,
          name: prod.name,
          description: `${prod.name} for ${sector} businesses`,
          category: prod.category,
          unitPrice: prod.price,
          isActive: true,
        },
      });
      created.products.push(product);
    }

    // 3. Create Campaigns
    const campaignTypes: Array<'EMAIL' | 'LINKEDIN' | 'COLD_CALL' | 'PAID_ADS' | 'MULTI_CHANNEL'> =
      ['EMAIL', 'LINKEDIN', 'COLD_CALL', 'PAID_ADS', 'MULTI_CHANNEL'];

    for (let i = 0; i < Math.min(3, count); i++) {
      const campaign = await prisma.campaign.create({
        data: {
          clientId: created.clients[i % created.clients.length].id,
          name: `${sector} ${['Q1', 'Q2', 'Q3', 'Q4'][i % 4]} Campaign`,
          status: ['ACTIVE', 'DRAFT', 'COMPLETED'][i % 3] as any,
          channel: campaignTypes[i % campaignTypes.length],
          targetPersona: sectorData.jobTitles[0],
          targetRegions: 'North America, United States, California',
          startDate: new Date(Date.now() - i * 30 * 24 * 60 * 60 * 1000),
          endDate: new Date(Date.now() + (30 - i * 10) * 24 * 60 * 60 * 1000),
          ownerId: session.user.id,
        },
      });
      created.campaigns.push(campaign);
    }

    // 4. Create Leads
    for (let i = 0; i < count; i++) {
      const companyIndex = i % sectorData.companies.length;
      const contactIndex = i % sectorData.contacts.length;

      const lead = await prisma.lead.create({
        data: {
          clientId: created.clients[companyIndex].id,
          fullName: sectorData.contacts[contactIndex],
          email: `${sectorData.contacts[contactIndex].toLowerCase().replace(/\s/g, '.')}${i}@${sectorData.companies[companyIndex].toLowerCase().replace(/\s/g, '')}.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          company: sectorData.companies[companyIndex],
          title: sectorData.jobTitles[i % sectorData.jobTitles.length],
          status: ['NEW', 'CONTACTED', 'QUALIFIED', 'UNQUALIFIED'][i % 4] as any,
          leadSource: ['AGENCY', 'CLIENT_SUBMITTED', 'IMPORTED', 'MANUAL'][i % 4] as any,
          qualificationScore: Math.floor(Math.random() * 50) + 50,
          submittedBy: session.user.id,
          campaignId: created.campaigns[i % created.campaigns.length]?.id,
        },
      });
      created.leads.push(lead);
    }

    // 5. Create Contacts
    for (let i = 0; i < count; i++) {
      const companyIndex = i % sectorData.companies.length;
      const contactIndex = i % sectorData.contacts.length;

      const contact = await prisma.contact.create({
        data: {
          clientId: created.clients[companyIndex].id,
          firstName: sectorData.contacts[contactIndex].split(' ')[0],
          lastName: sectorData.contacts[contactIndex].split(' ')[1] || 'Doe',
          email: `${sectorData.contacts[contactIndex].toLowerCase().replace(/\s/g, '.')}@${sectorData.companies[companyIndex].toLowerCase().replace(/\s/g, '')}.com`,
          phone: `+1-555-${String(Math.floor(Math.random() * 9000) + 1000)}`,
          title: sectorData.jobTitles[i % sectorData.jobTitles.length],
          department: ['Executive', 'Operations', 'IT', 'Finance'][i % 4],
          isPrimary: i % 5 === 0,
          ownerId: session.user.id,
        },
      });
      created.contacts.push(contact);
    }

    // 6. Create Opportunities
    for (let i = 0; i < Math.min(count, sectorData.opportunities.length * 2); i++) {
      const oppIndex = i % sectorData.opportunities.length;
      const opportunity = await prisma.opportunity.create({
        data: {
          clientId: created.clients[i % created.clients.length].id,
          contactId: created.contacts[i % created.contacts.length]?.id,
          name: `${sectorData.opportunities[oppIndex]} - ${sectorData.companies[i % sectorData.companies.length]}`,
          stage: ['PROSPECTING', 'QUALIFICATION', 'PROPOSAL', 'NEGOTIATION', 'CLOSED_WON'][i % 5] as any,
          amount: sectorData.products[i % sectorData.products.length].price * (1 + Math.random()),
          probability: [10, 25, 50, 75, 90][i % 5],
          expectedCloseDate: new Date(Date.now() + (30 + i * 10) * 24 * 60 * 60 * 1000),
          description: `${sector} opportunity for ${sectorData.opportunities[oppIndex]}`,
          ownerId: session.user.id,
        },
      });
      created.opportunities.push(opportunity);

      // Create line items
      const product = created.products[i % created.products.length];
      const quantity = Math.floor(Math.random() * 5) + 1;
      const discount = Math.floor(Math.random() * 20);
      const totalPrice = product.unitPrice * quantity * (1 - discount / 100);

      await prisma.opportunityLineItem.create({
        data: {
          opportunityId: opportunity.id,
          productId: product.id,
          productName: product.name,
          quantity,
          unitPrice: product.unitPrice,
          discount,
          totalPrice,
        },
      });
    }

    // 7. Create Tasks
    for (let i = 0; i < count * 2; i++) {
      const taskIndex = i % sectorData.tasks.length;
      const task = await prisma.task.create({
        data: {
          subject: sectorData.tasks[taskIndex],
          description: `${sectorData.tasks[taskIndex]} for ${sectorData.companies[i % sectorData.companies.length]}`,
          status: ['NOT_STARTED', 'IN_PROGRESS', 'COMPLETED'][i % 3] as any,
          priority: ['LOW', 'MEDIUM', 'HIGH', 'URGENT'][i % 4] as any,
          dueDate: new Date(Date.now() + (i * 2) * 24 * 60 * 60 * 1000),
          assignedTo: session.user.id,
          createdBy: session.user.id,
          opportunityId: created.opportunities[i % created.opportunities.length]?.id,
        },
      });
      created.tasks.push(task);
    }

    // 8. Create Activities
    const activityTypes: Array<'EMAIL' | 'CALL' | 'LINKEDIN' | 'MEETING' | 'NOTE'> =
      ['EMAIL', 'CALL', 'LINKEDIN', 'MEETING', 'NOTE'];

    for (let i = 0; i < count * 3; i++) {
      const activity = await prisma.leadActivity.create({
        data: {
          leadId: created.leads[i % created.leads.length].id,
          type: activityTypes[i % activityTypes.length],
          content: `${activityTypes[i % activityTypes.length]} activity for ${created.leads[i % created.leads.length].company}`,
          userId: session.user.id,
        },
      });
      created.activities.push(activity);
    }

    // 9. Create Email Templates & Emails
    const template = await prisma.emailTemplate.create({
      data: {
        name: `${sector} Outreach Template`,
        subject: `Exclusive {{product}} Solution for ${sector}`,
        body: `<p>Hi {{firstName}},</p><p>I noticed {{company}} is in the ${sector} industry. We have a specialized {{product}} that can help.</p>`,
        category: sector,
      },
    });

    for (let i = 0; i < Math.min(count, 5); i++) {
      const email = await prisma.email.create({
        data: {
          senderId: session.user.id,
          toAddress: created.contacts[i % created.contacts.length].email,
          subject: `${sectorData.products[i % sectorData.products.length].name} for ${sector}`,
          body: `<p>Hi ${created.contacts[i % created.contacts.length].firstName},</p><p>I wanted to reach out about our ${sectorData.products[i % sectorData.products.length].name}.</p>`,
          status: ['SENT', 'DELIVERED', 'OPENED'][i % 3] as any,
          sentAt: new Date(Date.now() - i * 24 * 60 * 60 * 1000),
          templateId: template.id,
          contactId: created.contacts[i % created.contacts.length].id,
        },
      });
      created.emails.push(email);
    }

    // 10. Create Workflows
    for (let i = 0; i < 2; i++) {
      const workflow = await prisma.workflowRule.create({
        data: {
          name: `${sector} Lead ${['Qualification', 'Nurture'][i]} Workflow`,
          description: `Automated workflow for ${sector} lead ${['qualification', 'nurturing'][i]}`,
          objectType: 'Lead',
          triggerType: ['field_update', 'record_created'][i],
          conditions: {
            sector: sector,
            status: i === 0 ? 'NEW' : 'CONTACTED',
          },
          actions: [
            {
              type: i === 0 ? 'update_field' : 'send_email',
              field: i === 0 ? 'status' : undefined,
              value: i === 0 ? 'CONTACTED' : undefined,
              template: i === 1 ? template.id : undefined,
            },
            {
              type: 'create_task',
              subject: `Follow up on ${sector} lead`,
              priority: 'HIGH',
              dueInDays: 2,
            },
          ],
          isActive: true,
          priority: i,
        },
      });
      created.workflows.push(workflow);
    }

    return NextResponse.json({
      success: true,
      sector,
      count,
      created: {
        clients: created.clients.length,
        campaigns: created.campaigns.length,
        leads: created.leads.length,
        contacts: created.contacts.length,
        opportunities: created.opportunities.length,
        tasks: created.tasks.length,
        products: created.products.length,
        activities: created.activities.length,
        emails: created.emails.length,
        workflows: created.workflows.length,
      },
    });
  } catch (error: any) {
    console.error('Seed error:', error);
    return NextResponse.json(
      { error: 'Failed to seed data', details: error.message },
      { status: 500 }
    );
  }
}
