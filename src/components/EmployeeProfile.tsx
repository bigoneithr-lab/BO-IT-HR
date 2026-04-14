import React from 'react';
import { motion } from 'motion/react';
import { ArrowLeft, Mail, Phone, MapPin, Calendar, Briefcase } from 'lucide-react';
import { Employee } from '../types';

interface EmployeeProfileProps {
  employee: Employee;
  onBack: () => void;
}

export default function EmployeeProfile({ employee, onBack }: EmployeeProfileProps) {
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
      className="max-w-5xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex items-center gap-4">
        <button 
          onClick={onBack}
          className="p-2 text-[#718096] hover:text-[#333] hover:bg-[#E2E8F0] rounded-full transition-colors"
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-[24px] font-bold text-[#333]">Employee Profile</h1>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] overflow-hidden">
        <div className="p-8 border-b border-[#F0F2F5] flex items-start gap-6">
          <img 
            src={employee.avatarUrl} 
            alt={`${employee.firstName} ${employee.lastName}`} 
            className="w-24 h-24 rounded-full object-cover border-4 border-[#F7FAFC] shadow-sm"
          />
          <div className="flex-1">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-[24px] font-bold text-[#333]">{employee.firstName} {employee.lastName}</h2>
                <div className="text-[16px] text-[#718096] mt-1">
                  {employee.role} 
                  {employee.employeeId && <span className="ml-2 px-2 py-0.5 bg-[#EDF2F7] text-[#4A5568] rounded text-[12px] font-medium align-middle">ID: {employee.employeeId}</span>}
                </div>
              </div>
              <span className={`px-[12px] py-[6px] inline-flex text-[12px] font-semibold rounded-[12px] uppercase ${getStatusColor(employee.status)}`}>
                {employee.status}
              </span>
            </div>
            
            <div className="flex items-center gap-6 mt-6">
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Mail className="w-4 h-4" />
                {employee.email}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Briefcase className="w-4 h-4" />
                {employee.department}
              </div>
              <div className="flex items-center gap-2 text-[14px] text-[#718096]">
                <Calendar className="w-4 h-4" />
                Joined {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
              </div>
            </div>
          </div>
        </div>

        <div className="p-8">
          <div className="grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-[16px] font-semibold text-[#333] mb-4">Contact Information</h3>
              <div className="space-y-4">
                <div className="flex items-start gap-3">
                  <Phone className="w-5 h-5 text-[#A0AEC0] mt-0.5" />
                  <div>
                    <div className="text-[12px] text-[#718096] uppercase tracking-[0.5px] font-medium">Phone</div>
                    <div className="text-[14px] text-[#333] mt-1">{employee.phone || 'Not provided'}</div>
                  </div>
                </div>
                <div className="flex items-start gap-3">
                  <MapPin className="w-5 h-5 text-[#A0AEC0] mt-0.5" />
                  <div>
                    <div className="text-[12px] text-[#718096] uppercase tracking-[0.5px] font-medium">Location</div>
                    <div className="text-[14px] text-[#333] mt-1">{employee.location || 'Not provided'}</div>
                  </div>
                </div>
              </div>
            </div>
            <div>
              <h3 className="text-[16px] font-semibold text-[#333] mb-4">About</h3>
              <p className="text-[14px] text-[#4A5568] leading-relaxed">
                {employee.bio || 'No biography provided for this employee.'}
              </p>
            </div>
          </div>
        </div>
      </div>
    </motion.div>
  );
}
