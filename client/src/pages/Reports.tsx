import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import toast from 'react-hot-toast';
import { PDFGenerator } from '../utils/pdfGenerator';
import { formatDate, getCurrentDate } from '../utils/dateUtils';

const Reports: React.FC = () => {
  const [currentView, setCurrentView] = useState<'overview' | 'sales' | 'inventory' | 'financial' | 'custom'>('overview');

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'dashboard/reports/overview') {
        setCurrentView('overview');
      } else if (hash === 'dashboard/reports/sales') {
        setCurrentView('sales');
      } else if (hash === 'dashboard/reports/inventory') {
        setCurrentView('inventory');
      } else if (hash === 'dashboard/reports/financial') {
        setCurrentView('financial');
      } else if (hash === 'dashboard/reports/custom') {
        setCurrentView('custom');
      } else if (hash === 'dashboard/reports') {
        setCurrentView('overview');
        window.location.hash = 'dashboard/reports/overview';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.reports-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const exportAllReports = () => {
    try {
      const pdf = new PDFGenerator({
        title: 'Comprehensive Business Reports',
        subtitle: 'All Reports Summary',
        includeDate: true
      });

      // Overview section
      pdf.addSection('Business Overview', [
        'This comprehensive report includes all key business metrics and analytics.',
        'Generated from the Roti Factory ERP system.',
        'Data reflects current business performance across all departments.'
      ]);

      // Mock summary data
      pdf.addSummaryBox('Key Performance Indicators', [
        { label: 'Total Revenue (This Month)', value: '₹5,25,000' },
        { label: 'Total Orders', value: '1,250' },
        { label: 'Active Employees', value: '45' },
        { label: 'Production Units', value: '25,000' },
        { label: 'Customer Satisfaction', value: '94%' }
      ]);

      // Sales summary
      pdf.addSection('Sales Performance', [
        'Monthly sales target: ₹6,00,000',
        'Current achievement: 87.5%',
        'Top performing product: Plain Roti (40% of sales)',
        'Average order value: ₹420',
        'Customer retention rate: 85%'
      ]);

      // Operations summary
      pdf.addSection('Operations Summary', [
        'Production efficiency: 92%',
        'Quality control pass rate: 98%',
        'On-time delivery rate: 96%',
        'Inventory turnover: 12x annually',
        'Equipment utilization: 88%'
      ]);

      const filename = `comprehensive-business-report-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Comprehensive business report exported successfully!');
    } catch (error) {
      console.error('Error exporting comprehensive report:', error);
      toast.error('Failed to export comprehensive report');
    }
  };

  const tabs = [
    { id: 'overview', name: 'Overview', icon: '📊' },
    { id: 'sales', name: 'Sales Reports', icon: '💰' },
    { id: 'inventory', name: 'Inventory Reports', icon: '📦' },
    { id: 'financial', name: 'Financial Reports', icon: '📈' },
    { id: 'custom', name: 'Custom Reports', icon: '⚙️' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Reports & Analytics</h2>
          <p className="text-gray-600">Generate comprehensive reports and analyze business performance</p>
        </div>
        <button
          onClick={exportAllReports}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
          <span>Export All Reports</span>
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => {
            const isActive = currentView === tab.id;
            return (
              <button
                key={tab.id}
                onClick={() => {
                  setCurrentView(tab.id as any);
                  window.location.hash = `dashboard/reports/${tab.id}`;
                }}
                className={`${
                  isActive
                    ? 'border-green-500 text-green-600'
                    : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                } whitespace-nowrap py-2 px-1 border-b-2 font-medium text-sm flex items-center transition-colors`}
              >
                <span className="mr-2">{tab.icon}</span>
                {tab.name}
              </button>
            );
          })}
        </nav>
      </div>

      {/* Content */}
      <div className="reports-content">
        {currentView === 'overview' && <OverviewPage />}
        {currentView === 'sales' && <SalesReportsPage />}
        {currentView === 'inventory' && <InventoryReportsPage />}
        {currentView === 'financial' && <FinancialReportsPage />}
        {currentView === 'custom' && <CustomReportsPage />}
      </div>
    </div>
  );
};

const OverviewPage: React.FC = () => {
  const reportStats = [
    { label: 'Total Reports', value: '24', color: 'blue' },
    { label: 'Generated Today', value: '8', color: 'green' },
    { label: 'Scheduled Reports', value: '5', color: 'purple' },
    { label: 'Data Sources', value: '12', color: 'orange' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {reportStats.map((stat, index) => (
          <div key={index} className={`reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <span className={`text-${stat.color}-600 text-xl font-bold`}>📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Report Generation</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">💰</span>
              <h4 className="font-semibold">Daily Sales</h4>
            </div>
            <p className="text-sm text-gray-600">Generate today's sales summary</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">📦</span>
              <h4 className="font-semibold">Inventory Status</h4>
            </div>
            <p className="text-sm text-gray-600">Current stock levels and alerts</p>
          </button>
          <button className="p-4 border border-gray-200 rounded-lg hover:shadow-md transition-shadow text-left">
            <div className="flex items-center mb-2">
              <span className="text-2xl mr-3">👥</span>
              <h4 className="font-semibold">Employee Performance</h4>
            </div>
            <p className="text-sm text-gray-600">Staff productivity metrics</p>
          </button>
        </div>
      </div>
    </div>
  );
};

const SalesReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Sales Reports</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Daily Sales Summary</h4>
              <p className="text-sm text-gray-600">Today's sales performance and trends</p>
            </div>
            <button
              onClick={() => {
                const pdf = new PDFGenerator({
                  title: 'Daily Sales Summary',
                  subtitle: `Date: ${getCurrentDate()}`,
                  includeDate: true
                });

                pdf.addSummaryBox('Daily Sales Performance', [
                  { label: 'Total Sales', value: '₹18,500' },
                  { label: 'Orders Completed', value: '45' },
                  { label: 'Average Order Value', value: '₹411' },
                  { label: 'Top Product', value: 'Plain Roti (120 units)' }
                ]);

                pdf.save(`daily-sales-summary-${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('Daily sales summary generated!');
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Generate
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Monthly Revenue Report</h4>
              <p className="text-sm text-gray-600">Comprehensive monthly sales analysis</p>
            </div>
            <button
              onClick={() => {
                const pdf = new PDFGenerator({
                  title: 'Monthly Revenue Report',
                  subtitle: 'Comprehensive monthly sales analysis',
                  includeDate: true
                });

                pdf.addSummaryBox('Revenue Summary', [
                  { label: 'Total Revenue', value: '₹5,25,000' },
                  { label: 'Growth vs Last Month', value: '+12.5%' },
                  { label: 'Average Daily Revenue', value: '₹16,935' },
                  { label: 'Top Revenue Day', value: '₹28,500' }
                ]);

                pdf.save(`monthly-revenue-report-${new Date().toISOString().split('T')[0]}.pdf`);
                toast.success('Monthly revenue report generated!');
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              Generate
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Product Performance</h4>
              <p className="text-sm text-gray-600">Best and worst performing products</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const InventoryReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Inventory Reports</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Stock Level Report</h4>
              <p className="text-sm text-gray-600">Current inventory levels and reorder alerts</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Generate
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Raw Materials Usage</h4>
              <p className="text-sm text-gray-600">Material consumption and waste analysis</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const FinancialReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Financial Reports</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Profit & Loss Statement</h4>
              <p className="text-sm text-gray-600">Comprehensive P&L analysis</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Generate
            </button>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-medium text-gray-900">Cash Flow Report</h4>
              <p className="text-sm text-gray-600">Money in and out analysis</p>
            </div>
            <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg text-sm transition-colors">
              Generate
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

const CustomReportsPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="reports-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Custom Report Builder</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Report Name</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="e.g., Custom Sales Analysis" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Date Range</label>
              <select className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500">
                <option>Last 7 days</option>
                <option>Last 30 days</option>
                <option>Last 3 months</option>
                <option>Custom range</option>
              </select>
            </div>
          </div>
          <div className="flex justify-end">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Build Custom Report
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Reports;
