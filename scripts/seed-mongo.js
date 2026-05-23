// seed-mongo.js
// Seeds the lawfirm database with Tier 1 mock data for an immigration law firm.
// Run via mongosh with admin credentials on the DB Server.
//
// Usage:
//   mongosh -u admin -p <password> --authenticationDatabase admin seed-mongo.js

const db = db.getSiblingDB('lawfirm');

// Clean slate on each run so seeds are idempotent.
db.staff.drop();
db.clients.drop();
db.cases.drop();
db.documents.drop();
db.notes.drop();
db.tasks.drop();

print('[seed] dropped existing collections');

// ---- staff ----

const staffData = [
  { fullName: 'Maria Rodriguez', role: 'attorney', email: 'mrodriguez@lawfirm.com', barNumber: 'NY-2018-44521', active: true },
  { fullName: 'James Chen', role: 'attorney', email: 'jchen@lawfirm.com', barNumber: 'NY-2015-33102', active: true },
  { fullName: 'Sarah Kim', role: 'attorney', email: 'skim@lawfirm.com', barNumber: 'NY-2020-55789', active: true },
  { fullName: 'David Okafor', role: 'paralegal', email: 'dokafor@lawfirm.com', barNumber: null, active: true },
  { fullName: 'Ana Gutierrez', role: 'paralegal', email: 'agutierrez@lawfirm.com', barNumber: null, active: true },
  { fullName: 'Michael Torres', role: 'admin', email: 'mtorres@lawfirm.com', barNumber: null, active: true },
  { fullName: 'Linda Park', role: 'attorney', email: 'lpark@lawfirm.com', barNumber: 'NY-2012-22098', active: false }
];

const staffResult = db.staff.insertMany(staffData);
const staffIds = Object.values(staffResult.insertedIds);
print(`[seed] inserted ${staffIds.length} staff members`);

// Helper to pick a random element from an array.
function pick(arr) { return arr[Math.floor(Math.random() * arr.length)]; }
function pickDate(startYear, endYear) {
  const start = new Date(startYear, 0, 1).getTime();
  const end = new Date(endYear, 11, 31).getTime();
  return new Date(start + Math.random() * (end - start));
}

// Active attorneys and paralegals for assignment.
const attorneys = staffIds.filter((_, i) => staffData[i].role === 'attorney' && staffData[i].active);
const paralegals = staffIds.filter((_, i) => staffData[i].role === 'paralegal');

// ---- clients ----

const countries = [
  'Mexico', 'India', 'China', 'Philippines', 'El Salvador', 'Guatemala',
  'Honduras', 'Colombia', 'Brazil', 'Nigeria', 'Pakistan', 'Bangladesh',
  'South Korea', 'Vietnam', 'Haiti', 'Dominican Republic', 'Jamaica',
  'Venezuela', 'Ecuador', 'Peru', 'Nepal', 'Ethiopia', 'Ghana', 'Egypt',
  'Poland', 'Ukraine', 'Russia', 'Iran', 'Turkey', 'Japan'
];

const immigrationStatuses = [
  'F-1 student', 'H-1B worker', 'L-1 transferee', 'B-1/B-2 visitor',
  'TPS holder', 'asylum pending', 'green card holder', 'DACA recipient',
  'undocumented', 'U visa holder', 'K-1 fiance', 'J-1 exchange visitor',
  'O-1 extraordinary ability', 'E-2 investor'
];

const firstNames = [
  'Carlos', 'Priya', 'Wei', 'Fatima', 'Jose', 'Yuki', 'Ahmed',
  'Sofia', 'Raj', 'Mei', 'Omar', 'Ana', 'Jin', 'Elena', 'David',
  'Luz', 'Hassan', 'Camila', 'Vikram', 'Nadia', 'Marco', 'Ling',
  'Ibrahim', 'Rosa', 'Arjun', 'Hana', 'Diego', 'Amira', 'Chen',
  'Valentina', 'Kofi', 'Sana', 'Luis', 'Yara', 'Ravi', 'Mina',
  'Pedro', 'Aisha', 'Tao', 'Carmen', 'Ali', 'Julia', 'Kwame',
  'Lina', 'Andres', 'Zara', 'Hiroshi', 'Daniela', 'Osman', 'Ines'
];

const lastNames = [
  'Garcia', 'Patel', 'Wang', 'Ali', 'Martinez', 'Tanaka', 'Hassan',
  'Lopez', 'Kumar', 'Chen', 'Mohammed', 'Silva', 'Kim', 'Ivanova',
  'Nguyen', 'Santos', 'Singh', 'Hernandez', 'Park', 'Okafor',
  'Reyes', 'Zhang', 'Rahman', 'Torres', 'Sharma', 'Gutierrez',
  'Diaz', 'Huang', 'Cruz', 'Morales', 'Mensah', 'Abubakar',
  'Fernandez', 'Nakamura', 'Castillo', 'Li', 'Adeyemi', 'Perez',
  'Chowdhury', 'Delgado', 'Osei', 'Bautista', 'Volkov', 'Rivera',
  'Das', 'Mendoza', 'Sato', 'Ramirez', 'Kabir', 'Vargas'
];

