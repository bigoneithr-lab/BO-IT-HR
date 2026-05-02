import { Employee } from '../types';

export function generateNextEmployeeId(employees: Employee[]): string {
  const prefix = 'BO-';
  const idNumbers = employees
    .map(emp => {
      const id = emp.employeeId || '';
      if (id.startsWith(prefix)) {
        const numPart = id.substring(prefix.length);
        const num = parseInt(numPart, 10);
        return isNaN(num) ? 0 : num;
      }
      return 0;
    })
    .filter(num => num > 0);

  const maxId = idNumbers.length > 0 ? Math.max(...idNumbers) : 7; // Defaulting to 7 as user said BO-007 is last
  const nextId = maxId + 1;
  const nextIdString = nextId.toString().padStart(3, '0');
  
  return `${prefix}${nextIdString}`;
}
