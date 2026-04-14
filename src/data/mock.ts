import { Employee } from '../types';

export const initialEmployees: Employee[] = [
  {
    id: '1',
    firstName: 'Sarah',
    lastName: 'Connor',
    email: 'sarah.connor@company.com',
    role: 'Engineering Manager',
    department: 'Engineering',
    status: 'Active',
    joinDate: '2023-01-15',
    avatarUrl: 'https://i.pravatar.cc/150?u=sarah'
  },
  {
    id: '2',
    firstName: 'Michael',
    lastName: 'Scott',
    email: 'm.scott@company.com',
    role: 'Regional Manager',
    department: 'Sales',
    status: 'Active',
    joinDate: '2010-03-01',
    avatarUrl: 'https://i.pravatar.cc/150?u=michael'
  },
  {
    id: '3',
    firstName: 'Jim',
    lastName: 'Halpert',
    email: 'j.halpert@company.com',
    role: 'Sales Representative',
    department: 'Sales',
    status: 'On Leave',
    joinDate: '2012-05-14',
    avatarUrl: 'https://i.pravatar.cc/150?u=jim'
  },
  {
    id: '4',
    firstName: 'Pam',
    lastName: 'Beesly',
    email: 'p.beesly@company.com',
    role: 'Office Administrator',
    department: 'Administration',
    status: 'Active',
    joinDate: '2011-02-10',
    avatarUrl: 'https://i.pravatar.cc/150?u=pam'
  },
  {
    id: '5',
    firstName: 'Dwight',
    lastName: 'Schrute',
    email: 'd.schrute@company.com',
    role: 'Assistant to the Regional Manager',
    department: 'Sales',
    status: 'Active',
    joinDate: '2009-08-23',
    avatarUrl: 'https://i.pravatar.cc/150?u=dwight'
  },
  {
    id: '6',
    firstName: 'Toby',
    lastName: 'Flenderson',
    email: 't.flenderson@company.com',
    role: 'HR Representative',
    department: 'Human Resources',
    status: 'Terminated',
    joinDate: '2008-11-05',
    avatarUrl: 'https://i.pravatar.cc/150?u=toby'
  }
];
