import React, { useEffect, useRef, useState } from 'react';
import anime from 'animejs';
import ContentManager from './ContentManager';

interface AnimatedDashboardProps {
  onLogout: () => void;
}

const AnimatedDashboard: React.FC<AnimatedDashboardProps> = ({ onLogout }) => {
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());
  const [sidebarOpen, setSidebarOpen] = useState(true);
  const [activeSection, setActiveSection] = useState('dashboard');
  const [expandedMenus, setExpandedMenus] = useState<string[]>([]);

  // Auto-expand menus based on active section
  useEffect(() => {
    if (activeSection.startsWith('sales')) {
      setExpandedMenus(prev =>
        prev.includes('sales') ? prev : [...prev, 'sales']
      );
    } else if (activeSection.startsWith('manufacturing')) {
      setExpandedMenus(prev =>
        prev.includes('manufacturing') ? prev : [...prev, 'manufacturing']
      );
    } else if (activeSection.startsWith('franchises')) {
      setExpandedMenus(prev =>
        prev.includes('franchises') ? prev : [...prev, 'franchises']
      );
    } else if (activeSection.startsWith('counters')) {
      setExpandedMenus(prev =>
        prev.includes('counters') ? prev : [...prev, 'counters']
      );
    } else if (activeSection.startsWith('finance')) {
      setExpandedMenus(prev =>
        prev.includes('finance') ? prev : [...prev, 'finance']
      );
    } else if (activeSection.startsWith('hr')) {
      setExpandedMenus(prev =>
        prev.includes('hr') ? prev : [...prev, 'hr']
      );
    } else if (activeSection.startsWith('settings')) {
      setExpandedMenus(prev =>
        prev.includes('settings') ? prev : [...prev, 'settings']
      );
    }
  }, [activeSection]);

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Animate dashboard elements on mount
  useEffect(() => {
    if (dashboardRef.current) {
      anime({
        targets: dashboardRef.current,
        opacity: [0, 1],
        translateY: [20, 0],
        duration: 800,
        easing: 'easeOutQuart'
      });

      anime({
        targets: '.metric-card',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });

      anime({
        targets: '.action-button',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 500,
        delay: anime.stagger(50, {start: 400}),
        easing: 'easeOutBack'
      });
    }
  }, []);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: 'M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 00-1-1V7a2 2 0 012-2h7l2 2h3a2 2 0 012 2v1M3 7l2-2M3 7l2 2m0 0v10a2 2 0 002 2h14a2 2 0 002-2V9a1 1 0 00-1-1H6a1 1 0 00-1-1V7a2 2 0 012-2h7l2 2h3a2 2 0 012 2v1',
      path: 'dashboard',
      subItems: [
        { id: 'overview', name: 'Overview', path: 'dashboard/overview' },
        { id: 'analytics', name: 'Analytics', path: 'dashboard/analytics' },
        { id: 'reports', name: 'Reports', path: 'dashboard/reports' }
      ]
    },
    {
      id: 'manufacturing',
      name: 'Manufacturing',
      icon: 'M19.428 15.428a2 2 0 00-1.022-.547l-2.387-.477a6 6 0 00-3.86.517l-.318.158a6 6 0 01-3.86.517L6.05 15.21a2 2 0 00-1.806.547A8.014 8.014 0 004 21h16a8.014 8.014 0 00-.244-5.572zM12 2v10m-4-6l4-4 4 4',
      path: 'manufacturing',
      subItems: [
        { id: 'products', name: 'Products', path: 'manufacturing/products' },
        { id: 'raw-materials', name: 'Raw Materials', path: 'manufacturing/raw-materials' },
        { id: 'inventory', name: 'Inventory', path: 'manufacturing/inventory' },
        { id: 'production', name: 'Production', path: 'manufacturing/production' },
        { id: 'quality', name: 'Quality Control', path: 'manufacturing/quality' }
      ]
    },
    {
      id: 'sales',
      name: 'Sales & Orders',
      icon: 'M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z',
      path: 'sales',
      subItems: [
        { id: 'orders', name: 'Orders', path: 'sales/orders' },
        { id: 'pos', name: 'Point of Sale', path: 'sales/pos' },
        { id: 'sales-reports', name: 'Sales Reports', path: 'sales/reports' }
      ]
    },
    {
      id: 'franchises',
      name: 'Franchises',
      icon: 'M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4',
      path: 'franchises',
      subItems: [
        { id: 'franchise-list', name: 'All Franchises', path: 'franchises/list' },
        { id: 'franchise-performance', name: 'Performance', path: 'franchises/performance' },
        { id: 'royalty', name: 'Royalty Management', path: 'franchises/royalty' },
        { id: 'onboarding', name: 'Onboarding', path: 'franchises/onboarding' }
      ]
    },
    {
      id: 'counters',
      name: 'Counter Management',
      icon: 'M9 17V7m0 10a2 2 0 01-2 2H5a2 2 0 01-2-2V7a2 2 0 012-2h2a2 2 0 012 2m0 10a2 2 0 002 2h2a2 2 0 002-2M9 7a2 2 0 012-2h2a2 2 0 012 2m0 0v10a2 2 0 002 2h2a2 2 0 002-2V7a2 2 0 00-2-2h-2a2 2 0 00-2 2',
      path: 'counters',
      subItems: [
        { id: 'counters-list', name: 'Counters', path: 'counters/list' },
        { id: 'add-counter', name: 'Add Counters', path: 'counters/add' },
        { id: 'counter-reports', name: 'Reports', path: 'counters/reports' }
      ]
    },
    {
      id: 'finance',
      name: 'Finance',
      icon: 'M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1',
      path: 'finance',
      subItems: [
        { id: 'accounts', name: 'Accounts', path: 'finance/accounts' },
        { id: 'expenses', name: 'Expenses', path: 'finance/expenses' },
        { id: 'profit-loss', name: 'P&L Statement', path: 'finance/profit-loss' },
        { id: 'tax', name: 'Tax Management', path: 'finance/tax' }
      ]
    },
    {
      id: 'hr',
      name: 'Human Resources',
      icon: 'M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 515.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 919.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z',
      path: 'hr',
      subItems: [
        { id: 'employees', name: 'Employees', path: 'hr/employees' },
        { id: 'attendance', name: 'Attendance', path: 'hr/attendance' },
        { id: 'payroll', name: 'Payroll', path: 'hr/payroll' },
        { id: 'training', name: 'Training', path: 'hr/training' }
      ]
    },
    {
      id: 'settings',
      name: 'Settings',
      icon: 'M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z',
      path: 'settings',
      subItems: [
        { id: 'general', name: 'General Settings', path: 'settings/general' },
        { id: 'users', name: 'User Management', path: 'settings/users' },
        { id: 'permissions', name: 'Permissions', path: 'settings/permissions' },
        { id: 'backup', name: 'Backup & Restore', path: 'settings/backup' }
      ]
    }
  ];

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleItemClick = (path: string) => {
    setActiveSection(path);
    // Update the hash URL so individual page components can respond
    window.location.hash = path;
    anime({
      targets: `[data-path="${path}"]`,
      scale: [1, 0.95, 1],
      duration: 200,
      easing: 'easeOutQuart'
    });
  };

  const handleMainMenuClick = (item: any) => {
    toggleMenu(item.id);
    setActiveSection(item.path);
    // Update the hash URL for main menu items too
    window.location.hash = item.path;
  };

  return (
    <div className="flex h-screen bg-gradient-to-br from-green-50 via-white to-green-50">
      {/* Sidebar */}
      <div className={`${sidebarOpen ? 'w-64' : 'w-16'} bg-white shadow-xl transition-all duration-300 flex-shrink-0 border-r border-green-100`}>
        <div className="flex flex-col h-full">
          {/* Logo */}
          <div className="flex items-center justify-between p-4 border-b border-green-100">
            <div className={`flex items-center space-x-3 ${!sidebarOpen && 'justify-center'}`}>
              <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              {sidebarOpen && (
                <div>
                  <h1 className="text-lg font-bold text-gray-900">Roti Factory</h1>
                  <p className="text-xs text-gray-500">ERP System</p>
                </div>
              )}
            </div>
            <button
              onClick={() => setSidebarOpen(!sidebarOpen)}
              className="p-2 rounded-lg hover:bg-gray-100 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
              </svg>
            </button>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-2">
              {menuItems.map((item) => (
                <div key={item.id} className="sidebar-item">
                  <button
                    onClick={() => handleMainMenuClick(item)}
                    className={`w-full flex items-center justify-between p-3 rounded-lg transition-all duration-200 ${
                      activeSection.startsWith(item.path)
                        ? 'bg-green-50 text-green-700 border border-green-200'
                        : 'text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    <div className="flex items-center space-x-3">
                      <svg className="w-5 h-5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d={item.icon} />
                      </svg>
                      {sidebarOpen && <span className="font-medium">{item.name}</span>}
                    </div>
                    {sidebarOpen && (
                      <svg
                        className={`w-4 h-4 transition-transform duration-200 ${
                          expandedMenus.includes(item.id) ? 'rotate-180' : ''
                        }`}
                        fill="none"
                        stroke="currentColor"
                        viewBox="0 0 24 24"
                      >
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    )}
                  </button>

                  {/* Submenu */}
                  {sidebarOpen && expandedMenus.includes(item.id) && (
                    <div className="mt-2 ml-6 space-y-1">
                      {item.subItems.map((subItem) => (
                        <button
                          key={subItem.id}
                          data-path={subItem.path}
                          onClick={() => handleItemClick(subItem.path)}
                          className={`w-full text-left p-2 rounded-lg text-sm transition-all duration-200 ${
                            activeSection === subItem.path
                              ? 'bg-green-100 text-green-800 font-medium'
                              : 'text-gray-600 hover:bg-gray-50 hover:text-gray-900'
                          }`}
                        >
                          {subItem.name}
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              ))}
            </div>
          </nav>

          {/* User Section */}
          <div className="p-4 border-t border-green-100">
            <button
              onClick={onLogout}
              className={`w-full flex items-center space-x-3 px-3 py-3 rounded-lg text-red-600 hover:bg-red-50 transition-colors ${!sidebarOpen && 'justify-center'}`}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
              </svg>
              {sidebarOpen && <span className="font-medium">Logout</span>}
            </button>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div ref={dashboardRef} className="flex-1 flex flex-col overflow-hidden">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200 px-6 py-4">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                {menuItems.find(item => activeSection.startsWith(item.path))?.name || 'Dashboard'}
              </h1>
              <p className="text-sm text-gray-600">
                {currentTime.toLocaleDateString()} - {currentTime.toLocaleTimeString()}
              </p>
            </div>
          </div>
        </header>

        {/* Main Content Area */}
        <main className="flex-1 overflow-y-auto p-6">
          {activeSection === 'dashboard' ? (
            <div className="max-w-7xl mx-auto">
              {/* Welcome Section */}
              <div className="mb-8">
                <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Dashboard</h2>
                <p className="text-gray-600">Monitor your roti factory operations in real-time</p>
              </div>

              {/* Live Metrics */}
              <div className="grid grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                <div className="metric-card bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-blue-100 text-sm">Active Orders</p>
                      <p className="text-3xl font-bold">23</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
                    </div>
                  </div>
                </div>

                <div className="metric-card bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-purple-100 text-sm">Online Customers</p>
                      <p className="text-3xl font-bold">156</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
                    </div>
                  </div>
                </div>

                <div className="metric-card bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-green-100 text-sm">Production Rate</p>
                      <p className="text-3xl font-bold">94%</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
                    </div>
                  </div>
                </div>

                <div className="metric-card bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-6 text-white shadow-xl">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-orange-100 text-sm">Today's Revenue</p>
                      <p className="text-3xl font-bold">₹45,670</p>
                    </div>
                    <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
                      <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                      </svg>
                    </div>
                  </div>
                </div>
              </div>

              {/* Quick Actions */}
              <div className="bg-white rounded-2xl shadow-xl p-6 mb-8">
                <h3 className="text-xl font-semibold text-gray-900 mb-6">Quick Actions</h3>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                  <button
                    onClick={() => handleItemClick('sales/orders')}
                    className="action-button flex flex-col items-center p-4 bg-gradient-to-r from-green-50 to-green-100 rounded-xl hover:from-green-100 hover:to-green-200 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">New Order</span>
                  </button>

                  <button
                    onClick={() => handleItemClick('manufacturing/products')}
                    className="action-button flex flex-col items-center p-4 bg-gradient-to-r from-blue-50 to-blue-100 rounded-xl hover:from-blue-100 hover:to-blue-200 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Add Product</span>
                  </button>

                  <button
                    onClick={() => handleItemClick('dashboard/reports')}
                    className="action-button flex flex-col items-center p-4 bg-gradient-to-r from-purple-50 to-purple-100 rounded-xl hover:from-purple-100 hover:to-purple-200 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">View Reports</span>
                  </button>

                  <button
                    onClick={() => handleItemClick('hr/employees')}
                    className="action-button flex flex-col items-center p-4 bg-gradient-to-r from-orange-50 to-orange-100 rounded-xl hover:from-orange-100 hover:to-orange-200 transition-all duration-300 group"
                  >
                    <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-xl flex items-center justify-center mb-3 group-hover:scale-110 transition-transform">
                      <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 01 5.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 01 9.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                      </svg>
                    </div>
                    <span className="text-sm font-medium text-gray-700">Manage Staff</span>
                  </button>
                </div>
              </div>
            </div>
          ) : (
            <ContentManager activeSection={activeSection} onOpenModal={(modalType) => console.log('Open modal:', modalType)} />
          )}
        </main>
      </div>
    </div>
  );
};

export default AnimatedDashboard;
