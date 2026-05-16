import { motion } from 'motion/react';
import { Users, UserCheck, UserMinus, Briefcase, Megaphone, Calendar, AlertTriangle } from 'lucide-react';
import { Employee, Department } from '../types';
import { useState, useEffect } from 'react';
import { collection, query, orderBy, limit, onSnapshot } from 'firebase/firestore';
import { db } from '../firebase';
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Legend
} from 'recharts';

interface DashboardProps {
  employees: Employee[];
  departments: Department[];
}

export default function Dashboard({ employees, departments }: DashboardProps) {
  const [recentNotices, setRecentNotices] = useState<any[]>([]);
  const activeEmployees = employees.filter(e => e.status === 'Active').length;

  useEffect(() => {
    const q = query(
      collection(db, 'notices'), 
      orderBy('createdAt', 'desc'), 
      limit(3)
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setRecentNotices(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
    });
    return () => unsubscribe();
  }, []);

  const activeEmployeesCount = employees.filter(e => e.status === 'Active').length;
  const onLeave = employees.filter(e => e.status === 'On Leave').length;
  const nonTerminatedEmployees = employees.filter(e => e.status !== 'Terminated');
  const count = nonTerminatedEmployees.length;

  const stats = [
    { label: 'Total Employees', value: count, icon: Users },
    { label: 'Active', value: activeEmployees, icon: UserCheck },
    { label: 'On Leave', value: onLeave, icon: Briefcase },
    { label: 'Departments', value: departments.length, icon: UserMinus },
  ];

  const getNoticeIcon = (type: string) => {
    switch (type) {
      case 'Holiday': return <Calendar className="w-4 h-4 text-[#4A90E2]" />;
      case 'Urgent': return <AlertTriangle className="w-4 h-4 text-[#E53E3E]" />;
      default: return <Megaphone className="w-4 h-4 text-[#38A169]" />;
    }
  };

  const getNoticeTheme = (type: string) => {
    switch (type) {
      case 'Holiday': return 'bg-[#EBF8FF] text-[#2B6CB0] border-[#BEE3F8]';
      case 'Urgent': return 'bg-[#FFF5F5] text-[#C53030] border-[#FED7D7]';
      default: return 'bg-[#F0FFF4] text-[#2F855A] border-[#C6F6D5]';
    }
  };

  // Prepare data for Headcount by Department
  const departmentData = departments.map(dept => {
    return {
      name: dept.name,
      count: nonTerminatedEmployees.filter(e => e.department === dept.name).length
    };
  }).filter(d => d.count > 0);

  // Prepare data for Employee Status
  const statusData = [
    { name: 'Active', value: activeEmployees, color: '#4A90E2' },
    { name: 'On Leave', value: onLeave, color: '#F5A623' },
  ].filter(d => d.value > 0);

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

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Headcount by Department Chart */}
        <div className="lg:col-span-2 bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6">
          <h2 className="text-[16px] font-semibold text-[#333] mb-6">Headcount by Department</h2>
          <div className="h-[300px]">
            {departmentData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={departmentData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#E2E8F0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12 }} />
                  <YAxis axisLine={false} tickLine={false} tick={{ fill: '#718096', fontSize: 12 }} allowDecimals={false} />
                  <Tooltip 
                    cursor={{ fill: '#F7FAFC' }}
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Bar dataKey="count" fill="#4A90E2" radius={[4, 4, 0, 0]} barSize={40} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A0AEC0] text-[14px]">
                No department data available
              </div>
            )}
          </div>
        </div>

        {/* Latest Announcements */}
        <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex flex-col">
          <div className="p-5 border-b border-[#F0F2F5] flex items-center justify-between">
            <h2 className="text-[16px] font-semibold text-[#333]">Notice Board</h2>
            <Megaphone className="w-4 h-4 text-[#718096]" />
          </div>
          <div className="p-5 space-y-4 flex-1">
            {recentNotices.length > 0 ? (
              recentNotices.map((notice) => (
                <div key={notice.id} className="p-3 rounded-[6px] border border-[#F0F2F5] hover:border-[#E2E8F0] transition-colors">
                  <div className="flex items-start gap-3">
                    <div className={`p-2 rounded-[6px] border ${getNoticeTheme(notice.type)}`}>
                      {getNoticeIcon(notice.type)}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h4 className="text-[13px] font-semibold text-[#2D3748] truncate">{notice.title}</h4>
                        {notice.isPinned && (
                          <span className="flex-shrink-0 text-[10px] bg-[#EBF8FF] text-[#2B6CB0] px-1.5 py-0.5 rounded font-bold uppercase">PIN</span>
                        )}
                      </div>
                      <p className="text-[12px] text-[#718096] line-clamp-2 mt-1 leading-snug">
                        {notice.content}
                      </p>
                      <div className="text-[10px] text-[#A0AEC0] mt-2 flex items-center gap-1">
                        <span>{notice.createdAt?.toDate().toLocaleDateString('en-US', { month: 'short', day: 'numeric' })}</span>
                        <span>•</span>
                        <span>{notice.type}</span>
                      </div>
                    </div>
                  </div>
                </div>
              ))
            ) : (
              <div className="h-full flex flex-col items-center justify-center text-center py-10">
                <Megaphone className="w-8 h-8 text-[#E2E8F0] mb-2" />
                <p className="text-[13px] text-[#A0AEC0]">No recent announcements</p>
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Employee Status Chart */}
        <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] p-6">
          <h2 className="text-[16px] font-semibold text-[#333] mb-6">Employee Status</h2>
          <div className="h-[300px]">
            {statusData.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={statusData}
                    cx="50%"
                    cy="50%"
                    innerRadius={60}
                    outerRadius={100}
                    paddingAngle={2}
                    dataKey="value"
                  >
                    {statusData.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip 
                    contentStyle={{ borderRadius: '8px', border: 'none', boxShadow: '0 4px 6px rgba(0,0,0,0.1)' }}
                  />
                  <Legend verticalAlign="bottom" height={36} iconType="circle" wrapperStyle={{ fontSize: '12px', color: '#718096' }} />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-[#A0AEC0] text-[14px]">
                No status data available
              </div>
            )}
          </div>
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex flex-col flex-grow">
        <div className="px-6 py-5 border-b border-[#F0F2F5] flex justify-between items-center">
          <h2 className="text-[16px] font-semibold text-[#333]">Recent Employee Updates</h2>
          <button className="px-3 py-1.5 bg-[#EDF2F7] text-[#4A5568] border-none rounded-[4px] text-[12px] cursor-pointer hover:bg-[#E2E8F0] transition-colors">
            View All Records
          </button>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full border-collapse text-left min-w-[800px]">
            <thead>
              <tr>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Employee</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Department</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Position</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Status</th>
                <th className="px-6 py-3 text-[12px] uppercase text-[#718096] bg-[#FAFBFC] border-b border-[#F0F2F5] font-normal">Date Joined</th>
              </tr>
            </thead>
            <tbody>
              {nonTerminatedEmployees.slice(0, 5).map((employee) => (
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
                </tr>
              ))}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={5} className="px-6 py-12 text-center text-[#718096] border-b border-[#F0F2F5]">
                    No recent updates found.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </motion.div>
  );
}
