import React, { useState, useEffect } from 'react';
import anime from 'animejs';

interface Counter {
  id: string;
  name: string;
  location: string;
  isActive: boolean;
  franchise: {
    id: string;
    name: string;
    code: string;
  };
  manager?: {
    firstName: string;
    lastName: string;
    email: string;
    phone?: string;
  };
  createdAt: string;
  updatedAt: string;
}

interface CounterFormData {
  name: string;
  manager: string;
  contactNumber: string;
  address: string;
}

interface CounterDetailsData {
  date: string;
  input: number;
  output: number;
  sales: number;
  products: Array<{
    name: string;
    input: number;
    output: number;
    sales: number;
  }>;
}

const Counters: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'details' | 'reports'>('list');
  const [counters, setCounters] = useState<Counter[]>([]);
  const [selectedCounter, setSelectedCounter] = useState<Counter | null>(null);
  const [loading, setLoading] = useState(false);
  const [, ] = useState<string | null>(null);
  const [formData, setFormData] = useState<CounterFormData>({
    name: '',
    manager: '',
    contactNumber: '',
    address: ''
  });
  const [reportFilters, setReportFilters] = useState({
    counterId: '',
    date: new Date().toISOString().split('T')[0],
    reportType: 'daily'
  });
  const [reportData, setReportData] = useState<any>(null);
  const [isGeneratingReport, setIsGeneratingReport] = useState(false);

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'counters/add') {
        setCurrentView('add');
        setSelectedCounter(null);
      } else if (hash === 'counters/reports') {
        setCurrentView('reports');
        setSelectedCounter(null);
      } else if (hash === 'counters/list') {
        setCurrentView('list');
        setSelectedCounter(null);
      } else if (hash === 'counters') {
        // Default counters route should go to list
        setCurrentView('list');
        setSelectedCounter(null);
        // Update hash to be more specific
        window.location.hash = 'counters/list';
      } else if (hash.startsWith('counters/details/')) {
        const counterId = hash.split('/')[2];
        const counter = counters.find(c => c.id === counterId);
        if (counter) {
          setSelectedCounter(counter);
          setCurrentView('details');
        } else {
          setCurrentView('list');
          setSelectedCounter(null);
          window.location.hash = 'counters/list';
        }
      } else if (hash === '' || !hash.startsWith('counters')) {
        // If we're in the counters component but hash doesn't match, default to list
        setCurrentView('list');
        setSelectedCounter(null);
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, [counters]);

  // Mock data for demonstration - replace with API calls
  const mockCounters: Counter[] = [
    {
      id: '1',
      name: 'Main Counter',
      location: 'Ground Floor, Main Hall',
      isActive: true,
      franchise: {
        id: '1',
        name: 'Roti Factory - Central Delhi',
        code: 'RF-CD-001'
      },
      manager: {
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@rotifactory.com',
        phone: '+91 9876543210'
      },
      createdAt: '2024-01-15T10:00:00Z',
      updatedAt: '2024-01-15T10:00:00Z'
    },
    {
      id: '2',
      name: 'Express Counter',
      location: 'First Floor, Quick Service',
      isActive: true,
      franchise: {
        id: '1',
        name: 'Roti Factory - Central Delhi',
        code: 'RF-CD-001'
      },
      manager: {
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@rotifactory.com',
        phone: '+91 9876543211'
      },
      createdAt: '2024-01-20T14:30:00Z',
      updatedAt: '2024-01-20T14:30:00Z'
    }
  ];

  useEffect(() => {
    // Simulate API call
    setLoading(true);
    setTimeout(() => {
      setCounters(mockCounters);
      setLoading(false);
    }, 1000);
  }, []);

  useEffect(() => {
    if (currentView === 'list' && counters.length > 0) {
      anime({
        targets: '.counter-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });
    }
  }, [currentView, counters]);

  const handleAddCounter = () => {
    // Validate form data
    if (!formData.name.trim() || !formData.manager.trim() || !formData.contactNumber.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Simulate adding counter
      const newCounter: Counter = {
        id: Date.now().toString(),
        name: formData.name.trim(),
        location: formData.address.trim(),
        isActive: true,
        franchise: mockCounters[0]?.franchise || {
          id: '1',
          name: 'Roti Factory - Central Delhi',
          code: 'RF-CD-001'
        },
        manager: {
          firstName: formData.manager.trim().split(' ')[0] || '',
          lastName: formData.manager.trim().split(' ')[1] || '',
          email: `${formData.manager.toLowerCase().replace(/\s+/g, '.')}@rotifactory.com`,
          phone: formData.contactNumber.trim()
        },
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };

      setCounters(prev => [...prev, newCounter]);
      setFormData({ name: '', manager: '', contactNumber: '', address: '' });

      // Show success message
      alert(`Counter "${newCounter.name}" added successfully!`);

      // Navigate to Counters submenu to show the new counter
      window.location.hash = 'counters/list';
    } catch (error) {
      console.error('Error adding counter:', error);
      alert('Failed to add counter. Please try again.');
    }
  };

  const openCounterDetails = (counter: Counter) => {
    setSelectedCounter(counter);
    setCurrentView('details');
    // Update URL to reflect counter details view
    window.location.hash = `counters/details/${counter.id}`;
  };

  const generateReport = async () => {
    if (!reportFilters.counterId || !reportFilters.date) {
      alert('Please select a counter and date');
      return;
    }

    setIsGeneratingReport(true);
    try {
      // Simulate API call - replace with actual API
      await new Promise(resolve => setTimeout(resolve, 2000));

      const selectedCounter = counters.find(c => c.id === reportFilters.counterId);
      const mockReportData = {
        counter: selectedCounter,
        date: reportFilters.date,
        summary: {
          totalInput: 500,
          totalOutput: 450,
          totalSales: 3600,
          efficiency: 90,
          wastage: 50
        },
        products: [
          { name: 'Plain Roti', input: 200, output: 180, sales: 1440, wastage: 20 },
          { name: 'Butter Roti', input: 150, output: 140, sales: 1680, wastage: 10 },
          { name: 'Masala Roti', input: 100, output: 90, sales: 1350, wastage: 10 },
          { name: 'Wheat Roti', input: 50, output: 40, sales: 400, wastage: 10 }
        ],
        hourlyData: Array.from({ length: 12 }, (_, i) => ({
          hour: `${i + 8}:00`,
          sales: Math.floor(Math.random() * 300) + 100,
          orders: Math.floor(Math.random() * 20) + 5
        }))
      };

      setReportData(mockReportData);
    } catch (error) {
      console.error('Failed to generate report:', error);
      alert('Failed to generate report');
    } finally {
      setIsGeneratingReport(false);
    }
  };

  const downloadReport = () => {
    if (!reportData) return;

    // Create CSV content
    const csvContent = [
      ['Counter Report'],
      ['Counter:', reportData.counter.name],
      ['Date:', reportData.date],
      ['Location:', reportData.counter.location],
      [''],
      ['Summary'],
      ['Total Input:', reportData.summary.totalInput],
      ['Total Output:', reportData.summary.totalOutput],
      ['Total Sales:', `₹${reportData.summary.totalSales}`],
      ['Efficiency:', `${reportData.summary.efficiency}%`],
      ['Wastage:', reportData.summary.wastage],
      [''],
      ['Product Details'],
      ['Product', 'Input', 'Output', 'Sales', 'Wastage'],
      ...reportData.products.map((p: any) => [p.name, p.input, p.output, `₹${p.sales}`, p.wastage])
    ].map(row => row.join(',')).join('\n');

    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `counter-report-${reportData.counter.name}-${reportData.date}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
  };

  const renderCountersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Counters</h2>
          <p className="text-gray-600">View and manage all your counter locations</p>
        </div>
      </div>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading counters...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {counters.map((counter) => (
            <div
              key={counter.id}
              className="counter-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => openCounterDetails(counter)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">💻</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  counter.isActive
                    ? 'bg-green-100 text-green-800'
                    : 'bg-red-100 text-red-800'
                }`}>
                  {counter.isActive ? 'Active' : 'Inactive'}
                </span>
              </div>

              <h3 className="text-xl font-bold text-gray-900 mb-2">{counter.name}</h3>
              <p className="text-gray-600 mb-4">{counter.location}</p>

              <div className="space-y-2 mb-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Manager</span>
                  <span className="text-sm font-medium">
                    {counter.manager ? `${counter.manager.firstName} ${counter.manager.lastName}` : 'Not assigned'}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Contact</span>
                  <span className="text-sm font-medium">{counter.manager?.phone || 'N/A'}</span>
                </div>
                <div className="flex items-center justify-between">
                  <span className="text-sm text-gray-500">Franchise</span>
                  <span className="text-sm font-medium">{counter.franchise.code}</span>
                </div>
              </div>

              <div className="pt-4 border-t border-gray-200">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-gray-500">Created</span>
                  <span className="font-medium">{new Date(counter.createdAt).toLocaleDateString()}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && counters.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 3v2m6-2v2M9 19v2m6-2v2M5 9H3m2 6H3m18-6h-2m2 6h-2M7 19h10a2 2 0 002-2V7a2 2 0 00-2-2H7a2 2 0 00-2 2v10a2 2 0 002 2zM9 9h6v6H9V9z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No counters found</h3>
          <p className="text-gray-500 mb-4">Use the "Add Counters" submenu to create your first counter.</p>
          <p className="text-sm text-gray-400">Navigate to Counter Management → Add Counters</p>
        </div>
      )}
    </div>
  );

  const renderAddCounterForm = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Add New Counter</h2>
          <p className="text-gray-600">Create a new counter location for your franchise</p>
        </div>
      </div>

      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <form onSubmit={(e) => { e.preventDefault(); handleAddCounter(); }} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-2">
                Counter Name *
              </label>
              <input
                type="text"
                id="name"
                value={formData.name}
                onChange={(e) => setFormData(prev => ({ ...prev, name: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="e.g., Main Counter, Express Counter"
                required
              />
            </div>

            <div>
              <label htmlFor="manager" className="block text-sm font-medium text-gray-700 mb-2">
                Manager Name *
              </label>
              <input
                type="text"
                id="manager"
                value={formData.manager}
                onChange={(e) => setFormData(prev => ({ ...prev, manager: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="e.g., John Doe"
                required
              />
            </div>

            <div>
              <label htmlFor="contactNumber" className="block text-sm font-medium text-gray-700 mb-2">
                Contact Number *
              </label>
              <input
                type="tel"
                id="contactNumber"
                value={formData.contactNumber}
                onChange={(e) => setFormData(prev => ({ ...prev, contactNumber: e.target.value }))}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
                placeholder="e.g., +91 9876543210"
                required
              />
            </div>

            <div>
              <label htmlFor="address" className="block text-sm font-medium text-gray-700 mb-2">
                Address *
              </label>
              <textarea
                id="address"
                value={formData.address}
                onChange={(e) => setFormData(prev => ({ ...prev, address: e.target.value }))}
                rows={3}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors resize-none"
                placeholder="e.g., Ground Floor, Main Hall, Building A"
                required
              />
            </div>
          </div>

          <div className="flex items-center justify-end pt-6 border-t border-gray-200">
            <button
              type="submit"
              className="px-8 py-3 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Counter</span>
            </button>
          </div>
        </form>
      </div>
    </div>
  );

  const renderCounterDetails = () => {
    if (!selectedCounter) return null;

    // Mock daily data - replace with API call
    const dailyData: CounterDetailsData = {
      date: new Date().toISOString().split('T')[0],
      input: 500,
      output: 450,
      sales: 3600,
      products: [
        { name: 'Plain Roti', input: 200, output: 180, sales: 1440 },
        { name: 'Butter Roti', input: 150, output: 140, sales: 1680 },
        { name: 'Masala Roti', input: 100, output: 90, sales: 1350 },
        { name: 'Wheat Roti', input: 50, output: 40, sales: 400 }
      ]
    };

    return (
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-2xl font-bold text-gray-900">{selectedCounter.name}</h2>
            <p className="text-gray-600">{selectedCounter.location}</p>
          </div>
          <button
            onClick={() => {
              setCurrentView('list');
              setSelectedCounter(null);
              window.location.hash = 'counters/list';
            }}
            className="bg-gray-600 hover:bg-gray-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
            </svg>
            <span>Back to Counters</span>
          </button>
        </div>

        {/* Counter Info */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Counter Information</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div>
              <p className="text-sm text-gray-500">Manager</p>
              <p className="font-medium">
                {selectedCounter.manager ? `${selectedCounter.manager.firstName} ${selectedCounter.manager.lastName}` : 'Not assigned'}
              </p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Contact</p>
              <p className="font-medium">{selectedCounter.manager?.phone || 'N/A'}</p>
            </div>
            <div>
              <p className="text-sm text-gray-500">Status</p>
              <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                selectedCounter.isActive
                  ? 'bg-green-100 text-green-800'
                  : 'bg-red-100 text-red-800'
              }`}>
                {selectedCounter.isActive ? 'Active' : 'Inactive'}
              </span>
            </div>
          </div>
        </div>

        {/* Daily Summary */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Daily Input</p>
                <p className="text-2xl font-bold text-blue-600">{dailyData.input}</p>
                <p className="text-xs text-gray-400">Units</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H3" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Daily Output</p>
                <p className="text-2xl font-bold text-orange-600">{dailyData.output}</p>
                <p className="text-xs text-gray-400">Units</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <div className="flex items-center">
              <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-500">Daily Sales</p>
                <p className="text-2xl font-bold text-green-600">₹{dailyData.sales}</p>
                <p className="text-xs text-gray-400">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Product-wise Details */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-6">Product-wise Daily Record</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Input</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Output</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Sales (₹)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {dailyData.products.map((product, index) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-4 px-4 text-center text-blue-600 font-medium">{product.input}</td>
                    <td className="py-4 px-4 text-center text-orange-600 font-medium">{product.output}</td>
                    <td className="py-4 px-4 text-center text-green-600 font-medium">₹{product.sales}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (product.output / product.input) * 100 >= 90
                          ? 'bg-green-100 text-green-800'
                          : (product.output / product.input) * 100 >= 80
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((product.output / product.input) * 100)}%
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
  };

  const renderReportsView = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Counter Reports</h2>
          <p className="text-gray-600">Generate and download detailed reports for any counter</p>
        </div>
      </div>

      {/* Report Filters */}
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Report Filters</h3>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div>
            <label htmlFor="counter-select" className="block text-sm font-medium text-gray-700 mb-2">
              Select Counter *
            </label>
            <select
              id="counter-select"
              value={reportFilters.counterId}
              onChange={(e) => setReportFilters(prev => ({ ...prev, counterId: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            >
              <option value="">Choose a counter...</option>
              {counters.map(counter => (
                <option key={counter.id} value={counter.id}>
                  {counter.name} - {counter.location}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label htmlFor="report-date" className="block text-sm font-medium text-gray-700 mb-2">
              Report Date *
            </label>
            <input
              type="date"
              id="report-date"
              value={reportFilters.date}
              onChange={(e) => setReportFilters(prev => ({ ...prev, date: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
              required
            />
          </div>

          <div>
            <label htmlFor="report-type" className="block text-sm font-medium text-gray-700 mb-2">
              Report Type
            </label>
            <select
              id="report-type"
              value={reportFilters.reportType}
              onChange={(e) => setReportFilters(prev => ({ ...prev, reportType: e.target.value }))}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 transition-colors"
            >
              <option value="daily">Daily Report</option>
              <option value="weekly">Weekly Report</option>
              <option value="monthly">Monthly Report</option>
            </select>
          </div>
        </div>

        <div className="flex items-center justify-end mt-6">
          <button
            onClick={generateReport}
            disabled={isGeneratingReport || !reportFilters.counterId || !reportFilters.date}
            className="px-6 py-3 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
          >
            {isGeneratingReport ? (
              <>
                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                <span>Generating...</span>
              </>
            ) : (
              <>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Generate Report</span>
              </>
            )}
          </button>
        </div>
      </div>

      {/* Report Results */}
      {reportData && (
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg font-semibold text-gray-900">Report Results</h3>
            <button
              onClick={downloadReport}
              className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
              <span>Download CSV</span>
            </button>
          </div>

          {/* Report Header */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-6 p-4 bg-gray-50 rounded-lg">
            <div>
              <h4 className="font-semibold text-gray-900">Counter Information</h4>
              <p className="text-gray-600">Name: {reportData.counter.name}</p>
              <p className="text-gray-600">Location: {reportData.counter.location}</p>
              <p className="text-gray-600">Date: {new Date(reportData.date).toLocaleDateString()}</p>
            </div>
            <div>
              <h4 className="font-semibold text-gray-900">Summary</h4>
              <p className="text-gray-600">Total Sales: ₹{reportData.summary.totalSales}</p>
              <p className="text-gray-600">Efficiency: {reportData.summary.efficiency}%</p>
              <p className="text-gray-600">Wastage: {reportData.summary.wastage} units</p>
            </div>
          </div>

          {/* Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
            <div className="bg-blue-50 p-4 rounded-lg">
              <h4 className="font-semibold text-blue-900">Total Input</h4>
              <p className="text-2xl font-bold text-blue-700">{reportData.summary.totalInput}</p>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <h4 className="font-semibold text-green-900">Total Output</h4>
              <p className="text-2xl font-bold text-green-700">{reportData.summary.totalOutput}</p>
            </div>
            <div className="bg-purple-50 p-4 rounded-lg">
              <h4 className="font-semibold text-purple-900">Total Sales</h4>
              <p className="text-2xl font-bold text-purple-700">₹{reportData.summary.totalSales}</p>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <h4 className="font-semibold text-orange-900">Efficiency</h4>
              <p className="text-2xl font-bold text-orange-700">{reportData.summary.efficiency}%</p>
            </div>
          </div>

          {/* Product Details Table */}
          <div className="overflow-x-auto">
            <h4 className="font-semibold text-gray-900 mb-4">Product-wise Details</h4>
            <table className="w-full">
              <thead>
                <tr className="border-b border-gray-200">
                  <th className="text-left py-3 px-4 font-semibold text-gray-900">Product</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Input</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Output</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Sales (₹)</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Wastage</th>
                  <th className="text-center py-3 px-4 font-semibold text-gray-900">Efficiency</th>
                </tr>
              </thead>
              <tbody>
                {reportData.products.map((product: any, index: number) => (
                  <tr key={index} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-4 font-medium text-gray-900">{product.name}</td>
                    <td className="py-4 px-4 text-center text-blue-600 font-medium">{product.input}</td>
                    <td className="py-4 px-4 text-center text-green-600 font-medium">{product.output}</td>
                    <td className="py-4 px-4 text-center text-purple-600 font-medium">₹{product.sales}</td>
                    <td className="py-4 px-4 text-center text-red-600 font-medium">{product.wastage}</td>
                    <td className="py-4 px-4 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        (product.output / product.input) * 100 >= 90
                          ? 'bg-green-100 text-green-800'
                          : (product.output / product.input) * 100 >= 80
                          ? 'bg-yellow-100 text-yellow-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {Math.round((product.output / product.input) * 100)}%
                      </span>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  );

  return (
    <div className="p-6">
      {currentView === 'list' && renderCountersList()}
      {currentView === 'add' && renderAddCounterForm()}
      {currentView === 'details' && renderCounterDetails()}
      {currentView === 'reports' && renderReportsView()}
    </div>
  );
};

export default Counters;