const clientsData = [];
for (let i = 0; i < 50; i++) {
  const country = pick(countries);
  const entryDate = pickDate(2005, 2024);
  const onboardDate = new Date(entryDate.getTime() + Math.random() * 365 * 24 * 60 * 60 * 1000 * 5);
  clientsData.push({
    fullName: `${pick(firstNames)} ${pick(lastNames)}`,
    dateOfBirth: pickDate(1960, 2000),
    countryOfOrigin: country,
    aNumber: Math.random() > 0.3 ? `A${String(Math.floor(100000000 + Math.random() * 900000000))}` : null,
    currentImmigrationStatus: pick(immigrationStatuses),
    dateOfEntry: entryDate,
    email: `client${i + 1}@example.com`,
    phone: `(${212 + Math.floor(Math.random() * 788)}) ${String(Math.floor(1000000 + Math.random() * 9000000)).replace(/(\d{3})(\d{4})/, '$1-$2')}`,
    mailingAddress: `${100 + i} Example St, New York, NY ${10001 + Math.floor(Math.random() * 99)}`,
    dateOnboarded: onboardDate,
    status: Math.random() > 0.15 ? 'active' : 'inactive'
  });
}

const clientResult = db.clients.insertMany(clientsData);
const clientIds = Object.values(clientResult.insertedIds);
print(`[seed] inserted ${clientIds.length} clients`);

// ---- cases ----

const caseTypes = [
  'family_based', 'employment_visa', 'asylum', 'naturalization',
  'removal_defense', 'daca', 'student_visa', 'other'
];

const caseStages = [
  'consultation', 'preparing', 'filed', 'rfe_received',
  'interview_scheduled', 'approved', 'denied', 'appeal'
];

const casesData = [];
let caseCounter = 1;
for (let i = 0; i < clientIds.length; i++) {
  const numCases = 1 + Math.floor(Math.random() * 4);
  for (let j = 0; j < numCases; j++) {
    const stage = pick(caseStages);
    const isClosed = stage === 'approved' || stage === 'denied';
    const openDate = pickDate(2020, 2025);
    casesData.push({
      caseNumber: `${openDate.getFullYear()}-${String(caseCounter).padStart(4, '0')}`,
      title: `${clientsData[i].fullName} - ${pick(caseTypes).replace(/_/g, ' ')}`,
      clientId: clientIds[i],
      responsibleStaffId: pick(attorneys),
      caseType: pick(caseTypes),
      receiptNumber: Math.random() > 0.4 ? `MSC${String(Math.floor(2100000000 + Math.random() * 900000000))}` : null,
      priorityDate: Math.random() > 0.5 ? pickDate(2019, 2025) : null,
      filingDate: stage !== 'consultation' && stage !== 'preparing' ? pickDate(2021, 2025) : null,
      currentStage: stage,
      status: isClosed ? 'closed' : (Math.random() > 0.3 ? 'open' : 'pending'),
      dateOpened: openDate,
      dateClosed: isClosed ? new Date(openDate.getTime() + Math.random() * 365 * 2 * 24 * 60 * 60 * 1000) : null,
      courtId: null
    });
    caseCounter++;
  }
}

const caseResult = db.cases.insertMany(casesData);
const caseIds = Object.values(caseResult.insertedIds);
print(`[seed] inserted ${caseIds.length} cases`);

// ---- documents ----

const docTypes = [
  'passport', 'visa', 'application_form', 'supporting_evidence',
  'rfe_response', 'correspondence', 'court_filing', 'identity_document', 'other'
];

const docTitles = [
  'Passport Copy', 'I-130 Petition', 'I-485 Application', 'I-765 EAD',
  'I-131 Travel Document', 'Birth Certificate Translation', 'Marriage Certificate',
  'Employment Verification Letter', 'Tax Return 2023', 'Tax Return 2024',
  'Affidavit of Support I-864', 'Medical Examination I-693', 'Police Clearance',
  'Diploma Credential Evaluation', 'Asylum Declaration', 'Country Conditions Report',
  'RFE Response Cover Letter', 'Sponsor Financial Documents', 'Utility Bills',
  'Joint Account Statements', 'Photos of Couple', 'Expert Witness Letter',
  'Brief in Support of Motion', 'Notice to Appear', 'Immigration Judge Decision',
  'BIA Appeal Brief', 'FOIA Response', 'Prior Approval Notice'
];

const documentsData = [];
for (let i = 0; i < caseIds.length; i++) {
  const numDocs = 2 + Math.floor(Math.random() * 5);
  for (let j = 0; j < numDocs; j++) {
    documentsData.push({
      title: pick(docTitles),
      documentType: pick(docTypes),
      caseId: caseIds[i],
      uploadDate: pickDate(2021, 2025),
      author: pick(staffData).fullName,
      filePath: `/documents/case-${i + 1}/doc-${j + 1}.pdf`,
      fileSizeBytes: Math.floor(50000 + Math.random() * 5000000)
    });
  }
}

