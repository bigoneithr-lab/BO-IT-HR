export type EmployeeStatus = 'Active' | 'On Leave' | 'Terminated';

export interface EmployeeDocument {
  id: string;
  name: string;
  url: string;
  type: string;
  uploadedAt: string;
  size: number;
}

export interface Employee {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: string;
  department: string;
  status: EmployeeStatus;
  joinDate: string;
  avatarUrl: string;
  ownerId?: string;
  documents?: EmployeeDocument[];
  phone?: string;
  location?: string;
  bio?: string;
}

export type LeaveType = 'Vacation' | 'Sick' | 'Personal' | 'Other';
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
