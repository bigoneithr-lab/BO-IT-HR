import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { Calendar as CalendarIcon, CheckCircle2, XCircle, Clock, CheckSquare, AlertCircle, Coffee } from 'lucide-react';
import { collection, onSnapshot, setDoc, doc, query, where } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { handleFirestoreError, OperationType } from '../lib/firebase-utils';
import { Employee, AttendanceRecord, CompanySettings } from '../types';

interface AttendanceProps {
  employees: Employee[];
  isAdmin: boolean;
  settings: CompanySettings | null;
  currentUserEmail?: string | null;
}

export default function Attendance({ employees, isAdmin, settings, currentUserEmail }: AttendanceProps) {
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});

  useEffect(() => {
    if (!selectedDate) return;
    
    const q = query(collection(db, 'attendance'), where('date', '==', selectedDate));
    const unsubscribe = onSnapshot(q, (snapshot) => {
      const records: Record<string, AttendanceRecord> = {};
      snapshot.forEach(doc => {
        const data = doc.data() as AttendanceRecord;
        records[data.employeeId] = { id: doc.id, ...data };
      });
      setAttendance(records);
    }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));
    
    return () => unsubscribe();
  }, [selectedDate]);

  const handleStatusChange = async (employeeId: string, status: AttendanceRecord['status']) => {
    if (!isAdmin) return;
    
    const recordId = `${employeeId}_${selectedDate}`;
    const month = selectedDate.substring(0, 7);
    
    try {
      await setDoc(doc(db, 'attendance', recordId), {
        employeeId,
        date: selectedDate,
        month,
        status,
        markedBy: auth.currentUser?.email || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${recordId}`);
    }
  };

  const calculateLateMinutes = (checkInTime: string) => {
    if (!settings?.workStartTime || !checkInTime) return 0;
    
    let [startH, startM] = settings.workStartTime.split(':').map(Number);
    let [checkInH, checkInM] = checkInTime.split(':').map(Number);
    
    // Handle night shift wrap-around (if time is AM, add 24 hours for comparison)
    if (startH < 12) startH += 24;
    if (checkInH < 12) checkInH += 24;
    
    const startTotal = startH * 60 + startM;
    const checkInTotal = checkInH * 60 + checkInM;
    
    return Math.max(0, checkInTotal - startTotal);
  };

  const handleCheckInChange = async (employeeId: string, checkIn: string) => {
    if (!isAdmin) return;
    
    const recordId = `${employeeId}_${selectedDate}`;
    const month = selectedDate.substring(0, 7);
    const lateMinutes = calculateLateMinutes(checkIn);
    const isLate = lateMinutes > 0;
    
    try {
      await setDoc(doc(db, 'attendance', recordId), {
        employeeId,
        date: selectedDate,
        month,
        checkIn,
        isLate,
        lateMinutes,
        status: attendance[employeeId]?.status || 'Present', // Default to present if setting check-in
        markedBy: auth.currentUser?.email || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${recordId}`);
    }
  };

  const currentEmployee = employees.find(emp => emp.email === currentUserEmail);
  const currentEmployeeRecord = currentEmployee ? attendance[currentEmployee.id] : null;

  const handleSelfCheckIn = async () => {
    if (!currentEmployee) return;
    
    const now = new Date();
    const checkInTime = now.toLocaleTimeString('en-US', { hour12: false, hour: '2-digit', minute: '2-digit' });
    const todayDate = now.toISOString().split('T')[0];
    
    const recordId = `${currentEmployee.id}_${todayDate}`;
    const month = todayDate.substring(0, 7);
    const lateMinutes = calculateLateMinutes(checkInTime);
    const isLate = lateMinutes > 0;
    
    try {
      await setDoc(doc(db, 'attendance', recordId), {
        employeeId: currentEmployee.id,
        date: todayDate,
        month,
        checkIn: checkInTime,
        isLate,
        lateMinutes,
        status: 'Present',
        markedBy: currentEmployee.email,
        updatedAt: new Date().toISOString()
      }, { merge: true });
      
      // If they are checking in on a different date than currently selected, switch to today
      if (selectedDate !== todayDate) {
        setSelectedDate(todayDate);
      }
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${recordId}`);
    }
  };

  const markAllPresent = async () => {
    if (!isAdmin) return;
    if (!window.confirm(`Mark all unmarked employees as Present for ${selectedDate}?`)) return;

    const month = selectedDate.substring(0, 7);
    const promises = employees.map(emp => {
      if (!attendance[emp.id]) {
        const recordId = `${emp.id}_${selectedDate}`;
        const checkIn = settings?.workStartTime || '21:00';
        return setDoc(doc(db, 'attendance', recordId), {
          employeeId: emp.id,
          date: selectedDate,
          month,
          status: 'Present',
          checkIn,
          isLate: false,
          lateMinutes: 0,
          markedBy: auth.currentUser?.email || 'System',
          updatedAt: new Date().toISOString()
        }, { merge: true });
      }
      return Promise.resolve();
    });

    try {
      await Promise.all(promises);
    } catch (error) {
      console.error("Failed to mark all present", error);
    }
  };

  const getStatusBadge = (status?: string) => {
    switch (status) {
      case 'Present': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#E6FFFA] text-[#2C7A7B]"><CheckCircle2 className="w-3 h-3"/> Present</span>;
      case 'Absent': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#FFF5F5] text-[#C53030]"><XCircle className="w-3 h-3"/> Absent</span>;
      case 'Half Day': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#FEFCBF] text-[#975A16]"><Clock className="w-3 h-3"/> Half Day</span>;
      case 'On Leave': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#EBF4FF] text-[#2B6CB0]"><CalendarIcon className="w-3 h-3"/> On Leave</span>;
      case 'Late': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#FFEDD5] text-[#C2410C]"><AlertCircle className="w-3 h-3"/> Late</span>;
      case 'Off Day': return <span className="px-[10px] py-[4px] inline-flex items-center gap-1 text-[11px] font-semibold rounded-[12px] uppercase bg-[#F1F5F9] text-[#475569]"><Coffee className="w-3 h-3"/> Off Day</span>;
      default: return <span className="px-[10px] py-[4px] inline-flex text-[11px] font-semibold rounded-[12px] uppercase bg-[#EDF2F7] text-[#4A5568]">Not Marked</span>;
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
          <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Daily Attendance</h1>
          <p className="text-[13px] md:text-[14px] text-[#718096] mt-1">Track daily attendance to automatically sync with payroll.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          {currentEmployee && selectedDate === new Date().toISOString().split('T')[0] && !currentEmployeeRecord?.checkIn && (
            <button 
              onClick={handleSelfCheckIn}
              className="flex-1 sm:flex-none justify-center bg-[#48BB78] hover:bg-[#38A169] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors"
            >
              <Clock className="w-4 h-4 ml-auto sm:ml-0" />
              <span className="mr-auto sm:mr-0">Check In Now</span>
            </button>
          )}
          <div className="flex-1 sm:flex-none justify-center flex items-center gap-2 bg-white border border-[#E2E8F0] rounded-[4px] px-3 py-2 w-full sm:w-auto">
            <CalendarIcon className="w-4 h-4 text-[#718096]" />
            <input 
              type="date" 
              value={selectedDate}
              onChange={(e) => setSelectedDate(e.target.value)}
              className="text-[14px] text-[#333] focus:outline-none bg-transparent w-full"
            />
          </div>
          {isAdmin && (
            <button 
              onClick={markAllPresent}
              className="flex-1 sm:flex-none justify-center bg-[#4A90E2] hover:bg-[#3A80D2] text-white px-4 py-2 rounded-[4px] text-[14px] font-medium flex items-center gap-2 transition-colors w-full sm:w-auto"
            >
              <CheckSquare className="w-4 h-4 ml-auto sm:ml-0" />
              <span className="mr-auto sm:mr-0">Mark All Present</span>
            </button>
          )}
        </div>
      </div>

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          <table className="w-full text-left border-collapse min-w-[800px]">
            <thead className="bg-[#FAFBFC] sticky top-0 z-10">
              <tr>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Department</th>
                <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                {isAdmin && <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Check In</th>}
                {isAdmin && <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-right">Mark Attendance</th>}
              </tr>
            </thead>
            <tbody className="bg-white">
              {(isAdmin ? employees : employees.filter(e => e.email === currentUserEmail)).map(emp => {
                const record = attendance[emp.id];
                return (
                  <tr key={emp.id} className="hover:bg-[#FAFBFC] transition-colors">
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="flex items-center gap-3">
                        <img src={emp.avatarUrl} alt="" className="w-8 h-8 rounded-full bg-[#E2E8F0] object-cover" />
                        <div>
                          <div className="font-medium text-[14px] text-[#333]">{emp.firstName} {emp.lastName}</div>
                          <div className="text-[12px] text-[#718096]">{emp.role}</div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="text-[14px] text-[#4A5568]">{emp.department}</div>
                    </td>
                    <td className="px-6 py-4 border-b border-[#F0F2F5]">
                      <div className="flex flex-col gap-1 items-start">
                        {getStatusBadge(record?.status)}
                        {record?.isLate && (
                          <span className="text-[11px] font-medium text-[#C53030]">
                            Late: {record.lateMinutes} mins
                          </span>
                        )}
                      </div>
                    </td>
                    {isAdmin && (
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        <input 
                          type="time" 
                          value={record?.checkIn || ''}
                          onChange={(e) => handleCheckInChange(emp.id, e.target.value)}
                          className={`text-[13px] border rounded-[4px] px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#4A90E2] ${record?.isLate ? 'border-[#FC8181] text-[#C53030]' : 'border-[#E2E8F0] text-[#4A5568]'}`}
                        />
                      </td>
                    )}
                    {isAdmin && (
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-right">
                        <select 
                          value={record?.status || ''}
                          onChange={(e) => handleStatusChange(emp.id, e.target.value as AttendanceRecord['status'])}
                          className="text-[13px] border border-[#E2E8F0] rounded-[4px] px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#4A90E2] text-[#4A5568]"
                        >
                          <option value="" disabled>Select Status</option>
                          <option value="Present">Present</option>
                          <option value="Absent">Absent</option>
                          <option value="Half Day">Half Day</option>
                          <option value="On Leave">On Leave</option>
                          <option value="Late">Late</option>
                          <option value="Off Day">Off Day</option>
                        </select>
                      </td>
                    )}
                  </tr>
                );
              })}
              {employees.length === 0 && (
                <tr>
                  <td colSpan={isAdmin ? 4 : 3} className="px-6 py-16 text-center text-[#718096]">
                    No employees found.
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