const docResult = db.documents.insertMany(documentsData);
print(`[seed] inserted ${Object.values(docResult.insertedIds).length} documents`);

// ---- notes ----

const noteTemplates = [
  'Client called regarding case status update. Advised that processing times are currently extended.',
  'Filed the application with USCIS. Receipt notice expected within 2-4 weeks.',
  'Received RFE from USCIS. Response deadline is 87 days from notice date.',
  'Prepared and sent RFE response packet via certified mail.',
  'Interview scheduled. Prepared client with mock interview questions.',
  'Client provided additional evidence. Documents added to case file.',
  'Spoke with opposing counsel regarding scheduling.',
  'Reviewed country conditions report for asylum claim.',
  'Updated client on visa bulletin movement for their priority date.',
  'Case approved. Notified client and scheduled follow-up for next steps.',
  'Filed motion to reschedule hearing due to client medical emergency.',
  'Conducted initial consultation. Client eligible for multiple relief options.',
  'Submitted FOIA request for client immigration history.',
  'Drafted declaration in support of asylum application.',
  'Coordinated with translator for document preparation.',
  'Reviewed denial notice. Identified grounds for appeal.',
  'Client missed biometrics appointment. Rescheduled with ASC.',
  'Filed change of address with USCIS and immigration court.',
  'Prepared I-290B appeal brief. Filed within 30-day deadline.',
  'Received approval notice. Green card production in progress.'
];

const notesData = [];
for (let i = 0; i < caseIds.length; i++) {
  const numNotes = 1 + Math.floor(Math.random() * 4);
  for (let j = 0; j < numNotes; j++) {
    notesData.push({
      caseId: caseIds[i],
      authorStaffId: pick(staffIds),
      body: pick(noteTemplates),
      createdAt: pickDate(2021, 2025)
    });
  }
}

const noteResult = db.notes.insertMany(notesData);
print(`[seed] inserted ${Object.values(noteResult.insertedIds).length} notes`);

// ---- tasks ----

const taskTitles = [
  'Gather supporting documents from client',
  'File I-130 petition with USCIS',
  'Prepare RFE response packet',
  'Schedule client for interview prep',
  'Request certified translation of birth certificate',
  'Follow up with USCIS on pending case',
  'Draft asylum declaration',
  'Review visa bulletin for priority date update',
  'Submit change of address notification',
  'Prepare I-864 affidavit of support',
  'File EAD renewal application',
  'Coordinate medical examination appointment',
  'Send document checklist to client',
  'Review denial notice and advise on options',
  'File motion to reopen case',
  'Obtain police clearance certificates',
  'Prepare client for biometrics appointment',
  'Draft appeal brief for BIA',
  'Update case management system with hearing date',
  'Follow up on FOIA request status'
];

const priorities = ['low', 'normal', 'high'];
const taskStatuses = ['open', 'in_progress', 'done'];

const tasksData = [];
for (let i = 0; i < 80; i++) {
  const hasCase = Math.random() > 0.2;
  const status = pick(taskStatuses);
  tasksData.push({
    title: pick(taskTitles),
    caseId: hasCase ? pick(caseIds) : null,
    assignedStaffId: pick([...attorneys, ...paralegals]),
    dueDate: pickDate(2025, 2026),
    priority: pick(priorities),
    status: status
  });
}

const taskResult = db.tasks.insertMany(tasksData);
print(`[seed] inserted ${Object.values(taskResult.insertedIds).length} tasks`);

// ---- indexes ----

db.clients.createIndex({ status: 1 });
db.clients.createIndex({ countryOfOrigin: 1 });
db.cases.createIndex({ clientId: 1 });
db.cases.createIndex({ responsibleStaffId: 1 });
db.cases.createIndex({ status: 1, currentStage: 1 });
db.cases.createIndex({ caseType: 1 });
db.cases.createIndex({ caseNumber: 1 }, { unique: true });
db.documents.createIndex({ caseId: 1 });
db.documents.createIndex({ documentType: 1 });
db.notes.createIndex({ caseId: 1 });
db.tasks.createIndex({ assignedStaffId: 1 });
db.tasks.createIndex({ status: 1 });
db.tasks.createIndex({ caseId: 1 });

print('[seed] created indexes');

// ---- summary ----

print('\n--- seed summary ---');
print(`staff:     ${db.staff.countDocuments()}`);
print(`clients:   ${db.clients.countDocuments()}`);
print(`cases:     ${db.cases.countDocuments()}`);
print(`documents: ${db.documents.countDocuments()}`);
print(`notes:     ${db.notes.countDocuments()}`);
print(`tasks:     ${db.tasks.countDocuments()}`);
print('--- done ---');
