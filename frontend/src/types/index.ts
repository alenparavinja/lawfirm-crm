// Shared domain types matching the API response shapes.
// These are not exhaustive - fields are added as pages need them.

export interface StaffRef {
  fullName: string;
  role: 'attorney' | 'paralegal' | 'admin';
}

export interface Client {
  _id: string;
  fullName: string;
  dateOfBirth: string;
  email: string;
  phone: string;
  mailingAddress: string;
  countryOfOrigin: string;
  aNumber: string;
  currentImmigrationStatus: string;
  dateOfEntry?: string;
  status: 'active' | 'inactive';
  dateOnboarded: string;
}

export interface Case {
  _id: string;
  caseNumber: string;
  title: string;
  clientId: string | { _id: string; fullName: string };
  responsibleStaffId: string | StaffRef;
caseType:
  | 'employment_visa'
  | 'student_visa'
  | 'asylum'
  | 'green_card'
  | 'naturalization'
  | 'removal_defense'
  | 'family_petition'
  | 'other';
  status: 'open' | 'pending' | 'closed';
  dateOpened: string;
  dateClosed?: string;
  receiptNumber?: string | null;
  priorityDate?: string | null;
  filingDate?: string | null;
currentStage:
  | 'consultation'
  | 'preparing'
  | 'filed'
  | 'rfe_received'
  | 'interview_scheduled'
  | 'approved'
  | 'denied'
  | 'appeal';
}

export interface Note {
  _id: string;
  caseId: string;
  authorStaffId: StaffRef;
  body: string;
  createdAt: string;
}

export interface Task {
  _id: string;
  title: string;
  caseId?: string;
  assignedStaffId: StaffRef;
  dueDate: string;
  priority: 'low' | 'normal' | 'high' | 'medium';
  status: 'open' | 'in_progress' | 'done' | 'pending' | 'complete';
}

export interface PaginatedResponse<T> {
  data: T[];
  page: number;
  limit: number;
  total: number;
}