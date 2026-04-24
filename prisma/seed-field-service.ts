import { prisma } from '../lib/prisma';
import crypto from 'crypto';

export async function seedFieldServiceAndPhase2() {
  console.log('\n🔧 Seeding Field Service + Phase 2 CRM features...');

  const admin = await prisma.user.findFirst({ where: { role: 'ADMIN' } });
  if (!admin) { console.log('⚠️ No admin user found.'); return; }

  const clients = await prisma.clientCompany.findMany({ take: 5 });
  const contacts = await prisma.contact.findMany({ take: 20 });

  // ============ FIELD SERVICE ============

  console.log('  Creating Operating Hours...');
  const opHoursData = [
    { name: 'Standard Business Hours', timezone: 'America/Los_Angeles', mondayStart: '08:00', mondayEnd: '17:00', tuesdayStart: '08:00', tuesdayEnd: '17:00', wednesdayStart: '08:00', wednesdayEnd: '17:00', thursdayStart: '08:00', thursdayEnd: '17:00', fridayStart: '08:00', fridayEnd: '17:00', saturdayStart: '09:00', saturdayEnd: '13:00', status: 'ACTIVE' },
    { name: 'Extended Hours', timezone: 'America/New_York', mondayStart: '07:00', mondayEnd: '19:00', tuesdayStart: '07:00', tuesdayEnd: '19:00', wednesdayStart: '07:00', wednesdayEnd: '19:00', thursdayStart: '07:00', thursdayEnd: '19:00', fridayStart: '07:00', fridayEnd: '19:00', saturdayStart: '08:00', saturdayEnd: '16:00', sundayStart: '10:00', sundayEnd: '14:00', status: 'ACTIVE' },
    { name: 'Night Shift', timezone: 'America/Chicago', mondayStart: '18:00', mondayEnd: '06:00', tuesdayStart: '18:00', tuesdayEnd: '06:00', wednesdayStart: '18:00', wednesdayEnd: '06:00', thursdayStart: '18:00', thursdayEnd: '06:00', fridayStart: '18:00', fridayEnd: '06:00', status: 'ACTIVE' },
    { name: 'Weekend Only', timezone: 'America/Denver', saturdayStart: '08:00', saturdayEnd: '18:00', sundayStart: '08:00', sundayEnd: '18:00', status: 'ACTIVE' },
    { name: 'Early Bird Hours', timezone: 'America/Los_Angeles', mondayStart: '06:00', mondayEnd: '14:00', tuesdayStart: '06:00', tuesdayEnd: '14:00', wednesdayStart: '06:00', wednesdayEnd: '14:00', thursdayStart: '06:00', thursdayEnd: '14:00', fridayStart: '06:00', fridayEnd: '14:00', status: 'ACTIVE' },
    { name: 'Midday Hours', timezone: 'America/New_York', mondayStart: '10:00', mondayEnd: '18:00', tuesdayStart: '10:00', tuesdayEnd: '18:00', wednesdayStart: '10:00', wednesdayEnd: '18:00', thursdayStart: '10:00', thursdayEnd: '18:00', fridayStart: '10:00', fridayEnd: '18:00', status: 'ACTIVE' },
    { name: 'Emergency 24/7', timezone: 'America/Chicago', mondayStart: '00:00', mondayEnd: '23:59', tuesdayStart: '00:00', tuesdayEnd: '23:59', wednesdayStart: '00:00', wednesdayEnd: '23:59', thursdayStart: '00:00', thursdayEnd: '23:59', fridayStart: '00:00', fridayEnd: '23:59', saturdayStart: '00:00', saturdayEnd: '23:59', sundayStart: '00:00', sundayEnd: '23:59', status: 'ACTIVE' },
    { name: 'Half Day AM', timezone: 'America/Denver', mondayStart: '08:00', mondayEnd: '12:00', tuesdayStart: '08:00', tuesdayEnd: '12:00', wednesdayStart: '08:00', wednesdayEnd: '12:00', thursdayStart: '08:00', thursdayEnd: '12:00', fridayStart: '08:00', fridayEnd: '12:00', status: 'ACTIVE' },
    { name: 'Half Day PM', timezone: 'America/Los_Angeles', mondayStart: '13:00', mondayEnd: '17:00', tuesdayStart: '13:00', tuesdayEnd: '17:00', wednesdayStart: '13:00', wednesdayEnd: '17:00', thursdayStart: '13:00', thursdayEnd: '17:00', fridayStart: '13:00', fridayEnd: '17:00', status: 'ACTIVE' },
    { name: 'Flex Schedule A', timezone: 'America/New_York', mondayStart: '07:00', mondayEnd: '15:00', tuesdayStart: '09:00', tuesdayEnd: '17:00', wednesdayStart: '07:00', wednesdayEnd: '15:00', thursdayStart: '09:00', thursdayEnd: '17:00', fridayStart: '07:00', fridayEnd: '13:00', status: 'ACTIVE' },
    { name: 'Flex Schedule B', timezone: 'America/Chicago', mondayStart: '10:00', mondayEnd: '19:00', tuesdayStart: '10:00', tuesdayEnd: '19:00', wednesdayStart: '10:00', wednesdayEnd: '19:00', thursdayStart: '10:00', thursdayEnd: '19:00', fridayStart: '10:00', fridayEnd: '16:00', status: 'ACTIVE' },
    { name: 'Rotating Schedule', timezone: 'America/Denver', mondayStart: '06:00', mondayEnd: '18:00', wednesdayStart: '06:00', wednesdayEnd: '18:00', fridayStart: '06:00', fridayEnd: '18:00', status: 'ACTIVE' },
    { name: 'Limited Weekend', timezone: 'America/Los_Angeles', mondayStart: '09:00', mondayEnd: '17:00', tuesdayStart: '09:00', tuesdayEnd: '17:00', wednesdayStart: '09:00', wednesdayEnd: '17:00', thursdayStart: '09:00', thursdayEnd: '17:00', fridayStart: '09:00', fridayEnd: '17:00', saturdayStart: '10:00', saturdayEnd: '14:00', status: 'ACTIVE' },
    { name: 'Compressed Week', timezone: 'America/New_York', mondayStart: '07:00', mondayEnd: '17:30', tuesdayStart: '07:00', tuesdayEnd: '17:30', wednesdayStart: '07:00', wednesdayEnd: '17:30', thursdayStart: '07:00', thursdayEnd: '17:30', status: 'ACTIVE' },
    { name: 'Inactive Legacy Hours', timezone: 'America/Chicago', mondayStart: '09:00', mondayEnd: '17:00', tuesdayStart: '09:00', tuesdayEnd: '17:00', wednesdayStart: '09:00', wednesdayEnd: '17:00', thursdayStart: '09:00', thursdayEnd: '17:00', fridayStart: '09:00', fridayEnd: '17:00', status: 'INACTIVE' },
  ];
  for (const oh of opHoursData) {
    await prisma.operatingHours.create({ data: oh });
  }

  console.log('  Creating Service Territories...');
  const territories = [];
  const territoryData = [
    { name: 'West Region', type: 'PRIMARY', city: 'Los Angeles', state: 'CA', country: 'US', latitude: 34.0522, longitude: -118.2437 },
    { name: 'East Region', type: 'PRIMARY', city: 'New York', state: 'NY', country: 'US', latitude: 40.7128, longitude: -74.006 },
    { name: 'Central Region', type: 'PRIMARY', city: 'Chicago', state: 'IL', country: 'US', latitude: 41.8781, longitude: -87.6298 },
    { name: 'South Region', type: 'SECONDARY', city: 'Houston', state: 'TX', country: 'US', latitude: 29.7604, longitude: -95.3698 },
    { name: 'Northwest Region', type: 'SECONDARY', city: 'Seattle', state: 'WA', country: 'US', latitude: 47.6062, longitude: -122.3321 },
    { name: 'Southeast Region', type: 'PRIMARY', city: 'Atlanta', state: 'GA', country: 'US', latitude: 33.749, longitude: -84.388 },
    { name: 'Southwest Region', type: 'PRIMARY', city: 'Phoenix', state: 'AZ', country: 'US', latitude: 33.4484, longitude: -112.074 },
    { name: 'Northeast Region', type: 'SECONDARY', city: 'Boston', state: 'MA', country: 'US', latitude: 42.3601, longitude: -71.0589 },
    { name: 'Midwest Region', type: 'PRIMARY', city: 'Minneapolis', state: 'MN', country: 'US', latitude: 44.9778, longitude: -93.265 },
    { name: 'Mountain Region', type: 'SECONDARY', city: 'Denver', state: 'CO', country: 'US', latitude: 39.7392, longitude: -104.9903 },
    { name: 'Pacific Northwest', type: 'SECONDARY', city: 'Portland', state: 'OR', country: 'US', latitude: 45.5152, longitude: -122.6784 },
    { name: 'Gulf Coast Region', type: 'PRIMARY', city: 'New Orleans', state: 'LA', country: 'US', latitude: 29.9511, longitude: -90.0715 },
    { name: 'Great Lakes Region', type: 'SECONDARY', city: 'Detroit', state: 'MI', country: 'US', latitude: 42.3314, longitude: -83.0458 },
    { name: 'Mid-Atlantic Region', type: 'PRIMARY', city: 'Philadelphia', state: 'PA', country: 'US', latitude: 39.9526, longitude: -75.1652 },
    { name: 'Bay Area Region', type: 'PRIMARY', city: 'San Francisco', state: 'CA', country: 'US', latitude: 37.7749, longitude: -122.4194 },
  ];
  for (const t of territoryData) {
    territories.push(await prisma.serviceTerritory.create({ data: { ...t, isActive: true } }));
  }

  console.log('  Creating Skills...');
  const skills = [];
  const skillData = [
    { name: 'HVAC Repair', skillType: 'TECHNICAL' },
    { name: 'Electrical Wiring', skillType: 'TECHNICAL' },
    { name: 'Plumbing', skillType: 'TECHNICAL' },
    { name: 'Solar Panel Installation', skillType: 'CERTIFICATION' },
    { name: 'Safety Certification', skillType: 'CERTIFICATION' },
    { name: 'Spanish', skillType: 'LANGUAGE' },
    { name: 'Network Installation', skillType: 'TECHNICAL' },
    { name: 'Appliance Repair', skillType: 'TECHNICAL' },
    { name: 'Welding', skillType: 'TECHNICAL' },
    { name: 'Carpentry', skillType: 'TECHNICAL' },
    { name: 'Roofing', skillType: 'TECHNICAL' },
    { name: 'Fire Alarm Systems', skillType: 'CERTIFICATION' },
    { name: 'Mandarin', skillType: 'LANGUAGE' },
    { name: 'Generator Repair', skillType: 'TECHNICAL' },
    { name: 'Smart Home Systems', skillType: 'TECHNICAL' },
    { name: 'EPA 608 Certification', skillType: 'CERTIFICATION' },
  ];
  for (const s of skillData) {
    skills.push(await prisma.skill.create({ data: { ...s, isActive: true } }));
  }

  console.log('  Creating Service Resources...');
  const resources = [];
  const resourceData = [
    { name: 'Mike Johnson', resourceType: 'TECHNICIAN', email: 'mike.j@field.com', phone: '555-1001', efficiencyRating: 4.5, travelSpeed: 30, maxTravelDistance: 50 },
    { name: 'Sarah Davis', resourceType: 'TECHNICIAN', email: 'sarah.d@field.com', phone: '555-1002', efficiencyRating: 4.8, travelSpeed: 35, maxTravelDistance: 60 },
    { name: 'Carlos Rivera', resourceType: 'TECHNICIAN', email: 'carlos.r@field.com', phone: '555-1003', efficiencyRating: 4.2, travelSpeed: 25, maxTravelDistance: 40 },
    { name: 'James Wilson', resourceType: 'TECHNICIAN', email: 'james.w@field.com', phone: '555-1004', efficiencyRating: 3.9, travelSpeed: 30, maxTravelDistance: 45 },
    { name: 'Emily Park', resourceType: 'DISPATCHER', email: 'emily.p@field.com', phone: '555-1005', efficiencyRating: 4.7, travelSpeed: 0, maxTravelDistance: 0 },
    { name: 'Tom Brown', resourceType: 'TECHNICIAN', email: 'tom.b@field.com', phone: '555-1006', efficiencyRating: 4.0, travelSpeed: 28, maxTravelDistance: 55 },
    { name: 'Lisa Chen', resourceType: 'TECHNICIAN', email: 'lisa.c@field.com', phone: '555-1007', efficiencyRating: 4.6, travelSpeed: 32, maxTravelDistance: 50 },
    { name: 'Robert Taylor', resourceType: 'TECHNICIAN', email: 'robert.t@field.com', phone: '555-1008', efficiencyRating: 4.1, travelSpeed: 28, maxTravelDistance: 45 },
    { name: 'Amanda Martinez', resourceType: 'TECHNICIAN', email: 'amanda.m@field.com', phone: '555-1009', efficiencyRating: 3.8, travelSpeed: 30, maxTravelDistance: 40 },
    { name: 'Kevin Lee', resourceType: 'DISPATCHER', email: 'kevin.l@field.com', phone: '555-1010', efficiencyRating: 4.3, travelSpeed: 0, maxTravelDistance: 0 },
    { name: 'Jennifer White', resourceType: 'TECHNICIAN', email: 'jennifer.w@field.com', phone: '555-1011', efficiencyRating: 4.4, travelSpeed: 33, maxTravelDistance: 55 },
    { name: 'David Kim', resourceType: 'TECHNICIAN', email: 'david.k@field.com', phone: '555-1012', efficiencyRating: 4.9, travelSpeed: 35, maxTravelDistance: 65 },
    { name: 'Rachel Green', resourceType: 'TECHNICIAN', email: 'rachel.g@field.com', phone: '555-1013', efficiencyRating: 4.0, travelSpeed: 27, maxTravelDistance: 42 },
    { name: 'Chris Anderson', resourceType: 'TECHNICIAN', email: 'chris.a@field.com', phone: '555-1014', efficiencyRating: 3.7, travelSpeed: 30, maxTravelDistance: 48 },
    { name: 'Maria Garcia', resourceType: 'DISPATCHER', email: 'maria.g@field.com', phone: '555-1015', efficiencyRating: 4.5, travelSpeed: 0, maxTravelDistance: 0 },
    { name: 'Steve Harris', resourceType: 'TECHNICIAN', email: 'steve.h@field.com', phone: '555-1016', efficiencyRating: 4.2, travelSpeed: 29, maxTravelDistance: 50 },
  ];
  for (let i = 0; i < resourceData.length; i++) {
    resources.push(await prisma.serviceResource.create({ data: { ...resourceData[i], isActive: true, territoryId: territories[i % territories.length].id } }));
  }

  console.log('  Creating Resource Skills...');
  const skillLevels = ['BEGINNER', 'INTERMEDIATE', 'ADVANCED', 'EXPERT'];
  for (let i = 0; i < resources.length; i++) {
    const numSkills = 2 + (i % 3);
    for (let j = 0; j < numSkills; j++) {
      await prisma.serviceResourceSkill.create({ data: { resourceId: resources[i].id, skillId: skills[(i + j) % skills.length].id, skillLevel: skillLevels[(i + j) % skillLevels.length] } });
    }
  }

  console.log('  Creating Territory Members...');
  for (let i = 0; i < resources.length; i++) {
    await prisma.territoryMember.create({ data: { resourceId: resources[i].id, territoryId: territories[i % territories.length].id, membershipType: i < 8 ? 'PRIMARY' : 'SECONDARY' } });
  }

  console.log('  Creating Service Crews...');
  const crewData = [
    { name: 'Alpha Team', crewSize: 3, specialization: 'HVAC & Electrical' },
    { name: 'Beta Team', crewSize: 2, specialization: 'Plumbing & General' },
    { name: 'Gamma Team', crewSize: 4, specialization: 'Solar Installation' },
    { name: 'Delta Team', crewSize: 3, specialization: 'Network & Smart Home' },
    { name: 'Epsilon Team', crewSize: 2, specialization: 'Emergency Repairs' },
    { name: 'Zeta Team', crewSize: 3, specialization: 'Roofing & Carpentry' },
    { name: 'Eta Team', crewSize: 2, specialization: 'Appliance Repair' },
    { name: 'Theta Team', crewSize: 4, specialization: 'Commercial Services' },
    { name: 'Iota Team', crewSize: 3, specialization: 'Residential Maintenance' },
    { name: 'Kappa Team', crewSize: 2, specialization: 'Fire Safety Systems' },
    { name: 'Lambda Team', crewSize: 3, specialization: 'Generator & Power' },
    { name: 'Mu Team', crewSize: 2, specialization: 'Welding & Fabrication' },
    { name: 'Nu Team', crewSize: 4, specialization: 'Full Service' },
    { name: 'Xi Team', crewSize: 3, specialization: 'Industrial Systems' },
    { name: 'Omicron Team', crewSize: 2, specialization: 'Quality Assurance' },
  ];
  for (let i = 0; i < crewData.length; i++) {
    await prisma.serviceCrew.create({ data: { ...crewData[i], leadId: resources[i % resources.length].id, territoryId: territories[i % territories.length].id } });
  }

  console.log('  Creating Resource Absences...');
  const absenceTypes = ['VACATION', 'SICK', 'PERSONAL', 'TRAINING'] as const;
  for (let i = 0; i < 16; i++) {
    const start = new Date(); start.setDate(start.getDate() + (i * 5) - 10);
    const end = new Date(start); end.setDate(end.getDate() + (i % 3 === 0 ? 3 : 1));
    await prisma.resourceAbsence.create({ data: { resourceId: resources[i % resources.length].id, type: absenceTypes[i % absenceTypes.length], startTime: start, endTime: end, description: `${absenceTypes[i % absenceTypes.length]} leave - ${['Annual', 'Medical', 'Family', 'Skills', 'Conference', 'Holiday', 'Emergency', 'Jury Duty', 'Bereavement', 'Military', 'Sabbatical', 'Volunteer', 'Relocation', 'Wellness', 'Comp Day', 'Personal'][i]}` } });
  }

  console.log('  Creating Work Types...');
  const workTypes = [];
  const workTypeData = [
    { name: 'HVAC Installation', estimatedDurationMinutes: 180, skillRequirement: 'HVAC Repair', blockTimeBefore: 15, blockTimeAfter: 15 },
    { name: 'Electrical Inspection', estimatedDurationMinutes: 60, skillRequirement: 'Electrical Wiring', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Plumbing Repair', estimatedDurationMinutes: 120, skillRequirement: 'Plumbing', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Solar Panel Setup', estimatedDurationMinutes: 240, skillRequirement: 'Solar Panel Installation', blockTimeBefore: 30, blockTimeAfter: 15 },
    { name: 'General Maintenance', estimatedDurationMinutes: 90, blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Emergency Repair', estimatedDurationMinutes: 60, blockTimeBefore: 0, blockTimeAfter: 10 },
    { name: 'Appliance Installation', estimatedDurationMinutes: 120, skillRequirement: 'Appliance Repair', blockTimeBefore: 15, blockTimeAfter: 10 },
    { name: 'Network Cabling', estimatedDurationMinutes: 150, skillRequirement: 'Network Installation', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Fire Alarm Inspection', estimatedDurationMinutes: 90, skillRequirement: 'Fire Alarm Systems', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Roof Repair', estimatedDurationMinutes: 240, skillRequirement: 'Roofing', blockTimeBefore: 20, blockTimeAfter: 15 },
    { name: 'Generator Service', estimatedDurationMinutes: 120, skillRequirement: 'Generator Repair', blockTimeBefore: 15, blockTimeAfter: 10 },
    { name: 'Smart Home Setup', estimatedDurationMinutes: 180, skillRequirement: 'Smart Home Systems', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Welding Job', estimatedDurationMinutes: 150, skillRequirement: 'Welding', blockTimeBefore: 20, blockTimeAfter: 15 },
    { name: 'Carpentry Work', estimatedDurationMinutes: 180, skillRequirement: 'Carpentry', blockTimeBefore: 15, blockTimeAfter: 10 },
    { name: 'Safety Audit', estimatedDurationMinutes: 120, skillRequirement: 'Safety Certification', blockTimeBefore: 10, blockTimeAfter: 10 },
    { name: 'Water Heater Install', estimatedDurationMinutes: 150, skillRequirement: 'Plumbing', blockTimeBefore: 15, blockTimeAfter: 15 },
  ];
  for (const wt of workTypeData) {
    workTypes.push(await prisma.workType.create({ data: wt }));
  }

  console.log('  Creating Work Orders...');
  const workOrders = [];
  const woStatuses = ['NEW', 'PENDING', 'OPEN', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
  const woPriorities = ['LOW', 'MEDIUM', 'HIGH', 'CRITICAL', 'EMERGENCY'] as const;
  const woSubjects = [
    'AC Unit Not Cooling', 'Install New Furnace', 'Fix Leaking Pipe', 'Annual HVAC Maintenance',
    'Electrical Panel Upgrade', 'Solar Panel Inspection', 'Emergency Water Heater Repair',
    'Install Smart Thermostat', 'Replace Roof Fan', 'Plumbing Inspection', 'Rewire Kitchen',
    'Fix Broken AC Compressor', 'New Ductwork Installation', 'Bathroom Plumbing Overhaul',
    'Commercial HVAC Service', 'Generator Maintenance Check', 'Fire Alarm System Install',
    'Network Wiring Office', 'Smart Lock Installation', 'Roof Leak Emergency Repair',
  ];
  const cities = ['Los Angeles', 'New York', 'Chicago', 'Houston', 'Seattle', 'Atlanta', 'Phoenix', 'Boston', 'Minneapolis', 'Denver'];
  const statesArr = ['CA', 'NY', 'IL', 'TX', 'WA', 'GA', 'AZ', 'MA', 'MN', 'CO'];
  for (let i = 0; i < woSubjects.length; i++) {
    workOrders.push(await prisma.workOrder.create({
      data: {
        workOrderNumber: `WO-${String(i + 1).padStart(6, '0')}`, subject: woSubjects[i],
        accountId: clients.length > 0 ? clients[i % clients.length].id : undefined,
        contactName: `Contact ${i + 1}`, contactPhone: `555-${String(2000 + i)}`, contactEmail: `wo-contact${i + 1}@example.com`,
        territoryId: territories[i % territories.length].id, workTypeId: workTypes[i % workTypes.length].id,
        priority: woPriorities[i % woPriorities.length], status: woStatuses[i % woStatuses.length],
        address: `${100 + i * 10} Main Street`, city: cities[i % 10], state: statesArr[i % 10],
      },
    }));
  }

  console.log('  Creating Work Order Line Items...');
  for (let i = 0; i < 20; i++) {
    await prisma.workOrderLineItem.create({
      data: {
        workOrderId: workOrders[i % workOrders.length].id, lineItemNumber: i + 1,
        description: ['Parts replacement', 'Labor charge', 'Diagnostic fee', 'Material cost', 'Travel surcharge', 'Emergency premium', 'Warranty labor', 'Installation fee', 'Inspection charge', 'Cleanup fee', 'Permit fee', 'Equipment rental', 'Disposal fee', 'Subcontractor', 'Overtime labor', 'Rush delivery', 'Extended warranty', 'Training fee', 'Documentation', 'Follow-up visit'][i],
        workTypeId: workTypes[i % workTypes.length].id,
        status: ['NEW', 'IN_PROGRESS', 'COMPLETED'][i % 3],
        durationMinutes: 30 + (i * 15),
      },
    });
  }

  console.log('  Creating Service Appointments...');
  const saStatuses = ['SCHEDULED', 'DISPATCHED', 'IN_PROGRESS', 'COMPLETED', 'CANCELLED'] as const;
  for (let i = 0; i < 20; i++) {
    const start = new Date(); start.setDate(start.getDate() + i - 8); start.setHours(8 + (i % 8), 0, 0, 0);
    const end = new Date(start); end.setMinutes(end.getMinutes() + workTypes[i % workTypes.length].estimatedDurationMinutes);
    await prisma.serviceAppointment.create({
      data: {
        appointmentNumber: `SA-${String(i + 1).padStart(6, '0')}`,
        workOrderId: workOrders[i % workOrders.length].id,
        subject: `Appt: ${workOrders[i % workOrders.length].subject}`,
        status: saStatuses[i % saStatuses.length],
        scheduledStart: start, scheduledEnd: end,
        durationMinutes: workTypes[i % workTypes.length].estimatedDurationMinutes,
        resourceId: resources[i % resources.length].id,
        territoryId: territories[i % territories.length].id,
        city: cities[i % 10], state: statesArr[i % 10],
      },
    });
  }

  console.log('  Creating Shifts...');
  const slotTypes = ['NORMAL', 'EXTENDED', 'ON_CALL', 'BREAK'] as const;
  for (let i = 0; i < 16; i++) {
    const start = new Date(); start.setDate(start.getDate() + (i % 7) - 2); start.setHours([6, 8, 10, 14][i % 4], 0, 0, 0);
    const end = new Date(start); end.setHours(end.getHours() + [8, 9, 8, 4][i % 4]);
    await prisma.shift.create({
      data: {
        territoryId: territories[i % territories.length].id,
        label: `${['Early Morning', 'Morning', 'Midday', 'Afternoon', 'Evening', 'Night', 'Full Day', 'On-Call', 'Weekend AM', 'Weekend PM', 'Holiday', 'Emergency', 'Training', 'Overlap', 'Split', 'Flex'][i]} Shift`,
        startTime: start, endTime: end,
        timeSlotType: slotTypes[i % slotTypes.length],
        resourceId: resources[i % resources.length].id,
        status: i < 13 ? 'CONFIRMED' : 'CANCELLED',
      },
    });
  }

  console.log('  Creating Time Sheets...');
  const timeSheets = [];
  const tsStatuses = ['NEW', 'SUBMITTED', 'APPROVED', 'REJECTED'] as const;
  for (let i = 0; i < 16; i++) {
    const sd = new Date(); sd.setDate(sd.getDate() - (i * 7));
    const ed = new Date(sd); ed.setDate(ed.getDate() + 5);
    timeSheets.push(await prisma.timeSheet.create({
      data: {
        resourceId: resources[i % resources.length].id,
        startDate: sd, endDate: ed,
        totalHours: 30 + (i * 2.5),
        status: tsStatuses[i % tsStatuses.length],
      },
    }));
  }

  console.log('  Creating Time Sheet Entries...');
  for (let i = 0; i < 20; i++) {
    const start = new Date(); start.setDate(start.getDate() - (i % 14)); start.setHours(7 + (i % 5), 0, 0, 0);
    const end = new Date(start); end.setHours(end.getHours() + 2 + (i % 4));
    await prisma.timeSheetEntry.create({
      data: {
        timeSheetId: timeSheets[i % timeSheets.length].id,
        resourceId: resources[i % resources.length].id,
        workOrderId: workOrders[i % workOrders.length].id,
        type: ['WORK', 'TRAVEL', 'BREAK'][i % 3],
        startTime: start, endTime: end,
        durationHours: 2 + (i % 4),
        description: `${['On-site repair work', 'Travel to customer', 'Lunch break', 'Diagnostics', 'Parts pickup', 'Documentation', 'Team meeting', 'Training session', 'Equipment check', 'Safety inspection', 'Follow-up call', 'Inventory', 'Report writing', 'Client consultation', 'Vehicle maintenance', 'Tool calibration', 'Quality review', 'Route planning', 'Material staging', 'Post-job cleanup'][i]}`,
      },
    });
  }

  console.log('  Creating Field Service Assets...');
  const fsAssets = [];
  const assetNames = [
    'HVAC Unit A', 'Solar Panel Array B', 'Water Heater C', 'Electrical Panel D',
    'Thermostat E', 'Ductwork F', 'Generator G', 'Air Handler H',
    'Boiler System I', 'Heat Pump J', 'Exhaust Fan K', 'Fire Alarm Panel L',
    'UPS System M', 'Compressor Unit N', 'Furnace O', 'Cooling Tower P',
  ];
  const productNames = [
    'HVAC System', 'Solar Panel', 'Water Heater', 'Electrical Panel',
    'Smart Thermostat', 'Ductwork', 'Backup Generator', 'Air Handler Unit',
    'Industrial Boiler', 'Heat Pump', 'Exhaust Fan', 'Fire Alarm System',
    'UPS Battery', 'AC Compressor', 'Gas Furnace', 'Cooling Tower',
  ];
  for (let i = 0; i < assetNames.length; i++) {
    const installDate = new Date(); installDate.setFullYear(installDate.getFullYear() - (1 + i % 5));
    const warrantyEnd = new Date(installDate); warrantyEnd.setFullYear(warrantyEnd.getFullYear() + 3);
    fsAssets.push(await prisma.fieldServiceAsset.create({
      data: {
        name: assetNames[i],
        serialNumber: `SN-${String(1000 + i).padStart(6, '0')}`,
        accountName: clients[i % clients.length]?.name || `Account ${i}`,
        productName: productNames[i],
        installDate, warrantyEnd,
        territoryId: territories[i % territories.length].id,
        address: `${200 + i * 10} Service Rd`,
        lastServiceDate: new Date(Date.now() - i * 15 * 24 * 60 * 60 * 1000),
      },
    }));
  }

  console.log('  Creating Maintenance Plans...');
  const frequencies = ['MONTHLY', 'QUARTERLY', 'SEMI_ANNUALLY', 'ANNUALLY'] as const;
  for (let i = 0; i < 16; i++) {
    const nextDate = new Date(); nextDate.setMonth(nextDate.getMonth() + 1 + (i % 6));
    await prisma.maintenancePlan.create({
      data: {
        title: `Maintenance: ${fsAssets[i % fsAssets.length].name}`,
        workTypeId: workTypes[i % workTypes.length].id,
        assetId: fsAssets[i % fsAssets.length].id,
        frequency: frequencies[i % frequencies.length],
        nextSuggestedDate: nextDate,
        territoryId: territories[i % territories.length].id,
      },
    });
  }

  console.log('  Creating Scheduling Policies...');
  const policyData = [
    { name: 'Standard Policy', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 50, territoryPreference: 'PRIMARY', maxTravelDistance: 50, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'Emergency Policy', policyType: 'EMERGENCY', travelTimeOptimization: false, skillMatching: true, priorityWeight: 100, territoryPreference: 'ANY', maxTravelDistance: 100, sameDayPolicy: 'REQUIRE', emergencyOverride: true },
    { name: 'Cost Optimized', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: false, priorityWeight: 30, territoryPreference: 'PRIMARY', maxTravelDistance: 30, sameDayPolicy: 'AVOID', emergencyOverride: false },
    { name: 'Skill Priority', policyType: 'STANDARD', travelTimeOptimization: false, skillMatching: true, priorityWeight: 80, territoryPreference: 'ANY', maxTravelDistance: 75, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'Weekend Special', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 60, territoryPreference: 'PRIMARY', maxTravelDistance: 40, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'High Priority Rush', policyType: 'EMERGENCY', travelTimeOptimization: false, skillMatching: true, priorityWeight: 95, territoryPreference: 'ANY', maxTravelDistance: 120, sameDayPolicy: 'REQUIRE', emergencyOverride: true },
    { name: 'Balanced Approach', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 50, territoryPreference: 'PRIMARY', maxTravelDistance: 60, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'Minimal Travel', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: false, priorityWeight: 20, territoryPreference: 'PRIMARY', maxTravelDistance: 15, sameDayPolicy: 'AVOID', emergencyOverride: false },
    { name: 'After Hours', policyType: 'EMERGENCY', travelTimeOptimization: false, skillMatching: true, priorityWeight: 70, territoryPreference: 'ANY', maxTravelDistance: 80, sameDayPolicy: 'REQUIRE', emergencyOverride: true },
    { name: 'New Customer First', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 85, territoryPreference: 'PRIMARY', maxTravelDistance: 55, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'Preventive Maintenance', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 40, territoryPreference: 'PRIMARY', maxTravelDistance: 45, sameDayPolicy: 'AVOID', emergencyOverride: false },
    { name: 'VIP Customer', policyType: 'EMERGENCY', travelTimeOptimization: false, skillMatching: true, priorityWeight: 100, territoryPreference: 'ANY', maxTravelDistance: 150, sameDayPolicy: 'REQUIRE', emergencyOverride: true },
    { name: 'Training Mode', policyType: 'STANDARD', travelTimeOptimization: false, skillMatching: false, priorityWeight: 10, territoryPreference: 'PRIMARY', maxTravelDistance: 20, sameDayPolicy: 'AVOID', emergencyOverride: false },
    { name: 'Eco-Friendly Route', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 45, territoryPreference: 'PRIMARY', maxTravelDistance: 25, sameDayPolicy: 'PREFER', emergencyOverride: false },
    { name: 'Multi-Stop Efficient', policyType: 'STANDARD', travelTimeOptimization: true, skillMatching: true, priorityWeight: 55, territoryPreference: 'ANY', maxTravelDistance: 70, sameDayPolicy: 'PREFER', emergencyOverride: false },
  ];
  for (const p of policyData) {
    await prisma.schedulingPolicy.create({ data: p });
  }

  // ============ PHASE 2: SALES ============

  console.log('  Creating Sales Cadences...');
  const cadenceData = [
    { name: 'New Lead Outreach', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 5 },
    { name: 'Follow-Up Sequence', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 3 },
    { name: 'Renewal Reminder', status: 'DRAFT', type: 'OUTBOUND', totalSteps: 4 },
    { name: 'Enterprise Onboarding', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 6 },
    { name: 'Win-Back Campaign', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 4 },
    { name: 'Referral Request', status: 'DRAFT', type: 'OUTBOUND', totalSteps: 3 },
    { name: 'Upsell Sequence', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 5 },
    { name: 'Cold Outreach LinkedIn', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 4 },
    { name: 'Event Follow-Up', status: 'DRAFT', type: 'OUTBOUND', totalSteps: 3 },
    { name: 'Trial Conversion', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 5 },
    { name: 'Re-engagement Series', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 4 },
    { name: 'Partner Introduction', status: 'DRAFT', type: 'OUTBOUND', totalSteps: 3 },
    { name: 'Quarterly Check-In', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 2 },
    { name: 'Product Launch Outreach', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 5 },
    { name: 'Contract Renewal Push', status: 'ACTIVE', type: 'OUTBOUND', totalSteps: 4 },
  ];
  const stepTypes = ['EMAIL', 'CALL', 'LINKEDIN', 'WAIT', 'EMAIL'];
  for (const cd of cadenceData) {
    const cadence = await prisma.salesCadence.create({ data: cd });
    for (let s = 0; s < cd.totalSteps; s++) {
      await prisma.salesCadenceStep.create({ data: { cadenceId: cadence.id, stepOrder: s + 1, stepType: stepTypes[s % stepTypes.length], subject: `Step ${s + 1}: ${stepTypes[s % stepTypes.length]}`, body: `Template for step ${s + 1}`, waitDays: s === 0 ? 0 : 2 + s } });
    }
  }

  console.log('  Creating Conversation Insights...');
  const sentiments = ['POSITIVE', 'NEUTRAL', 'NEGATIVE'];
  const insightTopics = [
    ['pricing', 'timeline', 'features'],
    ['budget', 'competitors', 'integration'],
    ['support', 'training', 'onboarding'],
    ['security', 'compliance', 'data'],
    ['scalability', 'performance', 'reliability'],
    ['customization', 'APIs', 'documentation'],
  ];
  for (let i = 0; i < 16; i++) {
    await prisma.conversationInsight.create({
      data: {
        objectType: ['CALL', 'MEETING', 'EMAIL'][i % 3],
        objectId: `obj-${i + 1}`,
        transcript: [
          'Customer discussed pricing and asked about volume discounts.',
          'Meeting focused on implementation timeline and resource requirements.',
          'Email follow-up regarding product features and comparison with competitors.',
          'Discussion about integration capabilities with existing systems.',
          'Customer raised concerns about data security and compliance.',
          'Reviewed onboarding process and training schedules.',
          'Talked about scalability for growing team of 50+ users.',
          'Customer shared positive feedback about demo experience.',
          'Negotiation on contract terms and payment schedule.',
          'Technical deep-dive on API capabilities and webhook support.',
          'Customer wants to understand SLA guarantees.',
          'Discussed migration plan from legacy system.',
          'Budget review meeting with CFO and procurement team.',
          'Stakeholder alignment call with VP of Operations.',
          'Quarterly business review with key metrics discussion.',
          'Customer requested case studies from similar industry.',
        ][i],
        sentiment: sentiments[i % 3],
        keyTopics: insightTopics[i % insightTopics.length],
        actionItems: [
          ['Follow up on proposal', 'Send pricing sheet'],
          ['Schedule demo', 'Send case study'],
          ['Prepare ROI analysis', 'Connect with tech team'],
          ['Send security docs', 'Arrange compliance call'],
        ][i % 4],
        aiSummary: `AI Summary: ${sentiments[i % 3].toLowerCase()} interaction about ${insightTopics[i % insightTopics.length].join(', ')}.`,
      },
    });
  }

  // ============ PHASE 2: SERVICE ============

  console.log('  Creating Einstein Bots...');
  const bots = [];
  const botData = [
    { name: 'Support Assistant', status: 'ACTIVE', welcomeMessage: 'Hello! How can I help you today?', channels: ['WEB', 'FACEBOOK'] },
    { name: 'Sales Helper', status: 'DRAFT', welcomeMessage: 'Looking for product info? I can help!', channels: ['WEB'] },
    { name: 'Order Tracker', status: 'ACTIVE', welcomeMessage: 'Track your order status here.', channels: ['WEB', 'WHATSAPP'] },
    { name: 'FAQ Bot', status: 'ACTIVE', welcomeMessage: 'I can answer common questions!', channels: ['WEB'] },
    { name: 'Appointment Scheduler', status: 'ACTIVE', welcomeMessage: 'Let me help you book an appointment.', channels: ['WEB', 'SMS'] },
    { name: 'Billing Assistant', status: 'DRAFT', welcomeMessage: 'Need help with billing? I\'m here!', channels: ['WEB'] },
    { name: 'Onboarding Guide', status: 'ACTIVE', welcomeMessage: 'Welcome! Let me show you around.', channels: ['WEB'] },
    { name: 'Feedback Collector', status: 'ACTIVE', welcomeMessage: 'We\'d love your feedback!', channels: ['WEB', 'EMAIL'] },
    { name: 'Returns Handler', status: 'ACTIVE', welcomeMessage: 'Need to return or exchange? I can help.', channels: ['WEB'] },
    { name: 'Tech Support Bot', status: 'ACTIVE', welcomeMessage: 'Having technical issues? Let\'s troubleshoot.', channels: ['WEB', 'SLACK'] },
    { name: 'Lead Qualifier', status: 'DRAFT', welcomeMessage: 'Tell me about your needs.', channels: ['WEB'] },
    { name: 'Survey Bot', status: 'ACTIVE', welcomeMessage: 'Quick survey - 2 minutes!', channels: ['WEB', 'SMS'] },
    { name: 'Event Registration Bot', status: 'ACTIVE', welcomeMessage: 'Register for our upcoming events!', channels: ['WEB'] },
    { name: 'Knowledge Base Bot', status: 'ACTIVE', welcomeMessage: 'Search our knowledge base.', channels: ['WEB', 'SLACK'] },
    { name: 'Escalation Bot', status: 'ACTIVE', welcomeMessage: 'I\'ll connect you with the right team.', channels: ['WEB'] },
  ];
  for (const bd of botData) {
    const bot = await prisma.einsteinBot.create({ data: bd });
    bots.push(bot);
    await prisma.botDialog.create({ data: { botId: bot.id, triggerType: 'KEYWORD', triggers: ['help', 'support'], responses: ['I can help!', 'Let me look into that.'] } });
    await prisma.botDialog.create({ data: { botId: bot.id, triggerType: 'INTENT', triggers: ['greeting'], responses: ['Hello!', 'Hi there!'] } });
  }

  console.log('  Creating Social Posts...');
  const socialPlatforms = ['TWITTER', 'FACEBOOK', 'INSTAGRAM', 'LINKEDIN'];
  const socialContents = [
    'Great service! Very impressed with the team.',
    'Issue with my order #12345, need help ASAP.',
    'Love the new features in the latest update!',
    'When will customer support respond? Been waiting 2 hours.',
    'Amazing quality product, highly recommend!',
    'Need help with my account settings.',
    'Fantastic team, resolved my issue in minutes.',
    'Disappointed with the shipping delay.',
    'Best customer experience I\'ve ever had!',
    'Can someone help me reset my password?',
    'The new dashboard is beautiful and functional.',
    'Had a terrible experience with the return process.',
    'Shoutout to agent Sarah for outstanding help!',
    'Why is the mobile app so slow today?',
    'Just signed up and love it already!',
    'Product arrived damaged, need replacement.',
  ];
  for (let i = 0; i < 16; i++) {
    await prisma.socialPost.create({
      data: {
        platform: socialPlatforms[i % 4],
        authorName: `User_${['JSmith', 'AMartinez', 'BWilson', 'CDavis', 'EJohnson', 'FBrown', 'GTaylor', 'HLee', 'IClark', 'JWright', 'KHall', 'LAllen', 'MKing', 'NScott', 'OAdams', 'PBaker'][i]}`,
        content: socialContents[i],
        sentiment: sentiments[i % 3],
        status: ['NEW', 'RESPONDED', 'ESCALATED', 'CLOSED'][i % 4],
        response: i % 2 === 0 ? 'Thank you for your feedback! We appreciate hearing from you.' : null,
      },
    });
  }

  console.log('  Creating Messaging Conversations...');
  const msgChannels = ['SMS', 'WHATSAPP', 'FACEBOOK_MESSENGER'];
  const msgContents = [
    ['Hi, I need help with my order', 'Sure, let me look into that for you!', 'Order #12345 was placed 3 days ago', 'I can see it\'s in transit, expected delivery tomorrow.'],
    ['When is my appointment?', 'Let me check your schedule.', 'It\'s on Tuesday at 2 PM', 'Great, thank you!'],
    ['I want to cancel my subscription', 'I\'m sorry to hear that. Can I ask why?', 'Too expensive for my needs', 'Let me see what options we have for you.'],
    ['Is there a discount available?', 'Yes! We have a 20% off promotion right now.', 'How do I apply it?', 'I\'ll send you the promo code.'],
  ];
  for (let i = 0; i < 16; i++) {
    const convo = await prisma.messagingConversation.create({
      data: {
        channel: msgChannels[i % 3],
        contactId: contacts.length > 0 ? contacts[i % contacts.length]?.id || null : null,
        phoneNumber: `+1555${String(3000 + i).padStart(4, '0')}`,
        status: i % 5 === 4 ? 'CLOSED' : 'ACTIVE',
      },
    });
    const convoMsgs = msgContents[i % msgContents.length];
    for (let m = 0; m < convoMsgs.length; m++) {
      await prisma.messagingMessage.create({
        data: {
          conversationId: convo.id,
          direction: m % 2 === 0 ? 'INBOUND' : 'OUTBOUND',
          content: convoMsgs[m],
          status: 'DELIVERED',
        },
      });
    }
  }

  console.log('  Creating Case Milestones...');
  const cases = await prisma.case.findMany({ take: 16 });
  const milestoneNames = ['First Response', 'Resolution', 'Follow-Up', 'Escalation Review', 'Confirmation', 'SLA Check', 'Quality Review', 'Customer Callback', 'Documentation', 'Root Cause Analysis', 'Preventive Action', 'Sign-Off', 'Post-Resolution Survey', 'Knowledge Article', 'Case Closure', 'Satisfaction Check'];
  for (let i = 0; i < Math.min(16, cases.length); i++) {
    const target = new Date(); target.setDate(target.getDate() + 3 + i);
    await prisma.caseMilestone.create({
      data: {
        caseId: cases[i].id,
        milestoneName: milestoneNames[i],
        targetDate: target,
        completedDate: i < 6 ? new Date() : null,
        status: i < 6 ? 'COMPLETED' : 'OPEN',
      },
    });
  }

  // ============ PHASE 2: MARKETING ============

  console.log('  Creating A/B Tests...');
  const abTestData = [
    { name: 'Email Subject Line Test', status: 'ACTIVE', testType: 'EMAIL', variantA: { subject: 'Limited Time Offer!' }, variantB: { subject: 'Exclusive Savings Inside' }, splitPercent: 50, winnerCriteria: 'OPEN_RATE' },
    { name: 'Landing Page CTA Test', status: 'COMPLETED', testType: 'LANDING_PAGE', variantA: { headline: 'Get Started Free' }, variantB: { headline: 'Start Your Trial' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE', results: { winner: 'B', conversionA: 3.2, conversionB: 4.8 } },
    { name: 'Signup Form Length Test', status: 'DRAFT', testType: 'FORM', variantA: { fields: 3 }, variantB: { fields: 5 }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Button Color Test', status: 'ACTIVE', testType: 'LANDING_PAGE', variantA: { color: 'blue' }, variantB: { color: 'green' }, splitPercent: 50, winnerCriteria: 'CLICK_RATE' },
    { name: 'Email Send Time Test', status: 'COMPLETED', testType: 'EMAIL', variantA: { sendTime: '9am' }, variantB: { sendTime: '2pm' }, splitPercent: 50, winnerCriteria: 'OPEN_RATE', results: { winner: 'A', openRateA: 28.5, openRateB: 22.1 } },
    { name: 'Pricing Page Layout', status: 'ACTIVE', testType: 'LANDING_PAGE', variantA: { layout: 'grid' }, variantB: { layout: 'comparison' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Welcome Email Tone', status: 'DRAFT', testType: 'EMAIL', variantA: { tone: 'formal' }, variantB: { tone: 'casual' }, splitPercent: 50, winnerCriteria: 'CLICK_RATE' },
    { name: 'Hero Image Test', status: 'COMPLETED', testType: 'LANDING_PAGE', variantA: { image: 'product' }, variantB: { image: 'people' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE', results: { winner: 'B', conversionA: 2.8, conversionB: 4.1 } },
    { name: 'Checkout Flow Test', status: 'ACTIVE', testType: 'FORM', variantA: { steps: 1 }, variantB: { steps: 3 }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Testimonial Placement', status: 'DRAFT', testType: 'LANDING_PAGE', variantA: { position: 'above-fold' }, variantB: { position: 'below-fold' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Free vs Paid Trial', status: 'ACTIVE', testType: 'LANDING_PAGE', variantA: { trial: 'free' }, variantB: { trial: '$1' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Email Personalization', status: 'COMPLETED', testType: 'EMAIL', variantA: { personalized: false }, variantB: { personalized: true }, splitPercent: 50, winnerCriteria: 'OPEN_RATE', results: { winner: 'B', openRateA: 18.2, openRateB: 31.5 } },
    { name: 'Video vs Text Demo', status: 'ACTIVE', testType: 'LANDING_PAGE', variantA: { format: 'video' }, variantB: { format: 'text' }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Social Proof Badge', status: 'DRAFT', testType: 'LANDING_PAGE', variantA: { badge: true }, variantB: { badge: false }, splitPercent: 50, winnerCriteria: 'CONVERSION_RATE' },
    { name: 'Newsletter Frequency', status: 'ACTIVE', testType: 'EMAIL', variantA: { frequency: 'weekly' }, variantB: { frequency: 'biweekly' }, splitPercent: 50, winnerCriteria: 'UNSUBSCRIBE_RATE' },
  ];
  for (const ab of abTestData) {
    await prisma.aBTest.create({ data: ab });
  }

  console.log('  Creating Landing Pages...');
  const landingPageData = [
    { name: 'Product Launch 2025', slug: 'product-launch-2025', status: 'PUBLISHED', htmlContent: '<h1>New Product Launch</h1><p>Discover our latest innovation.</p>', formConfig: { fields: ['name', 'email'] }, viewCount: 1250, conversionCount: 87 },
    { name: 'Free Trial Signup', slug: 'free-trial', status: 'PUBLISHED', htmlContent: '<h1>Start Your Free Trial</h1><p>No credit card required.</p>', formConfig: { fields: ['name', 'email'] }, viewCount: 3400, conversionCount: 340 },
    { name: 'Webinar Registration', slug: 'webinar-reg', status: 'DRAFT', htmlContent: '<h1>Join Our Webinar</h1><p>Learn from industry experts.</p>', formConfig: { fields: ['name', 'email', 'company'] }, viewCount: 0, conversionCount: 0 },
    { name: 'Demo Request', slug: 'demo-request', status: 'PUBLISHED', htmlContent: '<h1>Request a Demo</h1><p>See our product in action.</p>', formConfig: { fields: ['name', 'email', 'company', 'phone'] }, viewCount: 2100, conversionCount: 168 },
    { name: 'Pricing Page', slug: 'pricing', status: 'PUBLISHED', htmlContent: '<h1>Simple Pricing</h1><p>Plans for every team size.</p>', formConfig: { fields: ['email'] }, viewCount: 5600, conversionCount: 280 },
    { name: 'Case Study Download', slug: 'case-study', status: 'PUBLISHED', htmlContent: '<h1>Customer Success Stories</h1><p>See how our customers succeed.</p>', formConfig: { fields: ['name', 'email', 'company'] }, viewCount: 890, conversionCount: 134 },
    { name: 'Black Friday Sale', slug: 'black-friday', status: 'ARCHIVED', htmlContent: '<h1>Black Friday Deals</h1><p>Up to 50% off!</p>', formConfig: { fields: ['email'] }, viewCount: 12000, conversionCount: 1800 },
    { name: 'Partner Program', slug: 'partner-program', status: 'PUBLISHED', htmlContent: '<h1>Become a Partner</h1><p>Grow with us.</p>', formConfig: { fields: ['name', 'email', 'company', 'website'] }, viewCount: 450, conversionCount: 23 },
    { name: 'Newsletter Signup', slug: 'newsletter', status: 'PUBLISHED', htmlContent: '<h1>Stay Updated</h1><p>Weekly insights delivered.</p>', formConfig: { fields: ['email'] }, viewCount: 7800, conversionCount: 1560 },
    { name: 'Ebook Download', slug: 'ebook-crm-guide', status: 'PUBLISHED', htmlContent: '<h1>Free CRM Guide</h1><p>Download our comprehensive guide.</p>', formConfig: { fields: ['name', 'email'] }, viewCount: 1800, conversionCount: 270 },
    { name: 'Annual Conference', slug: 'annual-conference', status: 'DRAFT', htmlContent: '<h1>Join Our Conference</h1><p>Network with industry leaders.</p>', formConfig: { fields: ['name', 'email', 'company', 'role'] }, viewCount: 0, conversionCount: 0 },
    { name: 'Feature Request', slug: 'feature-request', status: 'PUBLISHED', htmlContent: '<h1>Request a Feature</h1><p>Help shape our roadmap.</p>', formConfig: { fields: ['name', 'email', 'feature'] }, viewCount: 620, conversionCount: 186 },
    { name: 'Referral Program', slug: 'referral', status: 'PUBLISHED', htmlContent: '<h1>Refer & Earn</h1><p>Get rewards for referrals.</p>', formConfig: { fields: ['name', 'email', 'referral_email'] }, viewCount: 980, conversionCount: 98 },
    { name: 'Beta Signup', slug: 'beta-signup', status: 'PUBLISHED', htmlContent: '<h1>Join the Beta</h1><p>Be the first to try new features.</p>', formConfig: { fields: ['name', 'email'] }, viewCount: 2300, conversionCount: 460 },
    { name: 'Holiday Promo', slug: 'holiday-promo', status: 'ARCHIVED', htmlContent: '<h1>Holiday Special</h1><p>Celebrate with savings!</p>', formConfig: { fields: ['email'] }, viewCount: 8500, conversionCount: 1275 },
  ];
  for (const lp of landingPageData) {
    await prisma.landingPage.create({ data: lp });
  }

  // ============ PHASE 2: PLATFORM ============

  console.log('  Creating Dynamic Dashboards...');
  const dashboardData = [
    { name: 'Sales Overview', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'metric', title: 'Total Revenue' }, { type: 'chart', title: 'Pipeline by Stage' }], isDefault: true },
    { name: 'Service Metrics', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'metric', title: 'Open Cases' }, { type: 'chart', title: 'Cases by Priority' }], isDefault: false },
    { name: 'Marketing Performance', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'metric', title: 'Campaign ROI' }, { type: 'chart', title: 'Lead Sources' }], isDefault: false },
    { name: 'Field Service KPIs', layout: { type: 'grid', columns: 4 }, widgets: [{ type: 'metric', title: 'Work Orders Today' }, { type: 'chart', title: 'Completion Rate' }], isDefault: false },
    { name: 'Executive Summary', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'metric', title: 'MRR' }, { type: 'chart', title: 'Growth Trend' }], isDefault: false },
    { name: 'Customer Health', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'metric', title: 'NPS Score' }, { type: 'chart', title: 'Churn Rate' }], isDefault: false },
    { name: 'Pipeline Analysis', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'chart', title: 'Deal Flow' }, { type: 'metric', title: 'Win Rate' }], isDefault: false },
    { name: 'Team Performance', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'metric', title: 'Activities Today' }, { type: 'chart', title: 'Rep Leaderboard' }], isDefault: false },
    { name: 'Product Analytics', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'chart', title: 'Product Mix' }, { type: 'metric', title: 'Avg Deal Size' }], isDefault: false },
    { name: 'Forecast Dashboard', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'chart', title: 'Forecast vs Actual' }, { type: 'metric', title: 'Quota Attainment' }], isDefault: false },
    { name: 'Activity Tracker', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'metric', title: 'Calls Today' }, { type: 'chart', title: 'Email Open Rate' }], isDefault: false },
    { name: 'Territory Map', layout: { type: 'grid', columns: 1 }, widgets: [{ type: 'map', title: 'Territory Coverage' }], isDefault: false },
    { name: 'Loyalty Dashboard', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'metric', title: 'Active Members' }, { type: 'chart', title: 'Points Distribution' }], isDefault: false },
    { name: 'Support Queue', layout: { type: 'grid', columns: 2 }, widgets: [{ type: 'metric', title: 'Tickets in Queue' }, { type: 'chart', title: 'Response Times' }], isDefault: false },
    { name: 'Revenue Intelligence', layout: { type: 'grid', columns: 3 }, widgets: [{ type: 'chart', title: 'Revenue Trend' }, { type: 'metric', title: 'Pipeline Coverage' }], isDefault: false },
  ];
  for (const d of dashboardData) {
    await prisma.dynamicDashboard.create({ data: { ...d, ownerId: admin.id } });
  }

  console.log('  Creating Validation Rules...');
  const validationData = [
    { name: 'Opportunity Amount Required', objectType: 'Opportunity', formula: 'amount > 0', errorMessage: 'Amount must be greater than zero.', isActive: true },
    { name: 'Lead Email Required', objectType: 'Lead', formula: 'email.includes("@")', errorMessage: 'Valid email address is required.', isActive: true },
    { name: 'Contact Phone Format', objectType: 'Contact', formula: 'phone.match(/^\\+?[0-9-]+$/)', errorMessage: 'Phone must contain only numbers and dashes.', isActive: true },
    { name: 'Case Subject Length', objectType: 'Case', formula: 'subject.length >= 5', errorMessage: 'Case subject must be at least 5 characters.', isActive: true },
    { name: 'Opportunity Close Date', objectType: 'Opportunity', formula: 'closeDate > today()', errorMessage: 'Close date must be in the future.', isActive: true },
    { name: 'Lead Company Required', objectType: 'Lead', formula: 'company.length > 0', errorMessage: 'Company name is required.', isActive: false },
    { name: 'Contact Last Name Required', objectType: 'Contact', formula: 'lastName.length > 0', errorMessage: 'Last name is required.', isActive: true },
    { name: 'Opportunity Stage Valid', objectType: 'Opportunity', formula: 'validStages.includes(stage)', errorMessage: 'Invalid opportunity stage.', isActive: true },
    { name: 'Campaign Start Before End', objectType: 'Campaign', formula: 'startDate < endDate', errorMessage: 'Start date must be before end date.', isActive: true },
    { name: 'Quote Discount Limit', objectType: 'Quote', formula: 'discount <= 30', errorMessage: 'Discount cannot exceed 30%.', isActive: true },
    { name: 'Work Order Priority', objectType: 'WorkOrder', formula: 'priority !== null', errorMessage: 'Priority must be set.', isActive: true },
    { name: 'Invoice Amount Positive', objectType: 'Invoice', formula: 'totalAmount > 0', errorMessage: 'Invoice amount must be positive.', isActive: true },
    { name: 'Event Duration Check', objectType: 'Event', formula: 'durationMinutes > 0', errorMessage: 'Event must have a duration.', isActive: true },
    { name: 'Task Due Date Required', objectType: 'Task', formula: 'dueDate !== null', errorMessage: 'Tasks must have a due date.', isActive: false },
    { name: 'Product Price Required', objectType: 'Product', formula: 'price > 0', errorMessage: 'Product price must be set.', isActive: true },
  ];
  for (const v of validationData) {
    await prisma.validationRule.create({ data: v });
  }

  // ============ PHASE 2: ADDITIONAL MODULES ============

  console.log('  Creating Loyalty Program...');
  const program = await prisma.loyaltyProgram.create({ data: { name: 'Rewards Plus', status: 'ACTIVE', pointsPerDollar: 10, redemptionRate: 0.01, tierEnabled: true } });
  for (const t of [
    { name: 'Bronze', minPoints: 0, benefits: { discount: '5%' } },
    { name: 'Silver', minPoints: 1000, benefits: { discount: '10%', freeShipping: true } },
    { name: 'Gold', minPoints: 5000, benefits: { discount: '15%', prioritySupport: true } },
    { name: 'Platinum', minPoints: 10000, benefits: { discount: '20%', exclusiveAccess: true } },
  ]) { await prisma.loyaltyTier.create({ data: { ...t, programId: program.id } }); }

  if (contacts.length > 0) {
    for (let i = 0; i < Math.min(16, contacts.length); i++) {
      const pts = [500, 2500, 7500, 12000, 150, 3200, 8000, 1100, 600, 4500, 9500, 11000, 200, 1800, 6000, 300][i];
      const tier = pts >= 10000 ? 'Platinum' : pts >= 5000 ? 'Gold' : pts >= 1000 ? 'Silver' : 'Bronze';
      const member = await prisma.loyaltyMember.create({ data: { programId: program.id, contactId: contacts[i].id, currentPoints: pts, lifetimePoints: pts + 500, currentTier: tier } });
      await prisma.loyaltyTransaction.create({ data: { memberId: member.id, type: 'EARN', points: 200, description: 'Welcome bonus' } });
      await prisma.loyaltyTransaction.create({ data: { memberId: member.id, type: 'EARN', points: 150 + (i * 30), description: 'Purchase reward' } });
      await prisma.loyaltyTransaction.create({ data: { memberId: member.id, type: 'REDEMPTION', points: -(50 + i * 10), description: 'Points redeemed' } });
    }
  }

  console.log('  Creating Geo Locations...');
  const geoData = [
    { objectType: 'ACCOUNT', latitude: 34.0522, longitude: -118.2437, address: '100 Main St, Los Angeles, CA' },
    { objectType: 'TERRITORY', latitude: 34.0522, longitude: -118.2437, address: 'West Region HQ' },
    { objectType: 'TERRITORY', latitude: 40.7128, longitude: -74.006, address: 'East Region HQ' },
    { objectType: 'WORK_ORDER', latitude: 34.0195, longitude: -118.4912, address: '150 Ocean Ave, Santa Monica, CA' },
    { objectType: 'ACCOUNT', latitude: 41.8781, longitude: -87.6298, address: '200 State St, Chicago, IL' },
    { objectType: 'TERRITORY', latitude: 29.7604, longitude: -95.3698, address: 'South Region HQ, Houston, TX' },
    { objectType: 'WORK_ORDER', latitude: 47.6062, longitude: -122.3321, address: '300 Pine St, Seattle, WA' },
    { objectType: 'ACCOUNT', latitude: 33.749, longitude: -84.388, address: '400 Peachtree St, Atlanta, GA' },
    { objectType: 'TERRITORY', latitude: 33.4484, longitude: -112.074, address: 'Southwest Region HQ, Phoenix, AZ' },
    { objectType: 'WORK_ORDER', latitude: 42.3601, longitude: -71.0589, address: '500 Boylston St, Boston, MA' },
    { objectType: 'ACCOUNT', latitude: 44.9778, longitude: -93.265, address: '600 Nicollet Mall, Minneapolis, MN' },
    { objectType: 'TERRITORY', latitude: 39.7392, longitude: -104.9903, address: 'Mountain Region HQ, Denver, CO' },
    { objectType: 'WORK_ORDER', latitude: 45.5152, longitude: -122.6784, address: '700 Broadway, Portland, OR' },
    { objectType: 'ACCOUNT', latitude: 29.9511, longitude: -90.0715, address: '800 Canal St, New Orleans, LA' },
    { objectType: 'TERRITORY', latitude: 37.7749, longitude: -122.4194, address: 'Bay Area HQ, San Francisco, CA' },
    { objectType: 'WORK_ORDER', latitude: 39.9526, longitude: -75.1652, address: '900 Market St, Philadelphia, PA' },
  ];
  for (let i = 0; i < geoData.length; i++) {
    const objectId = geoData[i].objectType === 'ACCOUNT' ? (clients[i % clients.length]?.id || `acc-${i}`) :
                     geoData[i].objectType === 'TERRITORY' ? territories[i % territories.length].id :
                     workOrders[i % workOrders.length].id;
    await prisma.geoLocation.create({ data: { ...geoData[i], objectId } });
  }

  console.log('  Creating Booking Calendars...');
  const calendars = [];
  const calendarData = [
    { name: 'Sales Consultation', type: 'PERSONAL', duration: 30 },
    { name: 'Technical Support', type: 'TEAM', duration: 45 },
    { name: 'Service Appointment', type: 'SERVICE', duration: 60 },
    { name: 'Product Demo', type: 'PERSONAL', duration: 30 },
    { name: 'Onboarding Call', type: 'TEAM', duration: 60 },
    { name: 'Strategy Session', type: 'PERSONAL', duration: 90 },
    { name: 'Quick Check-In', type: 'PERSONAL', duration: 15 },
    { name: 'Training Session', type: 'TEAM', duration: 120 },
    { name: 'Discovery Call', type: 'PERSONAL', duration: 30 },
    { name: 'Implementation Review', type: 'TEAM', duration: 60 },
    { name: 'Executive Briefing', type: 'PERSONAL', duration: 45 },
    { name: 'Technical Deep Dive', type: 'TEAM', duration: 90 },
    { name: 'QBR Meeting', type: 'TEAM', duration: 60 },
    { name: 'Support Escalation', type: 'SERVICE', duration: 30 },
    { name: 'Partner Meeting', type: 'PERSONAL', duration: 45 },
  ];
  for (const c of calendarData) {
    calendars.push(await prisma.bookingCalendar.create({
      data: {
        ...c, ownerId: admin.id,
        availability: { monday: { start: '09:00', end: '17:00' }, tuesday: { start: '09:00', end: '17:00' }, wednesday: { start: '09:00', end: '17:00' }, thursday: { start: '09:00', end: '17:00' }, friday: { start: '09:00', end: '15:00' } },
        publicToken: crypto.randomBytes(16).toString('hex'),
      },
    }));
  }

  console.log('  Creating Bookings...');
  const bkStatuses = ['CONFIRMED', 'PENDING', 'CANCELLED', 'COMPLETED'];
  const bookerNames = ['Alice Brown', 'Bob Smith', 'Carol White', 'Dan Green', 'Eve Black', 'Frank Gray', 'Grace Blue', 'Henry Red', 'Iris Gold', 'Jack Silver', 'Kate Copper', 'Leo Bronze', 'Mia Pearl', 'Noah Ruby', 'Olive Jade', 'Pete Onyx'];
  for (let i = 0; i < 16; i++) {
    const start = new Date(); start.setDate(start.getDate() + i - 3); start.setHours(9 + (i % 7), 0, 0, 0);
    const end = new Date(start); end.setMinutes(end.getMinutes() + calendars[i % calendars.length].duration);
    await prisma.booking.create({
      data: {
        calendarId: calendars[i % calendars.length].id,
        bookerName: bookerNames[i],
        bookerEmail: `${bookerNames[i].toLowerCase().replace(' ', '.')}@example.com`,
        startTime: start, endTime: end,
        status: bkStatuses[i % bkStatuses.length],
      },
    });
  }

  // ============ REVENUE INTELLIGENCE DATA ============

  console.log('  Creating Revenue Forecasts...');
  const forecastPeriods = [
    { period: '2025-Q1', forecastType: 'quarterly', predictedAmount: 250000, actualAmount: 268000, confidence: 85 },
    { period: '2025-Q2', forecastType: 'quarterly', predictedAmount: 310000, actualAmount: 295000, confidence: 78 },
    { period: '2025-Q3', forecastType: 'quarterly', predictedAmount: 340000, actualAmount: 352000, confidence: 82 },
    { period: '2025-Q4', forecastType: 'quarterly', predictedAmount: 380000, actualAmount: 410000, confidence: 75 },
    { period: '2026-Q1', forecastType: 'quarterly', predictedAmount: 420000, actualAmount: 398000, confidence: 80 },
    { period: '2026-Q2', forecastType: 'quarterly', predictedAmount: 450000, actualAmount: null, confidence: 72 },
    { period: '2025-01', forecastType: 'monthly', predictedAmount: 78000, actualAmount: 82000, confidence: 88 },
    { period: '2025-02', forecastType: 'monthly', predictedAmount: 85000, actualAmount: 79000, confidence: 85 },
    { period: '2025-03', forecastType: 'monthly', predictedAmount: 92000, actualAmount: 107000, confidence: 80 },
    { period: '2025-04', forecastType: 'monthly', predictedAmount: 98000, actualAmount: 95000, confidence: 82 },
    { period: '2025-05', forecastType: 'monthly', predictedAmount: 105000, actualAmount: 102000, confidence: 79 },
    { period: '2025-06', forecastType: 'monthly', predictedAmount: 110000, actualAmount: 98000, confidence: 76 },
    { period: '2025-07', forecastType: 'monthly', predictedAmount: 115000, actualAmount: 121000, confidence: 83 },
    { period: '2025-08', forecastType: 'monthly', predictedAmount: 112000, actualAmount: 108000, confidence: 81 },
    { period: '2025-09', forecastType: 'monthly', predictedAmount: 118000, actualAmount: 123000, confidence: 77 },
    { period: '2025-10', forecastType: 'monthly', predictedAmount: 125000, actualAmount: 130000, confidence: 84 },
    { period: '2025-11', forecastType: 'monthly', predictedAmount: 128000, actualAmount: 142000, confidence: 74 },
    { period: '2025-12', forecastType: 'monthly', predictedAmount: 135000, actualAmount: 138000, confidence: 86 },
    { period: '2026-01', forecastType: 'monthly', predictedAmount: 140000, actualAmount: 132000, confidence: 78 },
    { period: '2026-02', forecastType: 'monthly', predictedAmount: 145000, actualAmount: null, confidence: 70 },
  ];
  for (const f of forecastPeriods) {
    await prisma.revenueForecast.create({
      data: {
        ...f,
        breakdown: { byRep: { 'Admin User': f.predictedAmount * 0.6 }, byStage: { CLOSED_WON: f.predictedAmount * 0.4, NEGOTIATION: f.predictedAmount * 0.3 } },
        generatedBy: 'AI',
      },
    });
  }

  // ============ UPDATE OPPORTUNITIES FOR PIPELINE INSPECTION ============

  console.log('  Updating opportunities with realistic dates...');
  const allOpps = await prisma.opportunity.findMany({
    where: { stage: { notIn: ['CLOSED_WON', 'CLOSED_LOST'] } },
    take: 48,
  });

  // Make some deals "stuck" (updatedAt > 14 days ago)
  for (let i = 0; i < Math.min(10, allOpps.length); i++) {
    const daysAgo = 15 + (i * 5); // 15-60 days ago
    const stuckDate = new Date();
    stuckDate.setDate(stuckDate.getDate() - daysAgo);
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 30 + (i * 10));
    await prisma.opportunity.update({
      where: { id: allOpps[i].id },
      data: {
        updatedAt: stuckDate,
        expectedCloseDate: closeDate,
      },
    });
  }

  // Make some deals "closing soon" (expectedCloseDate within 30 days)
  for (let i = 10; i < Math.min(20, allOpps.length); i++) {
    const closeDaysFromNow = 3 + ((i - 10) * 3); // 3-30 days from now
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + closeDaysFromNow);
    await prisma.opportunity.update({
      where: { id: allOpps[i].id },
      data: {
        expectedCloseDate: closeDate,
      },
    });
  }

  // Give remaining open opps some expectedCloseDates too
  for (let i = 20; i < allOpps.length; i++) {
    const closeDate = new Date();
    closeDate.setDate(closeDate.getDate() + 45 + (i * 7));
    await prisma.opportunity.update({
      where: { id: allOpps[i].id },
      data: {
        expectedCloseDate: closeDate,
      },
    });
  }

  console.log('✅ All Field Service + Phase 2 features seeded (15+ items per entity)!');
}
