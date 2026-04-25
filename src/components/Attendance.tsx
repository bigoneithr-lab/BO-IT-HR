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
  const getTodayBD = () => new Date().toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' });

  const [selectedDate, setSelectedDate] = useState<string>(getTodayBD());
  const [viewMode, setViewMode] = useState<'daily' | 'monthly'>('daily');
  const [attendance, setAttendance] = useState<Record<string, AttendanceRecord>>({});
  const [monthlyAttendance, setMonthlyAttendance] = useState<Record<string, AttendanceRecord[]>>({});

  useEffect(() => {
    if (!selectedDate) return;
    
    let q;
    if (viewMode === 'daily') {
      if (isAdmin) {
        q = query(collection(db, 'attendance'), where('date', '==', selectedDate));
      } else {
        const currentEmp = employees.find(e => e.email === currentUserEmail);
        if (!currentEmp) return;
        q = query(collection(db, 'attendance'), where('date', '==', selectedDate), where('employeeId', '==', currentEmp.id));
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records: Record<string, AttendanceRecord> = {};
        snapshot.forEach(doc => {
          const data = doc.data() as AttendanceRecord;
          records[data.employeeId] = { id: doc.id, ...data };
        });
        setAttendance(records);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));
      
      return () => unsubscribe();
    } else {
      const month = selectedDate.substring(0, 7);
      if (isAdmin) {
        q = query(collection(db, 'attendance'), where('month', '==', month));
      } else {
        const currentEmp = employees.find(e => e.email === currentUserEmail);
        if (!currentEmp) return;
        q = query(collection(db, 'attendance'), where('month', '==', month), where('employeeId', '==', currentEmp.id));
      }
      
      const unsubscribe = onSnapshot(q, (snapshot) => {
        const records: Record<string, AttendanceRecord[]> = {};
        snapshot.forEach(doc => {
          const data = doc.data() as AttendanceRecord;
          if (!records[data.employeeId]) records[data.employeeId] = [];
          records[data.employeeId].push({ id: doc.id, ...data });
        });
        setMonthlyAttendance(records);
      }, (error) => handleFirestoreError(error, OperationType.LIST, 'attendance'));
      
      return () => unsubscribe();
    }
  }, [selectedDate, viewMode, employees, isAdmin, currentUserEmail]);

  const handleStatusChange = async (employeeId: string, status: AttendanceRecord['status']) => {
    if (!isAdmin) return;
    
    const recordId = `${employeeId}_${selectedDate}`;
    const month = selectedDate.substring(0, 7);
    
    let targetStatus = status;
    const existingRecord = attendance[employeeId];
    
    // If setting to Present, check if it should be Late based on existing check-in
    if (status === 'Present' && existingRecord?.checkIn) {
      const lateMinutes = calculateLateMinutes(existingRecord.checkIn);
      if (lateMinutes > 0) {
        targetStatus = 'Late';
      }
    }
    
    try {
      await setDoc(doc(db, 'attendance', recordId), {
        employeeId,
        date: selectedDate,
        month,
        status: targetStatus,
        markedBy: auth.currentUser?.email || 'Admin',
        updatedAt: new Date().toISOString()
      }, { merge: true });
    } catch (error) {
      handleFirestoreError(error, OperationType.UPDATE, `attendance/${recordId}`);
    }
  };

  const calculateLateMinutes = (checkInTime: string) => {
    if (!checkInTime) return 0;
    
    const getAdjustedTotal = (timeStr: string) => {
      let [h, m] = timeStr.split(':').map(Number);
      if (h < 12) h += 24;
      return h * 60 + m;
    };
    
    const checkInTotal = getAdjustedTotal(checkInTime);
    const thresholdTotal = getAdjustedTotal('21:00'); // 9 PM Hard Limit
    
    let baseLateMinutes = 0;
    if (settings?.workStartTime) {
      const startTotal = getAdjustedTotal(settings.workStartTime);
      baseLateMinutes = Math.max(0, checkInTotal - startTotal);
    }
    
    const extraLateMinutes = Math.max(0, checkInTotal - thresholdTotal);
    
    return Math.max(baseLateMinutes, extraLateMinutes);
  };

  const handleCheckInChange = async (employeeId: string, checkIn: string) => {
    if (!isAdmin) return;
    
    const recordId = `${employeeId}_${selectedDate}`;
    const month = selectedDate.substring(0, 7);
    const lateMinutes = calculateLateMinutes(checkIn);
    const isLate = lateMinutes > 0;
    
    try {
      // Auto-update status based on check-in time
      const currentStatus = attendance[employeeId]?.status || 'Present';
      let targetStatus = currentStatus;
      
      if (isLate) {
        targetStatus = 'Late';
      } else if (currentStatus === 'Late' || currentStatus === 'Absent') {
        targetStatus = 'Present';
      }

      await setDoc(doc(db, 'attendance', recordId), {
        employeeId,
        date: selectedDate,
        month,
        checkIn,
        isLate,
        lateMinutes,
        status: targetStatus,
        markedBy: auth.currentUser?.email || 'Admin',
        checkInMethod: 'manual',
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
    
    let now = new Date();
    try {
      const response = await fetch('https://worldtimeapi.org/api/timezone/Asia/Dhaka');
      const data = await response.json();
      now = new Date(data.datetime);
    } catch (error) {
      console.warn("Failed to fetch BD time from internet, falling back to local time", error);
    }

    const checkInTime = now.toLocaleTimeString('en-US', { timeZone: 'Asia/Dhaka', hour12: false, hour: '2-digit', minute: '2-digit' });
    const todayDate = now.toLocaleDateString('en-CA', { timeZone: 'Asia/Dhaka' }); // YYYY-MM-DD format
    
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
        status: isLate ? 'Late' : 'Present', // Auto status change
        markedBy: currentEmployee.email,
        checkInMethod: 'auto',
        updatedAt: now.toISOString()
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
        const lateMinutes = calculateLateMinutes(checkIn);
        const isLate = lateMinutes > 0;
        
        return setDoc(doc(db, 'attendance', recordId), {
          employeeId: emp.id,
          date: selectedDate,
          month,
          status: isLate ? 'Late' : 'Present',
          checkIn,
          isLate,
          lateMinutes,
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

  const dailySummary = {
    present: Object.values(attendance).filter(r => r.status === 'Present' || r.status === 'Late').length,
    late: Object.values(attendance).filter(r => r.status === 'Late' || r.isLate).length,
    absent: Object.values(attendance).filter(r => r.status === 'Absent').length,
    halfDay: Object.values(attendance).filter(r => r.status === 'Half Day').length,
    onLeave: Object.values(attendance).filter(r => r.status === 'On Leave').length,
    offDay: Object.values(attendance).filter(r => r.status === 'Off Day').length,
    total: employees.length,
    notMarked: employees.length - Object.keys(attendance).length
  };

  return (
    <motion.div 
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      className="max-w-7xl mx-auto h-full flex flex-col gap-6"
    >
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <h1 className="text-[20px] md:text-[24px] font-bold text-[#333]">Attendance</h1>
          <p className="text-[13px] md:text-[14px] text-[#718096] mt-1">Track attendance and view monthly summaries.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3 w-full sm:w-auto">
          <div className="flex bg-[#F0F2F5] p-1 rounded-[6px] mr-2">
            <button
              onClick={() => setViewMode('daily')}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-[4px] transition-colors ${viewMode === 'daily' ? 'bg-white text-[#333] shadow-sm' : 'text-[#718096] hover:text-[#333]'}`}
            >
              Daily
            </button>
            <button
              onClick={() => setViewMode('monthly')}
              className={`px-4 py-1.5 text-[13px] font-medium rounded-[4px] transition-colors ${viewMode === 'monthly' ? 'bg-white text-[#333] shadow-sm' : 'text-[#718096] hover:text-[#333]'}`}
            >
              Monthly Summary
            </button>
          </div>
          {currentEmployee && selectedDate === getTodayBD() && !currentEmployeeRecord?.checkIn && viewMode === 'daily' && (
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
              type={viewMode === 'monthly' ? "month" : "date"}
              value={viewMode === 'monthly' ? selectedDate.substring(0, 7) : selectedDate}
              onChange={(e) => {
                if (viewMode === 'monthly') {
                  setSelectedDate(`${e.target.value}-01`);
                } else {
                  setSelectedDate(e.target.value);
                }
              }}
              className="text-[14px] text-[#333] focus:outline-none bg-transparent w-full"
            />
          </div>
          {isAdmin && viewMode === 'daily' && (
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

      {viewMode === 'daily' && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="text-[14px] font-bold text-[#333] uppercase tracking-wider">Daily Attendance Summary</h3>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-3">
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Present</div>
              <div className="text-[20px] font-bold text-[#2C7A7B]">{dailySummary.present}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Late</div>
              <div className="text-[20px] font-bold text-[#C2410C]">{dailySummary.late}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Absent</div>
              <div className="text-[20px] font-bold text-[#C53030]">{dailySummary.absent}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Half Day</div>
              <div className="text-[20px] font-bold text-[#975A16]">{dailySummary.halfDay}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">On Leave</div>
              <div className="text-[20px] font-bold text-[#2B6CB0]">{dailySummary.onLeave}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Off Day</div>
              <div className="text-[20px] font-bold text-[#475569]">{dailySummary.offDay}</div>
            </div>
            <div className="bg-white p-3 rounded-[8px] border border-[#E2E8F0] shadow-sm">
              <div className="text-[10px] text-[#718096] uppercase font-bold tracking-wider mb-1">Not Marked</div>
              <div className="text-[20px] font-bold text-[#A0AEC0]">{dailySummary.notMarked}</div>
            </div>
          </div>
        </div>
      )}

      <div className="bg-[#FFFFFF] rounded-[8px] shadow-[0_1px_3px_rgba(0,0,0,0.1)] flex-1 overflow-hidden">
        <div className="overflow-x-auto h-full">
          {viewMode === 'daily' ? (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#FAFBFC] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Department</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Status</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Check In</th>
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
                      <td className="px-6 py-4 border-b border-[#F0F2F5]">
                        {isAdmin ? (
                          <div>
                            <input 
                              type="time" 
                              value={record?.checkIn || ''}
                              onChange={(e) => handleCheckInChange(emp.id, e.target.value)}
                              className={`text-[13px] border rounded-[4px] px-2 py-1.5 bg-white focus:outline-none focus:ring-1 focus:ring-[#4A90E2] ${record?.isLate ? 'border-[#FC8181] text-[#C53030]' : 'border-[#E2E8F0] text-[#4A5568]'}`}
                            />
                            {record?.checkIn && (
                              <div className="text-[10px] text-[#A0AEC0] mt-1 space-y-0.5">
                                {record.checkInMethod === 'manual' ? (
                                  <span className="flex items-center gap-1 text-[#D69E2E]"><AlertCircle className="w-3 h-3"/> Edited Manually</span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[#38A169]"><CheckCircle2 className="w-3 h-3"/> Auto (Internet Time)</span>
                                )}
                                {record.markedBy !== emp.email && <span className="block italic truncate overflow-hidden max-w-[120px]" title={record.markedBy}>by {record.markedBy}</span>}
                              </div>
                            )}
                          </div>
                        ) : (
                          <span className={`text-[13px] font-medium ${record?.isLate ? 'text-[#C53030]' : 'text-[#4A5568]'}`}>
                            {record?.checkIn || '-'}
                          </span>
                        )}
                      </td>
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
                    <td colSpan={isAdmin ? 5 : 4} className="px-6 py-16 text-center text-[#718096]">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          ) : (
            <table className="w-full text-left border-collapse min-w-[800px]">
              <thead className="bg-[#FAFBFC] sticky top-0 z-10">
                <tr>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5]">Employee</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">Present</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">Late</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">Absent</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">Half Day</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">On Leave</th>
                  <th className="px-6 py-3 text-[12px] font-normal text-[#718096] uppercase border-b border-[#F0F2F5] text-center">Total Working Days</th>
                </tr>
              </thead>
              <tbody className="bg-white">
                {(isAdmin ? employees : employees.filter(e => e.email === currentUserEmail)).map(emp => {
                  const records = monthlyAttendance[emp.id] || [];
                  const present = records.filter(r => r.status === 'Present' || r.status === 'Late').length;
                  const late = records.filter(r => r.status === 'Late' || r.isLate).length;
                  const absent = records.filter(r => r.status === 'Absent').length;
                  const halfDay = records.filter(r => r.status === 'Half Day').length;
                  const onLeave = records.filter(r => r.status === 'On Leave').length;
                  
                  const total = present;
                  
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
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#38A169]">{present}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#DD6B20]">{late}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#E53E3E]">{absent}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#D69E2E]">{halfDay}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#3182CE]">{onLeave}</span>
                      </td>
                      <td className="px-6 py-4 border-b border-[#F0F2F5] text-center">
                        <span className="text-[14px] font-semibold text-[#4A5568]">{total}</span>
                      </td>
                    </tr>
                  );
                })}
                {employees.length === 0 && (
                  <tr>
                    <td colSpan={7} className="px-6 py-16 text-center text-[#718096]">
                      No employees found.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </motion.div>
  );
}
