import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import toast from 'react-hot-toast';
import { PDFGenerator } from '../utils/pdfGenerator';

interface Account {
  id: string;
  name: string;
  type: 'ASSET' | 'LIABILITY' | 'EQUITY' | 'REVENUE' | 'EXPENSE';
  balance: number;
  description?: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
}

interface Expense {
  id: string;
  title: string;
  amount: number;
  category: string;
  description?: string;
  date: string;
  paymentMethod: 'CASH' | 'BANK' | 'CARD' | 'UPI';
  receipt?: string;
  approvedBy?: string;
  status: 'PENDING' | 'APPROVED' | 'REJECTED';
  createdAt: string;
}

interface ProfitLossData {
  period: string;
  revenue: {
    sales: number;
    otherIncome: number;
    total: number;
  };
  expenses: {
    rawMaterials: number;
    labor: number;
    overhead: number;
    marketing: number;
    administrative: number;
    total: number;
  };
  grossProfit: number;
  netProfit: number;
  profitMargin: number;
}

interface TaxRecord {
  id: string;
  taxType: 'GST' | 'INCOME_TAX' | 'TDS' | 'PROFESSIONAL_TAX';
  period: string;
  amount: number;
  status: 'PENDING' | 'FILED' | 'PAID';
  dueDate: string;
  filedDate?: string;
  paidDate?: string;
  description?: string;
}

