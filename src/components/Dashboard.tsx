import { motion } from 'motion/react';
import { Users, UserCheck, UserMinus, Briefcase } from 'lucide-react';
import { Employee } from '../types';

interface DashboardProps {
  employees: Employee[];
}

export default function Dashboard({ employees }: DashboardProps) {
  const activeEmployees = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const terminated = employees.filter(e => e.status === 'Terminated').length;

  const stats = [
    { label: 'Total Employees', value: employees.length, icon: Users },
    { label: 'Active', value: activeEmployees, icon: UserCheck },
    { label: 'On Leave', value: onLeave, icon: Briefcase },
    { label: 'Terminated', value: terminated, icon: UserMinus },
  ];

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-6xl mx-auto flex flex-col gap-6"
    >
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        {stats.map((stat, i) => {
          const Icon = stat.icon;
          return (
            <motion.div 
              key={stat.label}
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: i * 0.1 }}
              className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] border-t-[4px] border-[#4A90E2] p-5"
            >
              <div className="flex items-center justify-between">
                <div>
                  <div className="text-[12px] uppercase text-[#718096] tracking-[0.5px]">{stat.label}</div>
                  <div className="text-[24px] font-bold text-[#333] mt-1">{stat.value}</div>
                </div>
                <div className="text-[#4A90E2] opacity-80">
                  <Icon className="w-8 h-8" />
                </div>
              </div>
            </motion.div>
          );
        })}
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex flex-col flex-grow">
        <div className="px-6 py-5 border-b border-[#F0F2F5] flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-[#333]">Recent Employee Updates</h2>
          <button className="px-3 py-1.5 bg-[#EDF2F7] text-[#4A5568] border-none rounded-[4px] text-[12px] cursor-pointer hover:bg-[#E2E8F0] transition-colors">
            View All Records
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Employee</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Department</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Position</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Status</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Date Joined</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.slice(0, 5).map((employee) => (
                <tr key={employee.id} className="hover:bg-[#FAFBFC] transition-colors">
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-[14px]">
                    <div className="flex items-center gap-3">
                      <img src={employee.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-[#E2E8F0] object-cover" />
                      <span className="font-medium text-[#333]">{employee.firstName} {employee.lastName}</span>
                    </div>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-[14px] text-[#333]">{employee.department}</td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-[14px] text-[#333]">{employee.role}</td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <span className={`px-[10px] py-[4px] rounded-[12px] text-[11px] font-semibold inline-block uppercase ${
                      employee.status === 'Active' ? 'bg-[#E6FFFA] text-[#2C7A7B]' :
                      employee.status === 'On Leave' ? 'bg-[#FFF5F5] text-[#C53030]' :
                      'bg-[#EDF2F7] text-[#4A5568]'
                    }`}>
                      {employee.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5] text-[14px] text-[#333]">
                    {new Date(employee.joinDate).toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' })}
                  </td>
                  <td className="px-6 py-4 border-b border-[#F0F2F5]">
                    <button className="px-3 py-1.5 bg-[#4A90E2] text-white border-none rounded-[4px] text-[12px] cursor-pointer hover:bg-[#3A80D2] transition-colors">
                      Manage
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
