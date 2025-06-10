import React, { useState, useEffect } from 'react';
import anime from 'animejs';

interface SidebarProps {
  isOpen: boolean;
  onToggle: () => void;
  activeSection: string;
  onSectionChange: (section: string) => void;
}

const Sidebar: React.FC<SidebarProps> = ({ isOpen, onToggle, activeSection, onSectionChange }) => {
  const [expandedMenus, setExpandedMenus] = useState<string[]>(['dashboard']);

  // Auto-expand menus based on active section
  useEffect(() => {
    if (activeSection.startsWith('counters')) {
      setExpandedMenus(prev =>
        prev.includes('counters') ? prev : [...prev, 'counters']
      );
    } else if (activeSection.startsWith('franchises')) {
      setExpandedMenus(prev =>
        prev.includes('franchises') ? prev : [...prev, 'franchises']
      );
    } else if (activeSection.startsWith('manufacturing')) {
      setExpandedMenus(prev =>
        prev.includes('manufacturing') ? prev : [...prev, 'manufacturing']
      );
    } else if (activeSection.startsWith('finance')) {
      setExpandedMenus(prev =>
        prev.includes('finance') ? prev : [...prev, 'finance']
      );
    } else if (activeSection.startsWith('sales')) {
      setExpandedMenus(prev =>
        prev.includes('sales') ? prev : [...prev, 'sales']
      );
    } else if (activeSection.startsWith('settings')) {
      setExpandedMenus(prev =>
        prev.includes('settings') ? prev : [...prev, 'settings']
      );
    } else if (activeSection.startsWith('hr')) {
      setExpandedMenus(prev =>
        prev.includes('hr') ? prev : [...prev, 'hr']
      );
    }
  }, [activeSection]);

  const menuItems = [
    {
      id: 'dashboard',
      name: 'Dashboard',
      icon: '📊',
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
      icon: '🏭',
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
      icon: '🛒',
      path: 'sales',
      subItems: [
        { id: 'orders', name: 'Orders', path: 'sales/orders' },
        { id: 'advance-orders', name: 'Advance Orders', path: 'sales/advance-orders' },
        { id: 'pos', name: 'Point of Sale', path: 'sales/pos' },
        { id: 'sales-reports', name: 'Sales Reports', path: 'sales/reports' }
      ]
    },
    {
      id: 'franchises',
      name: 'Franchises',
      icon: '🏪',
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
      icon: '💻',
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
      icon: '💰',
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
      icon: '👥',
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
      icon: '⚙️',
      path: 'settings',
      subItems: [
        { id: 'general', name: 'General Settings', path: 'settings/general' },
        { id: 'users', name: 'User Management', path: 'settings/users' },
        { id: 'permissions', name: 'Permissions', path: 'settings/permissions' },
        { id: 'backup', name: 'Backup & Restore', path: 'settings/backup' }
      ]
    }
  ];

  useEffect(() => {
    if (isOpen) {
      anime({
        targets: '.sidebar-item',
        opacity: [0, 1],
        translateX: [-20, 0],
        duration: 300,
        delay: anime.stagger(50),
        easing: 'easeOutQuart'
      });
    }
  }, [isOpen]);

  const toggleMenu = (menuId: string) => {
    setExpandedMenus(prev => 
      prev.includes(menuId) 
        ? prev.filter(id => id !== menuId)
        : [...prev, menuId]
    );
  };

  const handleItemClick = (path: string) => {
    onSectionChange(path);
    // Update URL hash for proper routing
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
    // If it's a main menu item, also set it as active
    onSectionChange(item.path);
    // Update URL hash for proper routing
    window.location.hash = item.path;
  };

  return (
    <>
      {/* Overlay for mobile */}
      {isOpen && (
        <div 
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onToggle}
        />
      )}

      {/* Sidebar */}
      <div className={`fixed left-0 top-0 h-full bg-gradient-to-b from-white via-green-50/30 to-white shadow-2xl z-50 transition-all duration-500 ease-out ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-80 lg:translate-x-0 lg:static lg:shadow-xl border-r border-gradient-to-b from-green-200/50 to-gray-200 overflow-hidden`}>

        {/* Enhanced animated background overlay */}
        <div className="absolute inset-0 bg-gradient-to-br from-green-500/8 via-transparent to-blue-500/8 pointer-events-none"></div>

        {/* Floating geometric shapes */}
        <div className="absolute top-0 right-0 w-40 h-40 bg-gradient-to-bl from-green-200/15 to-transparent rounded-full transform translate-x-20 -translate-y-20 animate-pulse"></div>
        <div className="absolute bottom-0 left-0 w-32 h-32 bg-gradient-to-tr from-blue-200/15 to-transparent rounded-full transform -translate-x-16 translate-y-16 animate-pulse" style={{animationDelay: '1s'}}></div>
        <div className="absolute top-1/3 right-0 w-24 h-24 bg-gradient-to-l from-purple-200/10 to-transparent rounded-full transform translate-x-12 animate-pulse" style={{animationDelay: '2s'}}></div>

        {/* Animated gradient lines */}
        <div className="absolute left-0 top-1/4 w-1 h-32 bg-gradient-to-b from-transparent via-green-300/30 to-transparent animate-pulse"></div>
        <div className="absolute right-0 top-2/3 w-1 h-24 bg-gradient-to-b from-transparent via-blue-300/30 to-transparent animate-pulse" style={{animationDelay: '1.5s'}}></div>

        {/* Enhanced Header */}
        <div className="relative flex items-center justify-between p-6 border-b border-gradient-to-r from-green-200/50 to-gray-200/50 bg-white/90 backdrop-blur-sm">
          {/* Animated background for header */}
          <div className="absolute inset-0 bg-gradient-to-r from-green-50/50 via-white/50 to-blue-50/50 opacity-60"></div>

          <div className="flex items-center space-x-4 relative z-10">
            <div className="relative group">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform hover:scale-110 hover:rotate-3 transition-all duration-300 group-hover:shadow-2xl">
                <span className="text-white font-bold text-2xl group-hover:scale-110 transition-transform duration-300">🥖</span>
              </div>
              {/* Multiple status indicators */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full animate-pulse border-2 border-white shadow-lg">
                <div className="absolute inset-0 bg-green-500 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full animate-bounce border border-white"></div>
            </div>
            <div>
              <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-green-700 via-green-600 to-blue-700 hover:from-green-800 hover:to-blue-800 transition-all duration-300">
                Roti Factory
              </h2>
              <p className="text-sm text-gray-600 font-semibold flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                ERP System
              </p>
              <div className="flex items-center mt-1">
                <div className="w-16 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              </div>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-3 rounded-2xl hover:bg-gradient-to-r hover:from-green-100 hover:to-blue-100 transition-all duration-300 transform hover:scale-110 hover:rotate-12 relative z-10 group"
          >
            <svg className="w-6 h-6 text-gray-600 group-hover:text-green-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto p-4 relative">
          <div className="space-y-3">
            {menuItems.map((item) => (
              <div key={item.id} className="sidebar-item relative">
                <button
                  onClick={() => handleMainMenuClick(item)}
                  className={`sidebar-menu-enhanced w-full flex items-center justify-between p-4 rounded-2xl transition-all duration-300 transform hover:scale-105 group relative overflow-hidden ${
                    activeSection.startsWith(item.path)
                      ? 'bg-gradient-to-r from-green-100 via-green-50 to-blue-50 text-green-800 shadow-xl border border-green-200/50'
                      : 'text-gray-700 hover:bg-gradient-to-r hover:from-gray-50 hover:to-green-50/30 hover:shadow-lg'
                  }`}
                >
                  {/* Enhanced animated background for active item */}
                  {activeSection.startsWith(item.path) && (
                    <>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-400/15 to-blue-400/15 rounded-2xl"></div>
                      <div className="absolute left-0 top-0 bottom-0 w-1 bg-gradient-to-b from-green-500 to-blue-500 rounded-r-full"></div>
                      <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl animate-pulse"></div>
                    </>
                  )}

                  {/* Hover effect overlay */}
                  <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-blue-400/0 group-hover:from-green-400/5 group-hover:to-blue-400/5 rounded-2xl transition-all duration-300"></div>

                  <div className="flex items-center space-x-4 relative z-10">
                    <div className={`w-12 h-12 rounded-xl flex items-center justify-center transition-all duration-300 relative ${
                      activeSection.startsWith(item.path)
                        ? 'bg-gradient-to-br from-green-500 to-green-600 shadow-xl transform rotate-3 scale-110'
                        : 'bg-gray-100 group-hover:bg-gradient-to-br group-hover:from-green-400 group-hover:to-green-500 group-hover:shadow-lg group-hover:scale-110'
                    }`}>
                      {/* Icon glow effect */}
                      {activeSection.startsWith(item.path) && (
                        <div className="absolute inset-0 bg-gradient-to-br from-green-400 to-green-600 rounded-xl blur-sm opacity-50 animate-pulse"></div>
                      )}
                      <span className={`text-xl transition-all duration-300 relative z-10 ${
                        activeSection.startsWith(item.path) ? 'text-white' : 'group-hover:text-white'
                      }`}>{item.icon}</span>
                    </div>
                    <div className="flex flex-col items-start">
                      <span className="font-bold text-sm">{item.name}</span>
                      {activeSection.startsWith(item.path) && (
                        <span className="text-xs text-green-600 font-medium opacity-75">Active</span>
                      )}
                    </div>
                  </div>
                  <div className="relative z-10 flex items-center space-x-2">
                    {/* Item count badge */}
                    <span className={`text-xs px-2 py-1 rounded-full transition-all duration-300 ${
                      activeSection.startsWith(item.path)
                        ? 'bg-green-200 text-green-800'
                        : 'bg-gray-200 text-gray-600 group-hover:bg-green-100 group-hover:text-green-700'
                    }`}>
                      {item.subItems.length}
                    </span>
                    <svg
                      className={`w-5 h-5 transition-all duration-300 ${
                        expandedMenus.includes(item.id) ? 'rotate-180 text-green-600' : 'text-gray-400 group-hover:text-green-500'
                      }`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                    </svg>
                  </div>
                </button>

                {/* Enhanced Submenu */}
                {expandedMenus.includes(item.id) && (
                  <div className="mt-4 ml-8 space-y-2 relative">
                    {/* Enhanced connecting line with gradient */}
                    <div className="absolute left-0 top-0 bottom-0 w-px bg-gradient-to-b from-green-400 via-green-300 to-transparent"></div>
                    <div className="absolute left-0 top-0 w-2 h-2 bg-green-400 rounded-full transform -translate-x-0.5"></div>

                    {item.subItems.map((subItem) => (
                      <button
                        key={subItem.id}
                        data-path={subItem.path}
                        onClick={() => handleItemClick(subItem.path)}
                        className={`w-full text-left p-3 rounded-xl text-sm transition-all duration-300 transform hover:scale-105 hover:translate-x-2 relative group overflow-hidden ${
                          activeSection === subItem.path
                            ? 'bg-gradient-to-r from-green-200 via-green-100 to-blue-50 text-green-900 font-bold shadow-lg border-l-4 border-green-500'
                            : 'text-gray-600 hover:bg-gradient-to-r hover:from-green-50 hover:to-blue-50 hover:text-gray-900 hover:shadow-md hover:border-l-2 hover:border-green-300'
                        }`}
                      >
                        {/* Enhanced active indicator */}
                        {activeSection === subItem.path && (
                          <>
                            <div className="absolute left-2 top-1/2 transform -translate-y-1/2 w-3 h-3 bg-green-500 rounded-full animate-pulse shadow-lg">
                              <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
                            </div>
                            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-xl animate-pulse"></div>
                          </>
                        )}

                        {/* Hover effect */}
                        <div className="absolute inset-0 bg-gradient-to-r from-green-400/0 to-blue-400/0 group-hover:from-green-400/10 group-hover:to-blue-400/10 rounded-xl transition-all duration-300"></div>

                        <div className="relative z-10 flex items-center justify-between">
                          <span className={`transition-all duration-300 ${
                            activeSection === subItem.path ? 'ml-6' : 'group-hover:ml-2'
                          }`}>
                            {subItem.name}
                          </span>

                          {/* Submenu item indicator */}
                          <div className={`w-2 h-2 rounded-full transition-all duration-300 ${
                            activeSection === subItem.path
                              ? 'bg-green-500'
                              : 'bg-gray-300 group-hover:bg-green-400'
                          }`}></div>
                        </div>

                        {/* Connecting dot */}
                        <div className="absolute left-0 top-1/2 transform -translate-y-1/2 -translate-x-4 w-2 h-2 bg-green-300 rounded-full opacity-50"></div>
                      </button>
                    ))}
                  </div>
                )}
              </div>
            ))}
          </div>
        </nav>

        {/* Enhanced Footer */}
        <div className="p-4 border-t border-gradient-to-r from-green-200/50 to-gray-200/50 bg-white/90 backdrop-blur-sm relative">
          {/* Enhanced animated background */}
          <div className="absolute inset-0 bg-gradient-to-t from-green-50/40 via-blue-50/20 to-transparent"></div>
          <div className="absolute inset-x-0 top-0 h-px bg-gradient-to-r from-transparent via-green-300/50 to-transparent"></div>

          <div className="relative flex items-center space-x-4 p-5 bg-gradient-to-r from-green-50 via-white to-blue-50 rounded-2xl shadow-xl border border-green-100/50 hover:shadow-2xl transition-all duration-300 transform hover:scale-105 group">
            {/* Enhanced background effects */}
            <div className="absolute inset-0 bg-gradient-to-r from-green-500/5 to-blue-500/5 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>

            <div className="relative">
              <div className="w-14 h-14 bg-gradient-to-br from-green-500 via-green-600 to-emerald-600 rounded-2xl flex items-center justify-center shadow-xl transform group-hover:scale-110 group-hover:rotate-3 transition-all duration-300">
                <span className="text-white text-xl font-bold group-hover:scale-110 transition-transform duration-300">A</span>
              </div>
              {/* Multiple status indicators */}
              <div className="absolute -top-1 -right-1 w-5 h-5 bg-green-400 rounded-full border-2 border-white shadow-lg">
                <div className="w-full h-full bg-green-500 rounded-full animate-pulse"></div>
                <div className="absolute inset-0 bg-green-400 rounded-full animate-ping opacity-75"></div>
              </div>
              <div className="absolute -bottom-1 -left-1 w-3 h-3 bg-blue-400 rounded-full border border-white animate-bounce"></div>
            </div>

            <div className="flex-1 min-w-0 relative z-10">
              <p className="text-sm font-black text-transparent bg-clip-text bg-gradient-to-r from-gray-900 via-green-800 to-blue-800 truncate group-hover:from-green-700 group-hover:to-blue-700 transition-all duration-300">
                Admin User
              </p>
              <p className="text-xs text-gray-600 font-semibold">Super Administrator</p>
              <div className="flex items-center mt-1">
                <div className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></div>
                <span className="text-xs text-green-600 font-bold">Online</span>
                <div className="ml-2 w-12 h-1 bg-gradient-to-r from-green-400 to-blue-400 rounded-full"></div>
              </div>
            </div>

            <div className="flex-shrink-0 flex space-x-2 relative z-10">
              <button className="p-2 rounded-xl hover:bg-white/70 transition-all duration-300 transform hover:scale-110 hover:rotate-12 group/btn">
                <svg className="w-4 h-4 text-gray-500 group-hover/btn:text-green-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                </svg>
              </button>
              <button className="p-2 rounded-xl hover:bg-white/70 transition-all duration-300 transform hover:scale-110 hover:rotate-12 group/btn">
                <svg className="w-4 h-4 text-gray-500 group-hover/btn:text-red-600 transition-colors duration-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 16l4-4m0 0l-4-4m4 4H7m6 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h4a3 3 0 013 3v1" />
                </svg>
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
