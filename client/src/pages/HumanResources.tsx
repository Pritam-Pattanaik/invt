import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import { hrAPI } from '../services/api';
import toast from 'react-hot-toast';
import { generateEmployeeReportPDF } from '../utils/pdfGenerator';

interface Employee {
  id: string;
  employeeId: string;
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  position: string;
  department: string;
  salary: number;
  joinDate: string;
  status: 'ACTIVE' | 'INACTIVE' | 'ON_LEAVE';
  address: string;
  emergencyContact: string;
  createdAt: string;
}

interface AttendanceRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  date: string;
  checkIn?: string;
  checkOut?: string;
  status: 'PRESENT' | 'ABSENT' | 'LATE' | 'HALF_DAY' | 'LEAVE';
  workingHours?: number;
  overtime?: number;
  notes?: string;
}

interface PayrollRecord {
  id: string;
  employeeId: string;
  employeeName: string;
  month: string;
  year: number;
  basicSalary: number;
  allowances: number;
  overtime: number;
  deductions: number;
  netSalary: number;
  status: 'PENDING' | 'PROCESSED' | 'PAID';
  payDate?: string;
}

interface TrainingProgram {
  id: string;
  title: string;
  description: string;
  instructor: string;
  startDate: string;
  endDate: string;
  duration: number; // in hours
  maxParticipants: number;
  enrolledCount: number;
  status: 'UPCOMING' | 'ONGOING' | 'COMPLETED' | 'CANCELLED';
  location: string;
  cost: number;
}

interface TrainingEnrollment {
  id: string;
  trainingId: string;
  employeeId: string;
  employeeName: string;
  enrollmentDate: string;
  status: 'ENROLLED' | 'COMPLETED' | 'DROPPED' | 'PENDING';
  completionDate?: string;
  score?: number;
  certificate?: string;
}

