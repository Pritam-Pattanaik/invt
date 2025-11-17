import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import { countersAPI } from '../services/api';
import { formatDate } from '../utils/dateUtils';

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
  remaining: number;
  sales: number;
  products: Array<{
    name: string;
    input: number;
    remaining: number;
    sales: number;
  }>;
}

interface CounterOrder {
  id: string;
  orderDate: string;
  totalQuantity: number;
  totalPackets: number;
  status: string;
  notes?: string;
  items: Array<{
    id: string;
    packetSize: number;
    quantity: number;
    totalRotis: number;
  }>;
}

interface CounterInventory {
  id: string;
  date: string;
  packetSize: number;
  totalPackets: number;
  totalRotis: number;
  soldPackets: number;
  soldRotis: number;
  remainingPackets: number;
  remainingRotis: number;
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

  // Counter Order Management
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showRemaining, setShowRemaining] = useState(false);
  const [showEditCounter, setShowEditCounter] = useState(false);
  const [counterOrders, setCounterOrders] = useState<CounterOrder[]>([]);
  const [counterInventory, setCounterInventory] = useState<CounterInventory[]>([]);
  const [orderForm, setOrderForm] = useState({
    items: [{ packetSize: 10, quantity: 1 }],
    notes: ''
  });
  const [editCounterForm, setEditCounterForm] = useState({
    name: '',
    location: '',
    isActive: true
  });
  const [todaysData, setTodaysData] = useState({
    totalInput: 0,
    totalRemaining: 0,
    totalSales: 0
  });

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
    // Fetch real counters from API
    const fetchCounters = async () => {
      setLoading(true);
      try {
        const response = await countersAPI.getCounters();
        if (response.data && response.data.data) {
          setCounters(response.data.data);
        }
      } catch (error) {
        console.error('Error fetching counters:', error);
        // Fallback to mock data if API fails
        setCounters(mockCounters);
      } finally {
        setLoading(false);
      }
    };

    fetchCounters();
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

  // Fetch counter data when a counter is selected
  useEffect(() => {
    if (selectedCounter && currentView === 'details') {
      fetchCounterData(selectedCounter.id);
    }
  }, [selectedCounter, currentView]);

  const handleAddCounter = async () => {
    // Validate form data
    if (!formData.name.trim() || !formData.manager.trim() || !formData.contactNumber.trim() || !formData.address.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Get the first franchise ID from existing counters or use a default
      const franchiseId = counters[0]?.franchise?.id || 'cmbhvemc1000j3fkkraqs714z';

      const response = await countersAPI.createCounter({
        franchiseId,
        name: formData.name.trim(),
        location: formData.address.trim()
      });

      if (response.data) {
        // Refresh the counters list
        const countersResponse = await countersAPI.getCounters();
        if (countersResponse.data && countersResponse.data.data) {
          setCounters(countersResponse.data.data);
        }

        setFormData({ name: '', manager: '', contactNumber: '', address: '' });

        // Show success message
        alert(`Counter "${formData.name}" added successfully!`);

        // Navigate to Counters submenu to show the new counter
        window.location.hash = 'counters/list';
      }
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

  // Counter Order Management Functions
  const fetchCounterData = async (counterId: string) => {
    try {
      const today = new Date().toISOString().split('T')[0];

      // Fetch orders and inventory for today
      const [ordersResponse, inventoryResponse] = await Promise.all([
        countersAPI.getCounterOrders(counterId, { date: today }),
        countersAPI.getCounterInventory(counterId, { date: today })
      ]);

      setCounterOrders(ordersResponse.data?.data || []);
      setCounterInventory(inventoryResponse.data?.data || []);

      // Calculate today's totals
      const inventory = inventoryResponse.data?.data || [];
      const totals = inventory.reduce((acc: any, item: any) => ({
        totalInput: acc.totalInput + item.totalRotis,
        totalRemaining: acc.totalRemaining + item.remainingRotis,
        totalSales: acc.totalSales + (item.soldRotis * 2) // Assuming ₹2 per roti
      }), { totalInput: 0, totalRemaining: 0, totalSales: 0 });

      setTodaysData(totals);
    } catch (error) {
      console.error('Error fetching counter data:', error);
    }
  };

  const handleAddOrder = async () => {
    if (!selectedCounter) return;

    try {
      const response = await countersAPI.createCounterOrder(selectedCounter.id, orderForm);

      if (response.data) {
        alert('Order added successfully!');
        setShowAddOrder(false);
        setOrderForm({
          items: [{ packetSize: 10, quantity: 1 }],
          notes: ''
        });

        // Refresh counter data
        await fetchCounterData(selectedCounter.id);
      }
    } catch (error) {
      console.error('Error adding order:', error);
      alert('Failed to add order. Please try again.');
    }
  };

  const addOrderItem = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { packetSize: 10, quantity: 1 }]
    }));
  };

  const removeOrderItem = (index: number) => {
    if (orderForm.items.length > 1) {
      setOrderForm(prev => ({
        ...prev,
        items: prev.items.filter((_, i) => i !== index)
      }));
    }
  };

  const updateOrderItem = (index: number, field: 'packetSize' | 'quantity', value: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const handleEditCounter = async () => {
    if (!selectedCounter || !editCounterForm.name.trim() || !editCounterForm.location.trim()) {
      alert('Please fill in all required fields');
      return;
    }

    try {
      // Note: This would need a PUT endpoint for updating counters
      // For now, we'll just update the local state
      const updatedCounter = {
        ...selectedCounter,
        name: editCounterForm.name.trim(),
        location: editCounterForm.location.trim(),
        isActive: editCounterForm.isActive
      };

      setSelectedCounter(updatedCounter);
      setCounters(prev => prev.map(c => c.id === selectedCounter.id ? updatedCounter : c));
      setShowEditCounter(false);
      alert('Counter updated successfully!');
    } catch (error) {
      console.error('Error updating counter:', error);
      alert('Failed to update counter. Please try again.');
    }
  };

  const openEditCounter = () => {
    if (selectedCounter) {
      setEditCounterForm({
        name: selectedCounter.name,
        location: selectedCounter.location,
        isActive: selectedCounter.isActive
      });
      setShowEditCounter(true);
    }
  };

  const renderCountersList = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Counters</h2>
          <p className="text-gray-600">View and manage all your counter locations</p>
        </div>
        <button
          onClick={() => {
            setCurrentView('add');
            window.location.hash = 'counters/add';
          }}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
          </svg>
          <span>Add Counter</span>
        </button>
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
                  <span className="font-medium">{formatDate(counter.createdAt)}</span>
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

    return (
      <div className="space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h2 className="text-xl sm:text-2xl font-bold text-gray-900">{selectedCounter.name}</h2>
            <p className="text-sm sm:text-base text-gray-600">{selectedCounter.location}</p>
          </div>
          <div className="flex flex-col sm:flex-row gap-3">
            <button
              onClick={() => setShowAddOrder(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add Order</span>
            </button>
            <button
              onClick={() => setShowRemaining(true)}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
              </svg>
              <span>Remaining</span>
            </button>
            <button
              onClick={() => {
                setCurrentView('list');
                setSelectedCounter(null);
                window.location.hash = 'counters/list';
              }}
              className="bg-gray-600 hover:bg-gray-700 text-white px-4 sm:px-6 py-2 sm:py-3 rounded-lg font-medium transition-colors duration-200 flex items-center justify-center space-x-2 text-sm sm:text-base"
            >
              <svg className="w-4 h-4 sm:w-5 sm:h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              <span className="hidden sm:inline">Back to Counters</span>
              <span className="sm:hidden">Back</span>
            </button>
          </div>
        </div>

        {/* Counter Info */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-semibold text-gray-900">Counter Information</h3>
            <button
              onClick={openEditCounter}
              className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
              </svg>
              <span>Edit</span>
            </button>
          </div>
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

        {/* Today's Summary */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 sm:gap-6">
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-blue-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16l-4-4m0 0l4-4m-4 4h18" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Today's Input</p>
                <p className="text-xl sm:text-2xl font-bold text-blue-600">{todaysData.totalInput}</p>
                <p className="text-xs text-gray-400">Rotis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-orange-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Today's Remaining</p>
                <p className="text-xl sm:text-2xl font-bold text-orange-600">{todaysData.totalRemaining}</p>
                <p className="text-xs text-gray-400">Rotis</p>
              </div>
            </div>
          </div>

          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <div className="flex items-center">
              <div className="w-10 h-10 sm:w-12 sm:h-12 bg-green-100 rounded-full flex items-center justify-center">
                <svg className="w-5 h-5 sm:w-6 sm:h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
              </div>
              <div className="ml-3 sm:ml-4">
                <p className="text-xs sm:text-sm text-gray-500">Today's Sales</p>
                <p className="text-xl sm:text-2xl font-bold text-green-600">₹{todaysData.totalSales}</p>
                <p className="text-xs text-gray-400">Revenue</p>
              </div>
            </div>
          </div>
        </div>

        {/* Today's Orders and Remaining Data */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 sm:gap-6">
          {/* Today's Orders */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Today's Orders</h3>
            {counterOrders.length > 0 ? (
              <div className="space-y-3">
                {counterOrders.map((order) => (
                  <div key={order.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                      <div>
                        <p className="font-medium text-gray-900">Order #{order.id.slice(-6)}</p>
                        <p className="text-sm text-gray-600">{formatDate(order.orderDate)}</p>
                      </div>
                      <div className="text-right">
                        <p className="text-sm text-gray-500">Total Packets: {order.totalPackets}</p>
                        <p className="text-sm font-medium text-blue-600">Total Rotis: {order.totalQuantity}</p>
                      </div>
                    </div>
                    <div className="mt-3 space-y-1">
                      {order.items.map((item, index) => (
                        <div key={index} className="text-sm text-gray-600 flex justify-between">
                          <span>{item.quantity} packets × {item.packetSize} rotis</span>
                          <span className="font-medium">{item.totalRotis} rotis</span>
                        </div>
                      ))}
                    </div>
                    {order.notes && (
                      <p className="mt-2 text-sm text-gray-500 italic">Note: {order.notes}</p>
                    )}
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <p className="text-gray-500">No orders for today</p>
                <button
                  onClick={() => setShowAddOrder(true)}
                  className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Add First Order
                </button>
              </div>
            )}
          </div>

          {/* Remaining Roti Data */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-4 sm:p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Remaining Roti</h3>
            {counterInventory.length > 0 ? (
              <div className="space-y-3">
                {counterInventory.map((inventory) => (
                  <div key={inventory.id} className="border border-gray-200 rounded-lg p-4">
                    <div className="flex items-center justify-between mb-2">
                      <h4 className="font-medium text-gray-900">Packet Size: {inventory.packetSize} rotis</h4>
                      <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                        inventory.remainingPackets > 0
                          ? 'bg-green-100 text-green-800'
                          : 'bg-red-100 text-red-800'
                      }`}>
                        {inventory.remainingPackets > 0 ? 'Available' : 'Out of Stock'}
                      </span>
                    </div>
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div>
                        <p className="text-gray-500">Total Received</p>
                        <p className="font-medium">{inventory.totalPackets} packets ({inventory.totalRotis} rotis)</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sold</p>
                        <p className="font-medium">{inventory.soldPackets} packets ({inventory.soldRotis} rotis)</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Remaining</p>
                        <p className="font-medium text-orange-600">{inventory.remainingPackets} packets ({inventory.remainingRotis} rotis)</p>
                      </div>
                      <div>
                        <p className="text-gray-500">Sales Rate</p>
                        <p className="font-medium">
                          {inventory.totalPackets > 0
                            ? Math.round((inventory.soldPackets / inventory.totalPackets) * 100)
                            : 0
                          }%
                        </p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-12 h-12 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
                <p className="text-gray-500">No inventory data for today</p>
                <button
                  onClick={() => setShowAddOrder(true)}
                  className="mt-2 text-green-600 hover:text-green-700 text-sm font-medium"
                >
                  Add First Order
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Add Order Modal */}
        {showAddOrder && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Add Order - {selectedCounter.name}</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleAddOrder(); }} className="space-y-4">
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <label className="block text-sm font-medium text-gray-700">Order Items *</label>
                    <button
                      type="button"
                      onClick={addOrderItem}
                      className="text-green-600 hover:text-green-800 text-sm font-medium"
                    >
                      + Add Item
                    </button>
                  </div>
                  <div className="space-y-3">
                    {orderForm.items.map((item, index) => (
                      <div key={index} className="p-3 bg-gray-50 rounded-lg">
                        <div className="flex flex-col sm:flex-row sm:items-center space-y-3 sm:space-y-0 sm:space-x-3">
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Packet Size (rotis per packet)</label>
                            <input
                              type="number"
                              value={item.packetSize}
                              onChange={(e) => updateOrderItem(index, 'packetSize', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="e.g., 10"
                              min="1"
                              required
                            />
                          </div>
                          <div className="flex-1">
                            <label className="block text-xs text-gray-500 mb-1">Quantity (number of packets)</label>
                            <input
                              type="number"
                              value={item.quantity}
                              onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                              placeholder="e.g., 5"
                              min="1"
                              required
                            />
                          </div>
                          <div className="flex items-center justify-between sm:justify-start space-x-3">
                            <div className="text-center">
                              <p className="text-xs text-gray-500">Total Rotis</p>
                              <p className="text-sm font-medium text-gray-900">{item.packetSize * item.quantity}</p>
                            </div>
                            {orderForm.items.length > 1 && (
                              <button
                                type="button"
                                onClick={() => removeOrderItem(index)}
                                className="text-red-600 hover:text-red-800 p-1"
                              >
                                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                </svg>
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                  {orderForm.items.length > 0 && (
                    <div className="mt-3 p-3 bg-green-50 rounded-lg">
                      <div className="flex justify-between items-center">
                        <span className="font-medium text-green-900">Total Order:</span>
                        <div className="text-right">
                          <p className="text-sm text-green-700">
                            {orderForm.items.reduce((sum, item) => sum + item.quantity, 0)} packets
                          </p>
                          <p className="text-lg font-bold text-green-700">
                            {orderForm.items.reduce((sum, item) => sum + (item.packetSize * item.quantity), 0)} rotis
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                  <textarea
                    value={orderForm.notes}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, notes: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500 text-sm"
                    rows={3}
                    placeholder="Any additional notes for this order..."
                  />
                </div>

                <div className="flex flex-col sm:flex-row justify-end space-y-3 sm:space-y-0 sm:space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => {
                      setShowAddOrder(false);
                      setOrderForm({
                        items: [{ packetSize: 10, quantity: 1 }],
                        notes: ''
                      });
                    }}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                  >
                    {loading ? 'Adding...' : 'Add Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {/* Remaining Modal */}
        {showRemaining && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-4 sm:p-6 w-full max-w-4xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h3 className="text-lg font-semibold text-gray-900">Remaining Inventory - {selectedCounter.name}</h3>
                <button
                  onClick={() => setShowRemaining(false)}
                  className="text-gray-400 hover:text-gray-600"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {counterInventory.length > 0 ? (
                <div className="space-y-4">
                  {counterInventory.map((inventory) => (
                    <div key={inventory.id} className="border border-gray-200 rounded-lg p-4">
                      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
                        <div className="text-center p-3 bg-blue-50 rounded-lg">
                          <p className="text-sm text-blue-600 font-medium">Packet Size</p>
                          <p className="text-xl font-bold text-blue-700">{inventory.packetSize}</p>
                          <p className="text-xs text-blue-500">rotis per packet</p>
                        </div>
                        <div className="text-center p-3 bg-green-50 rounded-lg">
                          <p className="text-sm text-green-600 font-medium">Total Received</p>
                          <p className="text-xl font-bold text-green-700">{inventory.totalPackets}</p>
                          <p className="text-xs text-green-500">{inventory.totalRotis} rotis</p>
                        </div>
                        <div className="text-center p-3 bg-red-50 rounded-lg">
                          <p className="text-sm text-red-600 font-medium">Sold</p>
                          <p className="text-xl font-bold text-red-700">{inventory.soldPackets}</p>
                          <p className="text-xs text-red-500">{inventory.soldRotis} rotis</p>
                        </div>
                        <div className="text-center p-3 bg-orange-50 rounded-lg">
                          <p className="text-sm text-orange-600 font-medium">Remaining</p>
                          <p className="text-xl font-bold text-orange-700">{inventory.remainingPackets}</p>
                          <p className="text-xs text-orange-500">{inventory.remainingRotis} rotis</p>
                        </div>
                      </div>
                    </div>
                  ))}

                  <div className="mt-6 p-4 bg-gray-50 rounded-lg">
                    <h4 className="font-semibold text-gray-900 mb-3">Summary</h4>
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 text-center">
                      <div>
                        <p className="text-sm text-gray-600">Total Input Today</p>
                        <p className="text-2xl font-bold text-blue-600">{todaysData.totalInput}</p>
                        <p className="text-xs text-gray-500">rotis</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Total Remaining</p>
                        <p className="text-2xl font-bold text-orange-600">{todaysData.totalRemaining}</p>
                        <p className="text-xs text-gray-500">rotis</p>
                      </div>
                      <div>
                        <p className="text-sm text-gray-600">Sales Rate</p>
                        <p className="text-2xl font-bold text-green-600">
                          {todaysData.totalInput > 0
                            ? Math.round(((todaysData.totalInput - todaysData.totalRemaining) / todaysData.totalInput) * 100)
                            : 0
                          }%
                        </p>
                        <p className="text-xs text-gray-500">sold</p>
                      </div>
                    </div>
                  </div>
                </div>
              ) : (
                <div className="text-center py-12">
                  <svg className="w-16 h-16 text-gray-300 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                  </svg>
                  <h3 className="text-lg font-medium text-gray-900 mb-2">No inventory data</h3>
                  <p className="text-gray-600 mb-4">No roti inventory found for today.</p>
                  <button
                    onClick={() => {
                      setShowRemaining(false);
                      setShowAddOrder(true);
                    }}
                    className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700"
                  >
                    Add First Order
                  </button>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Edit Counter Modal */}
        {showEditCounter && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-xl p-6 w-full max-w-md">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Counter</h3>
              <form onSubmit={(e) => { e.preventDefault(); handleEditCounter(); }} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Counter Name *</label>
                  <input
                    type="text"
                    value={editCounterForm.name}
                    onChange={(e) => setEditCounterForm(prev => ({ ...prev, name: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Main Counter"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Location *</label>
                  <input
                    type="text"
                    value={editCounterForm.location}
                    onChange={(e) => setEditCounterForm(prev => ({ ...prev, location: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    placeholder="e.g., Ground Floor - Main Hall"
                    required
                  />
                </div>
                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="isActive"
                    checked={editCounterForm.isActive}
                    onChange={(e) => setEditCounterForm(prev => ({ ...prev, isActive: e.target.checked }))}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="isActive" className="ml-2 block text-sm text-gray-700">
                    Active Counter
                  </label>
                </div>
                <div className="flex justify-end space-x-3 pt-4">
                  <button
                    type="button"
                    onClick={() => setShowEditCounter(false)}
                    className="px-4 py-2 text-gray-600 hover:text-gray-800 border border-gray-300 rounded-lg"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                  >
                    Update Counter
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
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
              <p className="text-gray-600">Date: {formatDate(reportData.date)}</p>
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
