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
      <div className={`fixed left-0 top-0 h-full bg-white shadow-2xl z-50 transition-transform duration-300 ${
        isOpen ? 'translate-x-0' : '-translate-x-full'
      } w-80 lg:translate-x-0 lg:static lg:shadow-none border-r border-gray-200`}>
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <div className="w-10 h-10 bg-gradient-to-r from-green-500 to-green-600 rounded-full flex items-center justify-center">
              <span className="text-white font-bold text-lg">🥖</span>
            </div>
            <div>
              <h2 className="text-lg font-bold text-gray-900">Roti Factory</h2>
              <p className="text-xs text-gray-500">ERP System</p>
            </div>
          </div>
          <button
            onClick={onToggle}
            className="lg:hidden p-2 rounded-lg hover:bg-gray-100 transition-colors"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
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
                    <span className="text-xl">{item.icon}</span>
                    <span className="font-medium">{item.name}</span>
                  </div>
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
                </button>

                {/* Submenu */}
                {expandedMenus.includes(item.id) && (
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

        {/* Footer */}
        <div className="p-4 border-t border-gray-200">
          <div className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
            <div className="w-8 h-8 bg-green-500 rounded-full flex items-center justify-center">
              <span className="text-white text-sm font-bold">A</span>
            </div>
            <div className="flex-1">
              <p className="text-sm font-medium text-gray-900">Admin User</p>
              <p className="text-xs text-gray-500">Super Administrator</p>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Sidebar;