const HumanResources: React.FC = () => {
  const [currentView, setCurrentView] = useState<'employees' | 'attendance' | 'payroll' | 'training'>('employees');
  const [, setLoading] = useState(false);

  // Employees state
  const [employees, setEmployees] = useState<Employee[]>([]);
  const [showAddEmployee, setShowAddEmployee] = useState(false);
  const [employeeForm, setEmployeeForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    phone: '',
    position: '',
    department: '',
    salary: 0,
    joinDate: new Date().toISOString().split('T')[0],
    address: '',
    emergencyContact: ''
  });

  // Attendance state
  const [, setAttendanceRecords] = useState<AttendanceRecord[]>([]);
  const [selectedDate, setSelectedDate] = useState(new Date().toISOString().split('T')[0]);
  const [, setShowMarkAttendance] = useState(false);

  // Payroll state
  const [, setPayrollRecords] = useState<PayrollRecord[]>([]);
  const [selectedMonth, setSelectedMonth] = useState(new Date().getMonth() + 1);
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());
  const [, setShowProcessPayroll] = useState(false);

  // Training state
  const [, setTrainingPrograms] = useState<TrainingProgram[]>([]);
  const [, ] = useState<TrainingEnrollment[]>([]);
  const [, setShowAddTraining] = useState(false);
  const [, ] = useState({
    title: '',
    description: '',
    instructor: '',
    startDate: '',
    endDate: '',
    duration: 0,
    maxParticipants: 0,
    location: '',
    cost: 0
  });

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'hr/employees') {
        setCurrentView('employees');
      } else if (hash === 'hr/attendance') {
        setCurrentView('attendance');
      } else if (hash === 'hr/payroll') {
        setCurrentView('payroll');
      } else if (hash === 'hr/training') {
        setCurrentView('training');
      } else if (hash === 'hr') {
        setCurrentView('employees');
        window.location.hash = 'hr/employees';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Load data
  useEffect(() => {
    // Load mock data first to prevent undefined errors
    loadMockData();
    // Then try to load real data
    loadData();
  }, []);

  const loadData = async () => {
    setLoading(true);
    try {
      // Load employees
      const employeesResponse = await hrAPI.getEmployees();
      console.log('Employees API response:', employeesResponse);

      // Handle different response structures
      let employeesData = [];
      if (employeesResponse?.data?.employees) {
        employeesData = employeesResponse.data.employees;
      } else if (employeesResponse?.data?.employees) {
        employeesData = employeesResponse.data.employees;
      } else if (Array.isArray(employeesResponse?.data)) {
        employeesData = employeesResponse.data;
      } else if (Array.isArray(employeesResponse)) {
        employeesData = employeesResponse;
      }

      setEmployees(employeesData || []);

      // Load attendance for today
      const today = new Date().toISOString().split('T')[0];
      try {
        const attendanceResponse = await hrAPI.getAttendance({ date: today });
        setAttendanceRecords(attendanceResponse?.data?.attendance || []);
      } catch (attendanceError) {
        console.warn('Failed to load attendance data:', attendanceError);
        setAttendanceRecords([]);
      }

      // Load payroll for current month
      const currentMonth = new Date().getMonth() + 1;
      const currentYear = new Date().getFullYear();
      try {
        const payrollResponse = await hrAPI.getPayroll({ month: currentMonth, year: currentYear });
        setPayrollRecords(payrollResponse?.data?.payroll || []);
      } catch (payrollError) {
        console.warn('Failed to load payroll data:', payrollError);
        setPayrollRecords([]);
      }

      // Load training programs
      try {
        const trainingResponse = await hrAPI.getTrainingPrograms();
        setTrainingPrograms(trainingResponse?.data || trainingResponse || []);
      } catch (trainingError) {
        console.warn('Failed to load training data:', trainingError);
        setTrainingPrograms([]);
      }

    } catch (error) {
      console.error('Error loading HR data:', error);
      toast.error('Failed to load HR data');

      // Fallback to mock data if API fails
      loadMockData();
    } finally {
      setLoading(false);
    }
  };

  const loadMockData = () => {
    // Mock Employees as fallback
    const mockEmployees: Employee[] = [
      {
        id: '1',
        employeeId: 'EMP001',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh.kumar@rotifactory.com',
        phone: '+91 9876543210',
        position: 'Production Manager',
        department: 'Manufacturing',
        salary: 45000,
        joinDate: '2023-01-15',
        status: 'ACTIVE',
        address: '123 Main Street, Mumbai, Maharashtra',
        emergencyContact: '+91 9876543211',
        createdAt: '2023-01-15T00:00:00Z'
      },
      {
        id: '2',
        employeeId: 'EMP002',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya.sharma@rotifactory.com',
        phone: '+91 9876543212',
        position: 'Sales Executive',
        department: 'Sales',
        salary: 35000,
        joinDate: '2023-03-01',
        status: 'ACTIVE',
        address: '456 Park Avenue, Delhi',
        emergencyContact: '+91 9876543213',
        createdAt: '2023-03-01T00:00:00Z'
      },
      {
        id: '3',
        employeeId: 'EMP003',
        firstName: 'Amit',
        lastName: 'Singh',
        email: 'amit.singh@rotifactory.com',
        phone: '+91 9876543214',
        position: 'Counter Operator',
        department: 'Operations',
        salary: 25000,
        joinDate: '2023-06-01',
        status: 'ACTIVE',
        address: '789 Garden Road, Bangalore',
        emergencyContact: '+91 9876543215',
        createdAt: '2023-06-01T00:00:00Z'
      }
    ];

    setEmployees(mockEmployees);
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.hr-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const handleAddEmployee = async () => {
    if (!employeeForm.firstName.trim() || !employeeForm.lastName.trim() || !employeeForm.email.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    setLoading(true);
    try {
      const employeeData = {
        firstName: employeeForm.firstName.trim(),
        lastName: employeeForm.lastName.trim(),
        email: employeeForm.email.trim(),
        phone: employeeForm.phone.trim(),
        position: employeeForm.position.trim(),
        department: employeeForm.department.trim(),
        salary: employeeForm.salary,
        joinDate: employeeForm.joinDate,
        address: employeeForm.address.trim() || undefined,
        emergencyContact: employeeForm.emergencyContact.trim() || undefined,
      };

      const response = await hrAPI.createEmployee(employeeData);

      // Add the new employee to the list
      setEmployees(prev => [...prev, response.data]);

      // Reset form
      setEmployeeForm({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        position: '',
        department: '',
        salary: 0,
        joinDate: new Date().toISOString().split('T')[0],
        address: '',
        emergencyContact: ''
      });

      setShowAddEmployee(false);
      toast.success('Employee added successfully!');
    } catch (error) {
      console.error('Error adding employee:', error);
      toast.error('Failed to add employee');
    } finally {
      setLoading(false);
    }
  };

  const exportEmployeeReportPDF = () => {
    if (employees.length === 0) {
      toast.error('No employee data available to export');
      return;
    }

    try {
      const pdf = generateEmployeeReportPDF(employees);
      const filename = `employee-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Employee report exported successfully!');
    } catch (error) {
      console.error('Error exporting employee PDF:', error);
      toast.error('Failed to export employee report');
    }
  };

  const exportPayrollReportPDF = () => {
    if (employees.length === 0) {
      toast.error('No employee data available for payroll export');
      return;
    }

    try {
      // Create payroll-specific data
      const payrollData = employees.map(emp => ({
        ...emp,
        basicSalary: emp.salary,
        allowances: Math.round(emp.salary * 0.2),
        deductions: Math.round(emp.salary * 0.12),
        netSalary: emp.salary + Math.round(emp.salary * 0.2) - Math.round(emp.salary * 0.12)
      }));

      const pdf = generateEmployeeReportPDF(payrollData);
      const filename = `payroll-report-${selectedMonth}-${selectedYear}.pdf`;
      pdf.save(filename);

      toast.success('Payroll report exported successfully!');
    } catch (error) {
      console.error('Error exporting payroll PDF:', error);
      toast.error('Failed to export payroll report');
    }
  };

  const renderEmployeesView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Employee Management</h2>
          <p className="text-gray-600">Manage your workforce and employee information</p>
        </div>
        <div className="flex items-center space-x-3">
          <button
            onClick={exportEmployeeReportPDF}
            className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export PDF</span>
          </button>
          <button
            onClick={() => setShowAddEmployee(true)}
            className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
            </svg>
            <span>Add Employee</span>
          </button>
        </div>
      </div>

      {/* Employee Statistics */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="hr-card bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Total Employees</h3>
          <p className="text-2xl font-bold text-blue-700">{employees.length}</p>
        </div>
        <div className="hr-card bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2">Active</h3>
          <p className="text-2xl font-bold text-green-700">{employees.filter(e => e.status === 'ACTIVE').length}</p>
        </div>
        <div className="hr-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
          <h3 className="text-sm font-medium text-yellow-900 mb-2">On Leave</h3>
          <p className="text-2xl font-bold text-yellow-700">{employees.filter(e => e.status === 'ON_LEAVE').length}</p>
        </div>
        <div className="hr-card bg-purple-50 p-6 rounded-xl border border-purple-200">
          <h3 className="text-sm font-medium text-purple-900 mb-2">Departments</h3>
          <p className="text-2xl font-bold text-purple-700">
            {new Set(employees.map(e => e.department)).size}
          </p>
        </div>
      </div>

      {/* Department Breakdown */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Department Breakdown</h3>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {Object.entries(
            employees.reduce((acc, emp) => {
              acc[emp.department] = (acc[emp.department] || 0) + 1;
              return acc;
            }, {} as Record<string, number>)
          ).map(([department, count]) => (
            <div key={department} className="text-center p-4 bg-gray-50 rounded-lg">
              <div className="font-medium text-gray-900">{department}</div>
              <div className="text-2xl font-bold text-green-600 mt-2">{count}</div>
              <div className="text-sm text-gray-500">employees</div>
            </div>
          ))}
        </div>
      </div>

      {/* Employees Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Employee Directory</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Employee</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Position</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Department</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Contact</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-900">Salary</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
              </tr>
            </thead>
            <tbody>
              {employees.map((employee) => (
                <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6">
                    <div>
                      <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                      <div className="text-sm text-gray-500">{employee.employeeId}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-gray-600">{employee.position}</td>
                  <td className="py-4 px-6 text-gray-600">{employee.department}</td>
                  <td className="py-4 px-6">
                    <div className="text-sm">
                      <div className="text-gray-900">{employee.email}</div>
                      <div className="text-gray-500">{employee.phone}</div>
                    </div>
                  </td>
                  <td className="py-4 px-6 text-right font-medium text-gray-900">₹{employee.salary.toLocaleString()}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      employee.status === 'ACTIVE' ? 'bg-green-100 text-green-800' :
                      employee.status === 'ON_LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-red-100 text-red-800'
                    }`}>
                      {employee.status.replace('_', ' ')}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-center">
                    <div className="flex items-center justify-center space-x-2">
                      <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                        Edit
                      </button>
                      <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                        View
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Render different views based on currentView */}
      {currentView === 'employees' && renderEmployeesView()}
      {currentView === 'attendance' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Attendance Management</h2>
              <p className="text-gray-600">Track employee attendance and working hours</p>
            </div>
            <div className="flex items-center space-x-4">
              <input
                type="date"
                value={selectedDate}
                onChange={(e) => setSelectedDate(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
              <button
                onClick={() => setShowMarkAttendance(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Mark Attendance
              </button>
            </div>
          </div>

          {/* Attendance Summary */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            <div className="hr-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Present Today</h3>
              <p className="text-2xl font-bold text-blue-700">
                {employees.filter(e => e.status === 'ACTIVE').length - 1}
              </p>
            </div>
            <div className="hr-card bg-red-50 p-6 rounded-xl border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">Absent</h3>
              <p className="text-2xl font-bold text-red-700">1</p>
            </div>
            <div className="hr-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Late</h3>
              <p className="text-2xl font-bold text-yellow-700">0</p>
            </div>
            <div className="hr-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">On Leave</h3>
              <p className="text-2xl font-bold text-green-700">
                {employees.filter(e => e.status === 'ON_LEAVE').length}
              </p>
            </div>
            <div className="hr-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Attendance Rate</h3>
              <p className="text-2xl font-bold text-purple-700">95%</p>
            </div>
          </div>

          {/* Quick Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-blue-600 font-medium">Bulk Check-in</div>
                <div className="text-sm text-blue-500 mt-1">Mark multiple employees present</div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-green-600 font-medium">Generate Report</div>
                <div className="text-sm text-green-500 mt-1">Monthly attendance report</div>
              </button>
              <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-yellow-600 font-medium">Leave Requests</div>
                <div className="text-sm text-yellow-500 mt-1">Manage pending requests</div>
              </button>
              <button className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-purple-600 font-medium">Overtime</div>
                <div className="text-sm text-purple-500 mt-1">Track overtime hours</div>
              </button>
            </div>
          </div>

          {/* Today's Attendance */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Attendance for {new Date(selectedDate).toLocaleDateString()}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Employee</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Department</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Check In</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Check Out</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Working Hours</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => {
                    // Mock attendance data
                    const isPresent = index < employees.length - 1;
                    const checkIn = isPresent ? '09:15 AM' : '';
                    const checkOut = isPresent ? '06:30 PM' : '';
                    const workingHours = isPresent ? '8.25' : '0';
                    const status = employee.status === 'ON_LEAVE' ? 'LEAVE' :
                                 isPresent ? 'PRESENT' : 'ABSENT';

                    return (
                      <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-gray-500">{employee.employeeId}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">{employee.department}</td>
                        <td className="py-4 px-6 text-gray-600">{checkIn}</td>
                        <td className="py-4 px-6 text-gray-600">{checkOut}</td>
                        <td className="py-4 px-6 text-gray-600">{workingHours} hrs</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'PRESENT' ? 'bg-green-100 text-green-800' :
                            status === 'ABSENT' ? 'bg-red-100 text-red-800' :
                            status === 'LEAVE' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Edit
                            </button>
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {currentView === 'payroll' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Payroll Management</h2>
              <p className="text-gray-600">Manage employee salaries and payroll processing</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedMonth}
                onChange={(e) => setSelectedMonth(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Array.from({ length: 12 }, (_, i) => (
                  <option key={i + 1} value={i + 1}>
                    {new Date(0, i).toLocaleString('default', { month: 'long' })}
                  </option>
                ))}
              </select>
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(Number(e.target.value))}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {Array.from({ length: 5 }, (_, i) => (
                  <option key={2024 - i} value={2024 - i}>
                    {2024 - i}
                  </option>
                ))}
              </select>
              <button
                onClick={() => setShowProcessPayroll(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
              >
                Process Payroll
              </button>
            </div>
          </div>

          {/* Payroll Summary */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="hr-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Total Payroll</h3>
              <p className="text-2xl font-bold text-blue-700">
                ₹{employees.reduce((sum, emp) => sum + emp.salary, 0).toLocaleString()}
              </p>
            </div>
            <div className="hr-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Processed</h3>
              <p className="text-2xl font-bold text-green-700">{employees.length - 1}</p>
            </div>
            <div className="hr-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-yellow-700">1</p>
            </div>
            <div className="hr-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Average Salary</h3>
              <p className="text-2xl font-bold text-purple-700">
                ₹{Math.round(employees.reduce((sum, emp) => sum + emp.salary, 0) / employees.length).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Payroll Actions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Payroll Actions</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <button className="p-4 bg-blue-50 hover:bg-blue-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-blue-600 font-medium">Generate Payslips</div>
                <div className="text-sm text-blue-500 mt-1">Create monthly payslips</div>
              </button>
              <button className="p-4 bg-green-50 hover:bg-green-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-green-600 font-medium">Tax Calculations</div>
                <div className="text-sm text-green-500 mt-1">Calculate tax deductions</div>
              </button>
              <button className="p-4 bg-yellow-50 hover:bg-yellow-100 rounded-lg text-center transition-colors duration-200">
                <div className="text-yellow-600 font-medium">Bonus Processing</div>
                <div className="text-sm text-yellow-500 mt-1">Process annual bonuses</div>
              </button>
              <button
                onClick={exportPayrollReportPDF}
                className="p-4 bg-purple-50 hover:bg-purple-100 rounded-lg text-center transition-colors duration-200"
              >
                <div className="text-purple-600 font-medium">Export Reports</div>
                <div className="text-sm text-purple-500 mt-1">Download payroll reports</div>
              </button>
            </div>
          </div>

          {/* Payroll Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Payroll for {new Date(0, selectedMonth - 1).toLocaleString('default', { month: 'long' })} {selectedYear}
              </h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Employee</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Basic Salary</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Allowances</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Overtime</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Deductions</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Net Salary</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {employees.map((employee, index) => {
                    // Mock payroll calculations
                    const basicSalary = employee.salary;
                    const allowances = Math.round(basicSalary * 0.2);
                    const overtime = index === 0 ? 5000 : 0;
                    const deductions = Math.round(basicSalary * 0.12); // PF + Tax
                    const netSalary = basicSalary + allowances + overtime - deductions;
                    const status = index === employees.length - 1 ? 'PENDING' : 'PROCESSED';

                    return (
                      <tr key={employee.id} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                            <div className="text-sm text-gray-500">{employee.employeeId} • {employee.position}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-900">₹{basicSalary.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-gray-600">₹{allowances.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-gray-600">₹{overtime.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right text-red-600">₹{deductions.toLocaleString()}</td>
                        <td className="py-4 px-6 text-right font-bold text-green-600">₹{netSalary.toLocaleString()}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            status === 'PROCESSED' ? 'bg-green-100 text-green-800' :
                            status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {status}
                          </span>
                        </td>
                        <td className="py-4 px-6 text-center">
                          <div className="flex items-center justify-center space-x-2">
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              Payslip
                            </button>
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Details
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {currentView === 'training' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Training Management</h2>
              <p className="text-gray-600">Manage employee training programs and development</p>
            </div>
            <button
              onClick={() => setShowAddTraining(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Training</span>
            </button>
          </div>

          {/* Training Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="hr-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Total Programs</h3>
              <p className="text-2xl font-bold text-blue-700">8</p>
            </div>
            <div className="hr-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Active Programs</h3>
              <p className="text-2xl font-bold text-green-700">3</p>
            </div>
            <div className="hr-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Enrolled Employees</h3>
              <p className="text-2xl font-bold text-yellow-700">12</p>
            </div>
            <div className="hr-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Completion Rate</h3>
              <p className="text-2xl font-bold text-purple-700">85%</p>
            </div>
          </div>

          {/* Training Programs */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Upcoming Programs */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Upcoming Programs</h3>
              <div className="space-y-4">
                <div className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-blue-900">Food Safety Training</h4>
                    <span className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded-full">UPCOMING</span>
                  </div>
                  <p className="text-sm text-blue-700 mb-2">Essential food safety protocols and hygiene standards</p>
                  <div className="flex items-center justify-between text-xs text-blue-600">
                    <span>📅 June 20-22, 2024</span>
                    <span>👥 5/10 enrolled</span>
                    <span>💰 ₹5,000</span>
                  </div>
                </div>

                <div className="p-4 bg-green-50 rounded-lg border border-green-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-green-900">Customer Service Excellence</h4>
                    <span className="text-xs bg-green-100 text-green-800 px-2 py-1 rounded-full">ONGOING</span>
                  </div>
                  <p className="text-sm text-green-700 mb-2">Enhance customer interaction and service quality</p>
                  <div className="flex items-center justify-between text-xs text-green-600">
                    <span>📅 June 15-25, 2024</span>
                    <span>👥 8/12 enrolled</span>
                    <span>💰 ₹3,500</span>
                  </div>
                </div>

                <div className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                  <div className="flex items-center justify-between mb-2">
                    <h4 className="font-medium text-purple-900">Leadership Development</h4>
                    <span className="text-xs bg-purple-100 text-purple-800 px-2 py-1 rounded-full">UPCOMING</span>
                  </div>
                  <p className="text-sm text-purple-700 mb-2">Develop management and leadership skills</p>
                  <div className="flex items-center justify-between text-xs text-purple-600">
                    <span>📅 July 1-5, 2024</span>
                    <span>👥 3/8 enrolled</span>
                    <span>💰 ₹8,000</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Employee Training Status */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Employee Training Status</h3>
              <div className="space-y-4">
                {employees.slice(0, 4).map((employee, index) => {
                  const trainingsCompleted = [3, 2, 1, 4][index];
                  const trainingsInProgress = [1, 2, 1, 0][index];

                  return (
                    <div key={employee.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{employee.firstName} {employee.lastName}</div>
                        <div className="text-sm text-gray-500">{employee.position}</div>
                      </div>
                      <div className="text-right">
                        <div className="text-sm font-medium text-gray-900">
                          {trainingsCompleted} completed
                        </div>
                        <div className="text-xs text-gray-500">
                          {trainingsInProgress} in progress
                        </div>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          </div>

          {/* Training History */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Training Programs</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Program</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Instructor</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Duration</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Dates</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Enrolled</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Cost</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {[
                    {
                      id: '1',
                      title: 'Food Safety Training',
                      instructor: 'Dr. Rajesh Mehta',
                      duration: '24 hours',
                      startDate: '2024-06-20',
                      endDate: '2024-06-22',
                      enrolled: '5/10',
                      cost: 5000,
                      status: 'UPCOMING'
                    },
                    {
                      id: '2',
                      title: 'Customer Service Excellence',
                      instructor: 'Ms. Priya Sharma',
                      duration: '16 hours',
                      startDate: '2024-06-15',
                      endDate: '2024-06-25',
                      enrolled: '8/12',
                      cost: 3500,
                      status: 'ONGOING'
                    },
                    {
                      id: '3',
                      title: 'Quality Control Basics',
                      instructor: 'Mr. Amit Kumar',
                      duration: '12 hours',
                      startDate: '2024-05-15',
                      endDate: '2024-05-17',
                      enrolled: '10/10',
                      cost: 4000,
                      status: 'COMPLETED'
                    }
                  ].map((program) => (
                    <tr key={program.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div className="font-medium text-gray-900">{program.title}</div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{program.instructor}</td>
                      <td className="py-4 px-6 text-gray-600">{program.duration}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(program.startDate).toLocaleDateString()} - {new Date(program.endDate).toLocaleDateString()}
                      </td>
                      <td className="py-4 px-6 text-center text-gray-600">{program.enrolled}</td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">₹{program.cost.toLocaleString()}</td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          program.status === 'COMPLETED' ? 'bg-green-100 text-green-800' :
                          program.status === 'ONGOING' ? 'bg-blue-100 text-blue-800' :
                          program.status === 'UPCOMING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {program.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            View
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Enroll
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add Employee Modal */}
      {showAddEmployee && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Employee</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddEmployee(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={employeeForm.firstName}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={employeeForm.lastName}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                  <input
                    type="email"
                    value={employeeForm.email}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, email: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
                  <input
                    type="tel"
                    value={employeeForm.phone}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, phone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Position *</label>
                  <input
                    type="text"
                    value={employeeForm.position}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, position: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="e.g., Production Manager"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                  <select
                    value={employeeForm.department}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, department: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  >
                    <option value="">Select Department</option>
                    <option value="Manufacturing">Manufacturing</option>
                    <option value="Sales">Sales</option>
                    <option value="Operations">Operations</option>
                    <option value="Finance">Finance</option>
                    <option value="HR">Human Resources</option>
                    <option value="Quality">Quality Control</option>
                  </select>
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Salary (₹) *</label>
                  <input
                    type="number"
                    value={employeeForm.salary}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, salary: Number(e.target.value) }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min="0"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Join Date *</label>
                  <input
                    type="date"
                    value={employeeForm.joinDate}
                    onChange={(e) => setEmployeeForm(prev => ({ ...prev, joinDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={employeeForm.address}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, address: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Enter employee address"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Emergency Contact</label>
                <input
                  type="tel"
                  value={employeeForm.emergencyContact}
                  onChange={(e) => setEmployeeForm(prev => ({ ...prev, emergencyContact: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Emergency contact number"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddEmployee(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Add Employee
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default HumanResources;
