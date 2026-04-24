import React, { useState, useEffect } from 'react';
import { onAuthStateChanged, signInWithPopup, signInWithEmailAndPassword, createUserWithEmailAndPassword, signOut, User } from 'firebase/auth';
import { collection, onSnapshot, doc, getDocFromServer, setDoc, updateDoc } from 'firebase/firestore';
import { auth, googleProvider, db } from './firebase';
import { handleFirestoreError, OperationType } from './lib/firebase-utils';
import Sidebar from './components/Sidebar';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import EmployeeList from './components/EmployeeList';
import AccessRequests from './components/AccessRequests';
import EmployeeProfile from './components/EmployeeProfile';
import LeaveManagement from './components/LeaveManagement';
import Departments from './components/Departments';
import AIAssistant from './components/AIAssistant';
import RecruitmentBoard from './components/RecruitmentBoard';
import Settings from './components/Settings';
import Payroll from './components/Payroll';
import Performance from './components/Performance';
import DocumentVault from './components/DocumentVault';
import Attendance from './components/Attendance';
import { Employee, Department, Applicant, CompanySettings } from './types';

export default function App() {
  const [currentView, setCurrentView] = useState<'dashboard' | 'employees' | 'access-requests' | 'profile' | 'time-off' | 'departments' | 'ai-assistant' | 'recruitment' | 'settings' | 'payroll' | 'performance' | 'documents' | 'attendance'>(() => {
    return (localStorage.getItem('hr_currentView') || 'dashboard') as any;
  });

  useEffect(() => {
    localStorage.setItem('hr_currentView', currentView);
  }, [currentView]);

  const [employees, setEmployees] = useState<Employee[]>([]);
  const [departments, setDepartments] = useState<Department[]>([]);
  const [applicants, setApplicants] = useState<Applicant[]>([]);
  const [companySettings, setCompanySettings] = useState<CompanySettings | null>(null);
  const [selectedEmployeeId, setSelectedEmployeeId] = useState<string | null>(null);
  const [user, setUser] = useState<User | null>(null);
  const [isAuthReady, setIsAuthReady] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [appUserStatus, setAppUserStatus] = useState<'loading' | 'pending' | 'approved' | 'admin'>('loading');
  const [accessCodeInput, setAccessCodeInput] = useState('');
  const [codeError, setCodeError] = useState('');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [isEmailLogin, setIsEmailLogin] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [globalError, setGlobalError] = useState<string | null>(null);

  // Expose global error setter
  useEffect(() => {
    (window as any).setGlobalError = setGlobalError;
  }, []);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      if (!currentUser) {
        setIsAuthReady(true);
        setAppUserStatus('loading');
      }
    });
    return () => unsubscribe();
  }, []);

  const [userRole, setUserRole] = useState<'admin' | 'manager' | 'employee'>('employee');

  useEffect(() => {
    if (!user) return;

    if (user.email === 'bigoneithr@gmail.com' || user.email === 'bigoneit9326@gmail.com') {
      setAppUserStatus('admin');
      setUserRole('admin');
      setIsAuthReady(true);
      return;
    }

    const unsubscribe = onSnapshot(doc(db, 'users', user.uid), (docSnap) => {
      if (!docSnap.exists()) {
        const newCode = Math.floor(100000 + Math.random() * 900000).toString();
        setDoc(doc(db, 'users', user.uid), {
          email: user.email,
          displayName: user.displayName,
          status: 'pending',
          accessCode: newCode,
          role: 'employee'
        }).then(() => {
          setAppUserStatus('pending');
          setIsAuthReady(true);
        });
      } else {
        const data = docSnap.data();
        setAppUserStatus(data.status);
        setIsAuthReady(true);
      }
    });

    return () => unsubscribe();
  }, [user]);

  useEffect(() => {
    if (userRole === 'admin' || !user || employees.length === 0) return;
    const emp = employees.find(e => e.email === user.email);
    if (emp && emp.role.toLowerCase().includes('manager')) {
      setUserRole('manager');
    } else {
      setUserRole('employee');
    }
  }, [user, employees, userRole]);

  useEffect(() => {
    if (!isAuthReady || !user || (appUserStatus !== 'approved' && appUserStatus !== 'admin')) return;

    const unsubscribeEmp = onSnapshot(
      collection(db, 'employees'),
      (snapshot) => {
        const emps: Employee[] = [];
        snapshot.forEach((doc) => {
          emps.push({ id: doc.id, ...doc.data() } as Employee);
        });
        setEmployees(emps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'employees');
      }
    );

    const unsubscribeDept = onSnapshot(
      collection(db, 'departments'),
      (snapshot) => {
        const depts: Department[] = [];
        snapshot.forEach((doc) => {
          depts.push({ id: doc.id, ...doc.data() } as Department);
        });
        setDepartments(depts);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'departments');
      }
    );

    const unsubscribeApp = onSnapshot(
      collection(db, 'applicants'),
      (snapshot) => {
        const apps: Applicant[] = [];
        snapshot.forEach((doc) => {
          apps.push({ id: doc.id, ...doc.data() } as Applicant);
        });
        setApplicants(apps);
      },
      (error) => {
        handleFirestoreError(error, OperationType.LIST, 'applicants');
      }
    );

    const unsubscribeSettings = onSnapshot(
      doc(db, 'settings', 'company'),
      (docSnap) => {
        if (docSnap.exists()) {
          setCompanySettings(docSnap.data() as CompanySettings);
        } else {
          setCompanySettings({
            companyName: 'BO-IT HR',
            defaultCasualDays: 14,
            defaultSickDays: 10
          });
        }
      },
      (error) => {
        handleFirestoreError(error, OperationType.GET, 'settings/company');
      }
    );

    return () => {
      unsubscribeEmp();
      unsubscribeDept();
      unsubscribeApp();
      unsubscribeSettings();
    };
  }, [isAuthReady, user, appUserStatus]);

  const handleLogin = async () => {
    try {
      setAuthError(null);
      await signInWithPopup(auth, googleProvider);
    } catch (error: any) {
      setAuthError(error.message);
    }
  };

  const handleEmailLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      setAuthError(null);
      // Firebase requires 6 char passwords. If user types 12345, pad it to 123456
      const finalPassword = (loginEmail === 'bigoneit9326@gmail.com' && loginPassword === '12345') ? '123456' : loginPassword;
      await signInWithEmailAndPassword(auth, loginEmail, finalPassword);
    } catch (error: any) {
      if (error.code === 'auth/operation-not-allowed') {
        setAuthError('Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
        return;
      }
      // If user not found and it's the chairman email, auto-create it
      if (error.code === 'auth/user-not-found' || error.code === 'auth/invalid-credential' || error.message.includes('invalid-credential')) {
        if (loginEmail === 'bigoneit9326@gmail.com') {
          try {
            const finalPassword = loginPassword === '12345' ? '123456' : loginPassword;
            await createUserWithEmailAndPassword(auth, loginEmail, finalPassword);
            return;
          } catch (createError: any) {
            if (createError.code === 'auth/operation-not-allowed') {
              setAuthError('Email/Password sign-in is not enabled in Firebase Console. Please enable it in Authentication > Sign-in method.');
            } else {
              setAuthError(createError.message);
            }
            return;
          }
        }
      }
      setAuthError(error.message);
    }
  };

  const handleLogout = async () => {
    await signOut(auth);
    setAppUserStatus('loading');
    setCurrentView('dashboard');
  };

  const handleVerifyCode = async () => {
    if (!user || accessCodeInput.length !== 6) return;
    try {
      setCodeError('');
      await updateDoc(doc(db, 'users', user.uid), {
        status: 'approved',
        submittedCode: accessCodeInput
      });
    } catch (error) {
      setCodeError('Invalid access code. Please try again.');
    }
  };

  const handleViewProfile = (employee: Employee) => {
    setSelectedEmployeeId(employee.id);
    setCurrentView('profile');
  };

  if (!isAuthReady) {
    return <div className="flex h-screen items-center justify-center bg-[#F0F2F5] text-[#333]">Loading...</div>;
  }

  if (!user) {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F2F5] font-sans text-[#333]">
        <div className="bg-[#FFFFFF] p-8 rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] max-w-md w-full text-center">
          <h1 className="text-[24px] font-bold mb-2">{companySettings?.companyName || 'BO-IT HR'}</h1>
          <p className="text-[#718096] mb-6 text-[14px]">Please sign in to access the CRM.</p>
          {authError && <p className="text-[#C53030] bg-[#FFF5F5] p-3 rounded-[4px] mb-4 text-[13px]">{authError}</p>}
          
          {isEmailLogin ? (
            <form onSubmit={handleEmailLogin} className="space-y-4 text-left mb-6">
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Email</label>
                <input 
                  type="email" 
                  required
                  value={loginEmail}
                  onChange={e => setLoginEmail(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                />
              </div>
              <div>
                <label className="block text-[12px] font-medium text-[#718096] uppercase tracking-[0.5px] mb-1">Password</label>
                <input 
                  type="password" 
                  required
                  value={loginPassword}
                  onChange={e => setLoginPassword(e.target.value)}
                  className="w-full px-3 py-2 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] text-[14px] focus:outline-none focus:ring-1 focus:ring-[#4A90E2]"
                />
              </div>
              <button 
                type="submit"
                className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-2.5 rounded-[4px] font-medium transition-colors"
              >
                Sign in with Email
              </button>
            </form>
          ) : (
            <button 
              onClick={handleLogin}
              className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-2.5 rounded-[4px] font-medium transition-colors mb-4"
            >
              Sign in with Google
            </button>
          )}

          <div className="relative flex items-center py-2">
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
            <span className="flex-shrink-0 mx-4 text-[#A0AEC0] text-[12px]">OR</span>
            <div className="flex-grow border-t border-[#E2E8F0]"></div>
          </div>

          <button 
            onClick={() => setIsEmailLogin(!isEmailLogin)}
            className="w-full mt-4 bg-white border border-[#E2E8F0] hover:bg-[#F7FAFC] text-[#4A5568] py-2.5 rounded-[4px] font-medium transition-colors"
          >
            {isEmailLogin ? 'Continue with Google' : 'Sign in with Email'}
          </button>
        </div>
      </div>
    );
  }

  if (appUserStatus === 'pending') {
    return (
      <div className="flex h-screen items-center justify-center bg-[#F0F2F5] font-sans text-[#333]">
        <div className="bg-[#FFFFFF] p-8 rounded-[8px] shadow-[0_4px_12px_rgba(0,0,0,0.15)] max-w-md w-full text-center">
          <h1 className="text-[24px] font-bold mb-2">Access Required</h1>
          <p className="text-[#718096] mb-6 text-[14px]">
            An access code has been generated. The admin (bigoneithr@gmail.com) will email it to you shortly.
          </p>
          <div className="mb-6">
            <input 
              type="text"
              placeholder="Enter 6-digit code"
              value={accessCodeInput}
              onChange={e => setAccessCodeInput(e.target.value)}
              className="w-full text-center tracking-[0.5em] text-[20px] px-4 py-3 border border-[#E2E8F0] rounded-[4px] bg-[#F7FAFC] focus:outline-none focus:ring-2 focus:ring-[#4A90E2] transition-all"
              maxLength={6}
            />
          </div>
          {codeError && <p className="text-[#C53030] bg-[#FFF5F5] p-3 rounded-[4px] mb-4 text-[13px]">{codeError}</p>}
          <button 
            onClick={handleVerifyCode}
            className="w-full bg-[#4A90E2] hover:bg-[#3A80D2] text-white py-2.5 rounded-[4px] font-medium transition-colors mb-4"
          >
            Verify Code
          </button>
          <button 
            onClick={handleLogout}
            className="text-[13px] text-[#718096] hover:text-[#333] transition-colors"
          >
            Sign out and try another account
          </button>
        </div>
      </div>
    );
  }

  const selectedEmployee = employees.find(e => e.id === selectedEmployeeId);

  return (
    <div className="flex h-screen bg-[#F0F2F5] overflow-hidden font-sans text-[#333]">
      <Sidebar 
        currentView={currentView} 
        onViewChange={(view) => {
          setCurrentView(view);
          setIsMobileMenuOpen(false);
        }} 
        onLogout={handleLogout} 
        userRole={userRole}
        settings={companySettings}
        isMobileMenuOpen={isMobileMenuOpen}
        setIsMobileMenuOpen={setIsMobileMenuOpen}
      />
      <div className="flex-1 flex flex-col min-w-0 overflow-hidden relative">
        {globalError && (
          <div className="absolute top-0 left-0 right-0 z-50 bg-red-100 border-b border-red-400 text-red-700 px-4 py-3 text-xs w-full">
            <strong>Firestore Error Detected:</strong>
            <pre className="mt-2 overflow-auto max-h-32 bg-white/50 p-2 rounded">{globalError}</pre>
            <button onClick={() => setGlobalError(null)} className="absolute top-2 right-2 text-red-900 font-bold px-2">X</button>
          </div>
        )}
        <Header 
          user={user} 
          onMenuClick={() => setIsMobileMenuOpen(true)} 
        />
        <main className="flex-1 overflow-y-auto p-4 md:p-8">
          {currentView === 'dashboard' && <Dashboard employees={employees} departments={departments} />}
          {currentView === 'employees' && <EmployeeList employees={employees} departments={departments} onViewProfile={handleViewProfile} />}
          {currentView === 'recruitment' && <RecruitmentBoard applicants={applicants} departments={departments} />}
          {currentView === 'access-requests' && userRole === 'admin' && <AccessRequests />}
          {currentView === 'time-off' && <LeaveManagement employees={employees} isAdmin={userRole === 'admin' || userRole === 'manager'} currentUserEmail={user?.email} />}
          {currentView === 'departments' && <Departments employees={employees} departments={departments} isAdmin={userRole === 'admin' || userRole === 'manager'} />}
          {currentView === 'ai-assistant' && <AIAssistant />}
          {currentView === 'settings' && <Settings settings={companySettings} isAdmin={userRole === 'admin'} />}
          {currentView === 'payroll' && <Payroll employees={employees} isAdmin={userRole === 'admin' || userRole === 'manager'} settings={companySettings} currentUserEmail={user?.email} />}
          {currentView === 'performance' && <Performance employees={employees} isAdmin={userRole === 'admin' || userRole === 'manager'} currentUserEmail={user?.email} />}
          {currentView === 'documents' && <DocumentVault employees={employees} isAdmin={userRole === 'admin' || userRole === 'manager'} currentUserEmail={user?.email} />}
          {currentView === 'attendance' && <Attendance employees={employees} isAdmin={userRole === 'admin' || userRole === 'manager'} settings={companySettings} currentUserEmail={user?.email} />}
          {currentView === 'profile' && selectedEmployee && (
            <EmployeeProfile 
              employee={selectedEmployee} 
              onBack={() => setCurrentView('employees')} 
            />
          )}
        </main>
      </div>
    </div>
  );
}
