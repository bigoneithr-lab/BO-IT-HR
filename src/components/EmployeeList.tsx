import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Search, Plus, Edit2, Trash2, Mail, Eye } from 'lucide-react';
import { collection, addDoc, updateDoc, deleteDoc, doc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, Department } from '../types';
import EmployeeModal from './EmployeeModal';

interface EmployeeListProps {
  employees: Employee[];
  departments: Department[];
  onViewProfile: (employee: Employee) => void;
}

export default function EmployeeList({ employees, departments, onViewProfile }: EmployeeListProps) {
  const [searchTerm, setSearchTerm] = useState('');
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingEmployee, setEditingEmployee] = useState<Employee | undefined>();

  const filteredEmployees = employees.filter(emp => 
    `${emp.firstName} ${emp.lastName}`.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.email.toLowerCase().includes(searchTerm.toLowerCase()) ||
    emp.role.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleDelete = async (id: string, e: React.MouseEvent) => {
    e.stopPropagation();
    try {
      await deleteDoc(doc(db, 'employees', id));
    } catch (error) {
      handleFirestoreError(error, OperationType.DELETE, `employees/${id}`);
    }
  };

  const handleEdit = (employee: Employee, e: React.MouseEvent) => {
    e.stopPropagation();
    setEditingEmployee(employee);
    setIsModalOpen(true);
  };

  const handleAddNew = () => {
    setEditingEmployee(undefined);
    setIsModalOpen(true);
  };

  const handleSave = async (emp: Employee) => {
    try {
      const { id, ...data } = emp;
      if (editingEmployee) {
        await updateDoc(doc(db, 'employees', id), data);
      } else {
        await addDoc(collection(db, 'employees'), {
          ...data,
          ownerId: auth.currentUser?.uid
        });
      }
      setIsModalOpen(false);
    } catch (error) {
      handleFirestoreError(error, editingEmployee ? OperationType.UPDATE : OperationType.CREATE, 'employees');
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'Active': return 'bg-[#E6FFFA] text-[#2C7A7B]';
      case 'On Leave': return 'bg-[#FFF5F5] text-[#C53030]';
      case 'Terminated': return 'bg-[#EDF2F7] text-[#4A5568]';
      default: return 'bg-[#EDF2F7] text-[#4A5568]';
    }
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Employee Directory</h1>
        </div>
        <button 
          onClick={handleAddNew}
          className="bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center justify-center gap-2 transition-colors w-full sm:w-auto"
        >
          <Plus className="w-4 h-4" />
          Add Employee
        </button>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 flex flex-col overflow-hidden">
        <div className="p-4 md:p-5 border-b border-[#F0F2F5] flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
          <div className="relative w-full sm:w-[300px]">
            <Search className="w-4 h-4 absolute left-3 top-1/2 -translate-y-1/2 text-[#718096]" />
            <input 
              type="text"
              placeholder="Search employees..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full pl-10 pr-4 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] text-[#718096] placeholder-[#718096] focus:outline-none focus:ring-1 focus:ring-[#4A90E2] focus:border-[#4A90E2] transition-colors"
            />
          </div>
          <div className="text-[14px] text-[#718096]">
            Showing {filteredEmployees.length} employees
          </div>
        </div>

        <div className="flex-1 overflow-x-auto">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#FAFBFC] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Role & Dept</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Joined</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white">
              {filteredEmployees.map((employee) => (
                <tr 
                  key={employee.id} 
                  onClick={() => onViewProfile(employee)}
                  className="hover:bg-[#FAFBFC] transition-colors group cursor-pointer"
                >
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <div className="flex items-center gap-3">
                      <img src={employee.avatarUrl} alt="" className="w-10 h-10 rounded-full bg-[#E2E8F0] object-cover" />
                      <div>
                        <div className="font-medium text-[14px] text-[#333]">{employee.firstName} {employee.lastName}</div>
                        <div className="text-[12px] text-[#718096] flex items-center gap-1 mt-0.5">
                          {employee.employeeId && <span className="font-mono bg-[#EDF2F7] px-1 rounded mr-1">{employee.employeeId}</span>}
                          <Mail className="w-3 h-3" />
                          {employee.email}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <div className="text-[14px] text-[#333]">{employee.role}</div>
                    <div className="text-[12px] text-[#718096] mt-0.5">{employee.department}</div>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <span className={`px-[10px] py-[4px] inline-flex text-[11px] leading-none font-semibold rounded-[12px] uppercase ${getStatusColor(employee.status)}`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-[14px] text-[#333]">
                    {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                    <div className="flex items-center justify-end gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        onClick={(e) => { e.stopPropagation(); onViewProfile(employee); }}
                        className="px-3 py-1.5 bg-[#EBF8FF] text-[#2B6CB0] hover:bg-[#BEE3F8] rounded-[4px] text-[12px] transition-colors flex items-center gap-1"
                      >
                        <Eye className="w-3 h-3" /> View
                      </button>
                      <button 
                        onClick={(e) => handleEdit(employee, e)}
                        className="px-3 py-1.5 bg-[#EDF2F7] text-[#4A5568] hover:bg-[#E2E8F0] rounded-[4px] text-[12px] transition-colors flex items-center gap-1"
                      >
                        <Edit2 className="w-3 h-3" /> Edit
                      </button>
                      <button 
                        onClick={(e) => handleDelete(employee.id, e)}
                        className="px-3 py-1.5 bg-[#FFF5F5] text-[#C53030] hover:bg-[#FED7D7] rounded-[4px] text-[12px] transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3 h-3" /> Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
              {filteredEmployees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#718096] border-b border-[#F0F2F5]">
                    No employees found matching your search.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>

      {isModalOpen && (
        <EmployeeModal 
          isOpen={isModalOpen}
          onClose={() => setIsModalOpen(false)}
          employee={editingEmployee}
          departments={departments}
          onSave={handleSave}
        />
      )}
    </motion.div>
  );
}