const Finance: React.FC = () => {
  const [currentView, setCurrentView] = useState<'accounts' | 'expenses' | 'profit-loss' | 'tax'>('accounts');
  const [, ] = useState(false);
  
  // Accounts state
  const [accounts, setAccounts] = useState<Account[]>([]);
  const [showAddAccount, setShowAddAccount] = useState(false);
  const [accountForm, setAccountForm] = useState({
    name: '',
    type: 'ASSET' as Account['type'],
    balance: 0,
    description: ''
  });

  // Expenses state
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [showAddExpense, setShowAddExpense] = useState(false);
  const [expenseForm, setExpenseForm] = useState({
    title: '',
    amount: 0,
    category: '',
    description: '',
    date: new Date().toISOString().split('T')[0],
    paymentMethod: 'CASH' as Expense['paymentMethod']
  });

  // P&L state
  const [profitLossData, setProfitLossData] = useState<ProfitLossData | null>(null);
  const [plPeriod, setPlPeriod] = useState('current-month');

  // Tax state
  const [taxRecords, setTaxRecords] = useState<TaxRecord[]>([]);
  const [showAddTax, setShowAddTax] = useState(false);
  const [taxForm, setTaxForm] = useState({
    taxType: 'GST' as TaxRecord['taxType'],
    period: '',
    amount: 0,
    dueDate: '',
    description: ''
  });

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'finance/accounts') {
        setCurrentView('accounts');
      } else if (hash === 'finance/expenses') {
        setCurrentView('expenses');
      } else if (hash === 'finance/profit-loss') {
        setCurrentView('profit-loss');
      } else if (hash === 'finance/tax') {
        setCurrentView('tax');
      } else if (hash === 'finance') {
        setCurrentView('accounts');
        window.location.hash = 'finance/accounts';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Load mock data
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock Accounts
    const mockAccounts: Account[] = [
      {
        id: '1',
        name: 'Cash in Hand',
        type: 'ASSET',
        balance: 50000,
        description: 'Physical cash available',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        name: 'Bank Account - SBI',
        type: 'ASSET',
        balance: 250000,
        description: 'State Bank of India Current Account',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '3',
        name: 'Accounts Payable',
        type: 'LIABILITY',
        balance: 75000,
        description: 'Amount owed to suppliers',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '4',
        name: 'Sales Revenue',
        type: 'REVENUE',
        balance: 500000,
        description: 'Revenue from roti sales',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '5',
        name: 'Raw Material Expense',
        type: 'EXPENSE',
        balance: 180000,
        description: 'Cost of raw materials',
        isActive: true,
        createdAt: '2024-01-01T00:00:00Z',
        updatedAt: '2024-01-01T00:00:00Z'
      }
    ];

    // Mock Expenses
    const mockExpenses: Expense[] = [
      {
        id: '1',
        title: 'Raw Material Purchase',
        amount: 15000,
        category: 'Raw Materials',
        description: 'Wheat flour and ingredients',
        date: '2024-06-05',
        paymentMethod: 'BANK',
        status: 'APPROVED',
        createdAt: '2024-06-05T10:00:00Z'
      },
      {
        id: '2',
        title: 'Equipment Maintenance',
        amount: 5000,
        category: 'Maintenance',
        description: 'Roti making machine service',
        date: '2024-06-04',
        paymentMethod: 'CASH',
        status: 'APPROVED',
        createdAt: '2024-06-04T14:30:00Z'
      },
      {
        id: '3',
        title: 'Marketing Campaign',
        amount: 8000,
        category: 'Marketing',
        description: 'Social media advertising',
        date: '2024-06-03',
        paymentMethod: 'UPI',
        status: 'PENDING',
        createdAt: '2024-06-03T09:15:00Z'
      },
      {
        id: '4',
        title: 'Staff Salary',
        amount: 45000,
        category: 'Payroll',
        description: 'Monthly salary for June 2024',
        date: '2024-06-01',
        paymentMethod: 'BANK',
        status: 'APPROVED',
        createdAt: '2024-06-01T09:00:00Z'
      },
      {
        id: '5',
        title: 'Utility Bills',
        amount: 3500,
        category: 'Utilities',
        description: 'Electricity and water bills',
        date: '2024-06-02',
        paymentMethod: 'UPI',
        status: 'APPROVED',
        createdAt: '2024-06-02T11:20:00Z'
      }
    ];

    // Mock P&L Data
    const mockProfitLoss: ProfitLossData = {
      period: 'June 2024',
      revenue: {
        sales: 500000,
        otherIncome: 25000,
        total: 525000
      },
      expenses: {
        rawMaterials: 200000,
        labor: 150000,
        overhead: 75000,
        marketing: 30000,
        administrative: 40000,
        total: 495000
      },
      grossProfit: 325000,
      netProfit: 30000,
      profitMargin: 5.71
    };

    // Mock Tax Records
    const mockTaxRecords: TaxRecord[] = [
      {
        id: '1',
        taxType: 'GST',
        period: 'May 2024',
        amount: 45000,
        status: 'PAID',
        dueDate: '2024-06-20',
        filedDate: '2024-06-15',
        paidDate: '2024-06-15',
        description: 'GST Return for May 2024'
      },
      {
        id: '2',
        taxType: 'TDS',
        period: 'Q1 2024',
        amount: 12000,
        status: 'FILED',
        dueDate: '2024-07-31',
        filedDate: '2024-07-25',
        description: 'TDS Return for Q1 2024'
      },
      {
        id: '3',
        taxType: 'GST',
        period: 'June 2024',
        amount: 48000,
        status: 'PENDING',
        dueDate: '2024-07-20',
        description: 'GST Return for June 2024'
      },
      {
        id: '4',
        taxType: 'INCOME_TAX',
        period: 'FY 2023-24',
        amount: 85000,
        status: 'FILED',
        dueDate: '2024-07-31',
        filedDate: '2024-07-20',
        description: 'Annual Income Tax Return'
      }
    ];

    setAccounts(mockAccounts);
    setExpenses(mockExpenses);
    setProfitLossData(mockProfitLoss);
    setTaxRecords(mockTaxRecords);
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.finance-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const handleAddAccount = () => {
    if (!accountForm.name.trim()) {
      alert('Please enter account name');
      return;
    }

    const newAccount: Account = {
      id: Date.now().toString(),
      name: accountForm.name.trim(),
      type: accountForm.type,
      balance: accountForm.balance,
      description: accountForm.description.trim(),
      isActive: true,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setAccounts(prev => [...prev, newAccount]);
    setAccountForm({ name: '', type: 'ASSET', balance: 0, description: '' });
    setShowAddAccount(false);
    alert('Account added successfully!');
  };

  const handleAddExpense = () => {
    if (!expenseForm.title.trim() || expenseForm.amount <= 0) {
      alert('Please fill in all required fields');
      return;
    }

    const newExpense: Expense = {
      id: Date.now().toString(),
      title: expenseForm.title.trim(),
      amount: expenseForm.amount,
      category: expenseForm.category.trim(),
      description: expenseForm.description.trim(),
      date: expenseForm.date,
      paymentMethod: expenseForm.paymentMethod,
      status: 'PENDING',
      createdAt: new Date().toISOString()
    };

    setExpenses(prev => [...prev, newExpense]);
    setExpenseForm({
      title: '',
      amount: 0,
      category: '',
      description: '',
      date: new Date().toISOString().split('T')[0],
      paymentMethod: 'CASH'
    });
    setShowAddExpense(false);
    alert('Expense added successfully!');
  };

  const handleAddTax = () => {
    if (!taxForm.period.trim() || taxForm.amount <= 0 || !taxForm.dueDate) {
      alert('Please fill in all required fields');
      return;
    }

    const newTaxRecord: TaxRecord = {
      id: Date.now().toString(),
      taxType: taxForm.taxType,
      period: taxForm.period.trim(),
      amount: taxForm.amount,
      status: 'PENDING',
      dueDate: taxForm.dueDate,
      description: taxForm.description.trim()
    };

    setTaxRecords(prev => [...prev, newTaxRecord]);
    setTaxForm({
      taxType: 'GST',
      period: '',
      amount: 0,
      dueDate: '',
      description: ''
    });
    setShowAddTax(false);
    alert('Tax record added successfully!');
  };

  const exportProfitLossPDF = () => {
    if (!profitLossData) {
      toast.error('No profit & loss data available to export');
      return;
    }

    try {
      const pdf = new PDFGenerator({
        title: 'Profit & Loss Statement',
        subtitle: `Period: ${profitLossData.period}`,
        includeDate: true
      });

      // Revenue section
      pdf.addSection('Revenue', [
        `Sales Revenue: ₹${profitLossData.revenue.sales.toLocaleString()}`,
        `Other Income: ₹${profitLossData.revenue.otherIncome.toLocaleString()}`,
        `Total Revenue: ₹${profitLossData.revenue.total.toLocaleString()}`
      ]);

      // Expenses section
      pdf.addSection('Expenses', [
        `Raw Materials: ₹${profitLossData.expenses.rawMaterials.toLocaleString()}`,
        `Labor Costs: ₹${profitLossData.expenses.labor.toLocaleString()}`,
        `Overhead Expenses: ₹${profitLossData.expenses.overhead.toLocaleString()}`,
        `Marketing & Advertising: ₹${profitLossData.expenses.marketing.toLocaleString()}`,
        `Administrative: ₹${profitLossData.expenses.administrative.toLocaleString()}`,
        `Total Expenses: ₹${profitLossData.expenses.total.toLocaleString()}`
      ]);

      // Summary
      pdf.addSummaryBox('Financial Summary', [
        { label: 'Total Revenue', value: `₹${profitLossData.revenue.total.toLocaleString()}` },
        { label: 'Total Expenses', value: `₹${profitLossData.expenses.total.toLocaleString()}` },
        { label: 'Gross Profit', value: `₹${profitLossData.grossProfit.toLocaleString()}` },
        { label: 'Net Profit', value: `₹${profitLossData.netProfit.toLocaleString()}` },
        { label: 'Profit Margin', value: `${profitLossData.profitMargin.toFixed(2)}%` }
      ]);

      const filename = `profit-loss-statement-${plPeriod}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Profit & Loss statement exported successfully!');
    } catch (error) {
      console.error('Error exporting P&L PDF:', error);
      toast.error('Failed to export Profit & Loss statement');
    }
  };

  const exportExpenseReportPDF = () => {
    if (expenses.length === 0) {
      toast.error('No expense data available to export');
      return;
    }

    try {
      const pdf = new PDFGenerator({
        title: 'Expense Report',
        subtitle: 'Detailed Expense Analysis',
        includeDate: true
      });

      // Summary
      const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
      const pendingExpenses = expenses.filter(e => e.status === 'PENDING').length;
      const approvedExpenses = expenses.filter(e => e.status === 'APPROVED').length;

      pdf.addSummaryBox('Expense Summary', [
        { label: 'Total Expenses', value: `₹${totalExpenses.toLocaleString()}` },
        { label: 'Pending Approval', value: pendingExpenses.toString() },
        { label: 'Approved', value: approvedExpenses.toString() },
        { label: 'Total Records', value: expenses.length.toString() }
      ]);

      // Expense table
      const headers = ['Title', 'Category', 'Amount', 'Date', 'Payment Method', 'Status'];
      const rows = expenses.map(expense => [
        expense.title,
        expense.category,
        `₹${expense.amount.toLocaleString()}`,
        new Date(expense.date).toLocaleDateString('en-IN'),
        expense.paymentMethod,
        expense.status
      ]);

      pdf.addSection('Expense Details', '');
      pdf.addTable(headers, rows);

      const filename = `expense-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Expense report exported successfully!');
    } catch (error) {
      console.error('Error exporting expense PDF:', error);
      toast.error('Failed to export expense report');
    }
  };

  const renderAccountsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Accounts</h2>
          <p className="text-gray-600">Manage your chart of accounts</p>
        </div>
        <button
          onClick={() => setShowAddAccount(true)}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Account</span>
        </button>
      </div>

      {/* Account Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <div className="finance-card bg-blue-50 p-6 rounded-xl border border-blue-200">
          <h3 className="text-sm font-medium text-blue-900 mb-2">Total Assets</h3>
          <p className="text-2xl font-bold text-blue-700">
            ₹{accounts.filter(a => a.type === 'ASSET').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="finance-card bg-red-50 p-6 rounded-xl border border-red-200">
          <h3 className="text-sm font-medium text-red-900 mb-2">Total Liabilities</h3>
          <p className="text-2xl font-bold text-red-700">
            ₹{accounts.filter(a => a.type === 'LIABILITY').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="finance-card bg-green-50 p-6 rounded-xl border border-green-200">
          <h3 className="text-sm font-medium text-green-900 mb-2">Total Revenue</h3>
          <p className="text-2xl font-bold text-green-700">
            ₹{accounts.filter(a => a.type === 'REVENUE').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
        </div>
        <div className="finance-card bg-orange-50 p-6 rounded-xl border border-orange-200">
          <h3 className="text-sm font-medium text-orange-900 mb-2">Total Expenses</h3>
          <p className="text-2xl font-bold text-orange-700">
            ₹{accounts.filter(a => a.type === 'EXPENSE').reduce((sum, a) => sum + a.balance, 0).toLocaleString()}
          </p>
        </div>
      </div>

      {/* Accounts Table */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h3 className="text-lg font-semibold text-gray-900">Chart of Accounts</h3>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Account Name</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Type</th>
                <th className="text-right py-3 px-6 font-semibold text-gray-900">Balance</th>
                <th className="text-left py-3 px-6 font-semibold text-gray-900">Description</th>
                <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
              </tr>
            </thead>
            <tbody>
              {accounts.map((account) => (
                <tr key={account.id} className="border-b border-gray-100 hover:bg-gray-50">
                  <td className="py-4 px-6 font-medium text-gray-900">{account.name}</td>
                  <td className="py-4 px-6">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.type === 'ASSET' ? 'bg-blue-100 text-blue-800' :
                      account.type === 'LIABILITY' ? 'bg-red-100 text-red-800' :
                      account.type === 'REVENUE' ? 'bg-green-100 text-green-800' :
                      account.type === 'EXPENSE' ? 'bg-orange-100 text-orange-800' :
                      'bg-purple-100 text-purple-800'
                    }`}>
                      {account.type}
                    </span>
                  </td>
                  <td className="py-4 px-6 text-right font-medium">₹{account.balance.toLocaleString()}</td>
                  <td className="py-4 px-6 text-gray-600">{account.description || 'N/A'}</td>
                  <td className="py-4 px-6 text-center">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      account.isActive ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'
                    }`}>
                      {account.isActive ? 'Active' : 'Inactive'}
                    </span>
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
      {currentView === 'accounts' && renderAccountsView()}
      {currentView === 'expenses' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Expenses</h2>
              <p className="text-gray-600">Track and manage business expenses</p>
            </div>
            <div className="flex items-center space-x-3">
              <button
                onClick={exportExpenseReportPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
              <button
                onClick={() => setShowAddExpense(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Expense</span>
              </button>
            </div>
          </div>

          {/* Expense Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="finance-card bg-red-50 p-6 rounded-xl border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">Total Expenses</h3>
              <p className="text-2xl font-bold text-red-700">
                ₹{expenses.reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="finance-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Pending Approval</h3>
              <p className="text-2xl font-bold text-yellow-700">
                {expenses.filter(e => e.status === 'PENDING').length}
              </p>
            </div>
            <div className="finance-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Approved</h3>
              <p className="text-2xl font-bold text-green-700">
                {expenses.filter(e => e.status === 'APPROVED').length}
              </p>
            </div>
            <div className="finance-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">This Month</h3>
              <p className="text-2xl font-bold text-blue-700">
                ₹{expenses.filter(e => new Date(e.date).getMonth() === new Date().getMonth())
                  .reduce((sum, e) => sum + e.amount, 0).toLocaleString()}
              </p>
            </div>
          </div>

          {/* Expenses Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Expenses</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Title</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Category</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Payment</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {expenses.map((expense) => (
                    <tr key={expense.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{expense.title}</div>
                          {expense.description && (
                            <div className="text-sm text-gray-500">{expense.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6">
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800">
                          {expense.category}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">₹{expense.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-gray-600">{new Date(expense.date).toLocaleDateString()}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                          expense.paymentMethod === 'BANK' ? 'bg-blue-100 text-blue-800' :
                          expense.paymentMethod === 'CARD' ? 'bg-purple-100 text-purple-800' :
                          'bg-orange-100 text-orange-800'
                        }`}>
                          {expense.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          expense.status === 'APPROVED' ? 'bg-green-100 text-green-800' :
                          expense.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                          'bg-red-100 text-red-800'
                        }`}>
                          {expense.status}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {currentView === 'profit-loss' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Profit & Loss Statement</h2>
              <p className="text-gray-600">Financial performance overview</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={plPeriod}
                onChange={(e) => setPlPeriod(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="current-month">Current Month</option>
                <option value="last-month">Last Month</option>
                <option value="current-quarter">Current Quarter</option>
                <option value="current-year">Current Year</option>
              </select>
              <button
                onClick={exportProfitLossPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {profitLossData && (
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                <h3 className="text-lg font-semibold text-gray-900">
                  Profit & Loss Statement - {profitLossData.period}
                </h3>
              </div>

              <div className="p-6 space-y-6">
                {/* Revenue Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Revenue</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Sales Revenue</span>
                      <span className="font-medium">₹{profitLossData.revenue.sales.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Other Income</span>
                      <span className="font-medium">₹{profitLossData.revenue.otherIncome.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200 font-semibold">
                      <span className="text-gray-900">Total Revenue</span>
                      <span className="text-green-600">₹{profitLossData.revenue.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Expenses Section */}
                <div>
                  <h4 className="text-lg font-semibold text-gray-900 mb-4">Expenses</h4>
                  <div className="space-y-3">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Raw Materials</span>
                      <span className="font-medium">₹{profitLossData.expenses.rawMaterials.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Labor Costs</span>
                      <span className="font-medium">₹{profitLossData.expenses.labor.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Overhead Expenses</span>
                      <span className="font-medium">₹{profitLossData.expenses.overhead.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Marketing & Advertising</span>
                      <span className="font-medium">₹{profitLossData.expenses.marketing.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-gray-700">Administrative</span>
                      <span className="font-medium">₹{profitLossData.expenses.administrative.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-200 font-semibold">
                      <span className="text-gray-900">Total Expenses</span>
                      <span className="text-red-600">₹{profitLossData.expenses.total.toLocaleString()}</span>
                    </div>
                  </div>
                </div>

                {/* Profit Summary */}
                <div className="border-t border-gray-200 pt-6">
                  <div className="space-y-4">
                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-semibold text-gray-900">Gross Profit</span>
                      <span className="text-lg font-bold text-blue-600">₹{profitLossData.grossProfit.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center py-2 border-t border-gray-300">
                      <span className="text-xl font-bold text-gray-900">Net Profit</span>
                      <span className={`text-xl font-bold ${profitLossData.netProfit >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        ₹{profitLossData.netProfit.toLocaleString()}
                      </span>
                    </div>
                    <div className="flex justify-between items-center py-2">
                      <span className="text-lg font-semibold text-gray-900">Profit Margin</span>
                      <span className={`text-lg font-bold ${profitLossData.profitMargin >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                        {profitLossData.profitMargin.toFixed(2)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Performance Metrics */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="finance-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Revenue Growth</h3>
              <p className="text-2xl font-bold text-green-700">+12.5%</p>
              <p className="text-xs text-green-600 mt-1">vs last month</p>
            </div>
            <div className="finance-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Cost Efficiency</h3>
              <p className="text-2xl font-bold text-blue-700">94.3%</p>
              <p className="text-xs text-blue-600 mt-1">expense ratio</p>
            </div>
            <div className="finance-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">ROI</h3>
              <p className="text-2xl font-bold text-purple-700">18.2%</p>
              <p className="text-xs text-purple-600 mt-1">return on investment</p>
            </div>
          </div>
        </div>
      )}
      {currentView === 'tax' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Tax Management</h2>
              <p className="text-gray-600">Manage tax filings and compliance</p>
            </div>
            <button
              onClick={() => setShowAddTax(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Tax Record</span>
            </button>
          </div>

          {/* Tax Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="finance-card bg-red-50 p-6 rounded-xl border border-red-200">
              <h3 className="text-sm font-medium text-red-900 mb-2">Total Tax Liability</h3>
              <p className="text-2xl font-bold text-red-700">
                ₹{taxRecords.reduce((sum, t) => sum + t.amount, 0).toLocaleString()}
              </p>
            </div>
            <div className="finance-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Pending</h3>
              <p className="text-2xl font-bold text-yellow-700">
                {taxRecords.filter(t => t.status === 'PENDING').length}
              </p>
            </div>
            <div className="finance-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Filed</h3>
              <p className="text-2xl font-bold text-blue-700">
                {taxRecords.filter(t => t.status === 'FILED').length}
              </p>
            </div>
            <div className="finance-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Paid</h3>
              <p className="text-2xl font-bold text-green-700">
                {taxRecords.filter(t => t.status === 'PAID').length}
              </p>
            </div>
          </div>

          {/* Upcoming Due Dates */}
          <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-6">
            <h3 className="text-lg font-semibold text-yellow-900 mb-4">Upcoming Due Dates</h3>
            <div className="space-y-3">
              {taxRecords
                .filter(t => t.status === 'PENDING' && new Date(t.dueDate) > new Date())
                .sort((a, b) => new Date(a.dueDate).getTime() - new Date(b.dueDate).getTime())
                .slice(0, 3)
                .map(tax => (
                  <div key={tax.id} className="flex items-center justify-between p-3 bg-white rounded-lg">
                    <div>
                      <span className="font-medium text-gray-900">{tax.taxType} - {tax.period}</span>
                      <p className="text-sm text-gray-600">{tax.description}</p>
                    </div>
                    <div className="text-right">
                      <p className="font-medium text-gray-900">₹{tax.amount.toLocaleString()}</p>
                      <p className="text-sm text-yellow-600">Due: {new Date(tax.dueDate).toLocaleDateString()}</p>
                    </div>
                  </div>
                ))}
            </div>
          </div>

          {/* Tax Records Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Tax Records</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Tax Type</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Period</th>
                    <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Due Date</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Filed Date</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {taxRecords.map((tax) => (
                    <tr key={tax.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{tax.taxType}</div>
                          {tax.description && (
                            <div className="text-sm text-gray-500">{tax.description}</div>
                          )}
                        </div>
                      </td>
                      <td className="py-4 px-6 font-medium text-gray-900">{tax.period}</td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">₹{tax.amount.toLocaleString()}</td>
                      <td className="py-4 px-6 text-gray-600">
                        <span className={new Date(tax.dueDate) < new Date() && tax.status === 'PENDING' ? 'text-red-600 font-medium' : ''}>
                          {new Date(tax.dueDate).toLocaleDateString()}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {tax.filedDate ? new Date(tax.filedDate).toLocaleDateString() : 'Not filed'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          tax.status === 'PAID' ? 'bg-green-100 text-green-800' :
                          tax.status === 'FILED' ? 'bg-blue-100 text-blue-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {tax.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          {tax.status === 'PENDING' && (
                            <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                              File
                            </button>
                          )}
                          {tax.status === 'FILED' && (
                            <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                              Mark Paid
                            </button>
                          )}
                          <button className="text-gray-600 hover:text-gray-800 text-sm font-medium">
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
      )}

      {/* Add Account Modal */}
      {showAddAccount && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Account</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddAccount(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Name</label>
                <input
                  type="text"
                  value={accountForm.name}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, name: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter account name"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Account Type</label>
                <select
                  value={accountForm.type}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, type: e.target.value as Account['type'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="ASSET">Asset</option>
                  <option value="LIABILITY">Liability</option>
                  <option value="EQUITY">Equity</option>
                  <option value="REVENUE">Revenue</option>
                  <option value="EXPENSE">Expense</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Initial Balance</label>
                <input
                  type="number"
                  value={accountForm.balance}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, balance: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={accountForm.description}
                  onChange={(e) => setAccountForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddAccount(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Add Account
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Expense Modal */}
      {showAddExpense && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Expense</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddExpense(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Title</label>
                <input
                  type="text"
                  value={expenseForm.title}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, title: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="Enter expense title"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={expenseForm.amount}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <input
                  type="text"
                  value={expenseForm.category}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, category: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., Raw Materials, Marketing"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={expenseForm.date}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, date: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method</label>
                <select
                  value={expenseForm.paymentMethod}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, paymentMethod: e.target.value as Expense['paymentMethod'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="CASH">Cash</option>
                  <option value="BANK">Bank Transfer</option>
                  <option value="CARD">Card</option>
                  <option value="UPI">UPI</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={expenseForm.description}
                  onChange={(e) => setExpenseForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddExpense(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Add Expense
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Add Tax Record Modal */}
      {showAddTax && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Tax Record</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddTax(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Tax Type</label>
                <select
                  value={taxForm.taxType}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, taxType: e.target.value as TaxRecord['taxType'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="GST">GST</option>
                  <option value="INCOME_TAX">Income Tax</option>
                  <option value="TDS">TDS</option>
                  <option value="PROFESSIONAL_TAX">Professional Tax</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Period</label>
                <input
                  type="text"
                  value={taxForm.period}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, period: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="e.g., June 2024, Q1 2024"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Amount</label>
                <input
                  type="number"
                  value={taxForm.amount}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, amount: Number(e.target.value) }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  placeholder="0"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Due Date</label>
                <input
                  type="date"
                  value={taxForm.dueDate}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, dueDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={taxForm.description}
                  onChange={(e) => setTaxForm(prev => ({ ...prev, description: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Optional description"
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddTax(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Add Tax Record
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Finance;
