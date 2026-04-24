export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

export interface VaultDocument {
  id: string;
  employeeId: string;
  name: string;
  dataUrl: string; // Base64 data
  type: string;
  category: 'Contract' | 'ID' | 'Tax Document' | 'Other';
  uploadedAt: string;
  size: number;
}

export interface AttendanceRecord {
  id: string;
  employeeId: string;
  date: string; // YYYY-MM-DD
  month: string; // YYYY-MM
  status: 'Present' | 'Absent' | 'Half Day' | 'On Leave' | 'Late' | 'Off Day';
  checkIn?: string;
  checkOut?: string;
  checkInMethod?: 'auto' | 'manual';
  isLate?: boolean;
  lateMinutes?: number;
  markedBy: string;
  updatedAt: string;
}

export interface Employee {
  id: string;
  employeeId?: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  joinDate: string;
  avatarUrl: string;
  ownerId?: string;
  phone?: string;
  location?: string;
  bio?: string;
}

export type LeaveType = 'Casual' | 'Sick' | 'Personal' | 'Other';
export type LeaveStatus = 'Pending' | 'Approved' | 'Denied';

export interface LeaveRequest {
  id: string;
  employeeId: string;
  type: LeaveType;
  startDate: string;
  endDate: string;
  reason: string;
  status: LeaveStatus;
  appliedAt: string;
  reviewedBy?: string;
}

export interface Department {
  id: string;
  name: string;
  description?: string;
  managerId?: string;
}

export type ApplicantStage = 'Applied' | 'Interviewing' | 'Offered' | 'Hired' | 'Rejected';

export interface Applicant {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  stage: ApplicantStage;
  appliedDate: string;
  phone?: string;
  resumeUrl?: string;
  notes?: string;
}

export interface CompanySettings {
  companyName: string;
  logoUrl?: string;
  defaultCasualDays: number;
  defaultSickDays: number;
  workStartTime?: string;
}

export interface Payslip {
  id: string;
  employeeId: string;
  month: string;
  baseSalary: number;
  allowances: {
    attendance: number;
    dressCode: number;
    dinner: number;
    teamSales: number;
    ownSales: number;
  };
  deductions: {
    absences: number;
    absenceDays: number;
    lateDays?: number;
    latePenaltyDays?: number;
    lateDeduction?: number;
  };
  netSalary: number;
  status: 'Draft' | 'Paid';
  generatedAt: string;
  generatedBy: string;
}

export interface Goal {
  id: string;
  employeeId: string;
  title: string;
  description?: string;
  status: 'Not Started' | 'In Progress' | 'Completed' | 'Missed';
  dueDate: string;
  createdAt: string;
}

export interface PerformanceReview {
  id: string;
  employeeId: string;
  reviewerId: string;
  period: 'Q1' | 'Q2' | 'Q3' | 'Q4' | 'Annual';
  year: number;
  rating: number;
  feedback: string;
  status: 'Draft' | 'Published';
  createdAt: string;
}
