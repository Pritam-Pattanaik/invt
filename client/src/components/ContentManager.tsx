import React from 'react';
import Counters from '../pages/Counters';
import Finance from '../pages/Finance';
import Sales from '../pages/Sales';
import Settings from '../pages/Settings';
import HumanResources from '../pages/HumanResources';
import Manufacturing from '../pages/Manufacturing';
import Franchises from '../pages/Franchises';
import Reports from '../pages/Reports';

interface ContentManagerProps {
  activeSection: string;
  onOpenModal: (modalType: string) => void;
}

const ContentManager: React.FC<ContentManagerProps> = ({ activeSection, onOpenModal }) => {
  const renderContent = () => {
    switch (activeSection) {
      case 'dashboard/overview':
      case 'dashboard':
        return null; // Default dashboard content

      case 'dashboard/analytics':
        return (
          <div className="p-6">
            <h2 className="text-2xl font-bold text-gray-900 mb-6">Analytics Dashboard</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Analytics</h3>
                <button 
                  onClick={() => onOpenModal('sales')}
                  className="btn btn-primary w-full"
                >
                  View Detailed Sales
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Order Analytics</h3>
                <button 
                  onClick={() => onOpenModal('orders')}
                  className="btn btn-primary w-full"
                >
                  View Order Details
                </button>
              </div>
              <div className="bg-white p-6 rounded-xl shadow-lg border border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Performance Metrics</h3>
                <button 
                  onClick={() => onOpenModal('franchises')}
                  className="btn btn-primary w-full"
                >
                  View Performance
                </button>
              </div>
            </div>
          </div>
        );

      case 'manufacturing':
      case 'manufacturing/products':
      case 'manufacturing/raw-materials':
      case 'manufacturing/inventory':
      case 'manufacturing/production':
      case 'manufacturing/quality':
        return <Manufacturing />;

      case 'dashboard/reports':
        return <Reports />;



      case 'franchises':
      case 'franchises/list':
      case 'franchises/performance':
      case 'franchises/royalty':
      case 'franchises/onboarding':
        return <Franchises />;

      case 'counters':
      case 'counters/list':
      case 'counters/add':
      case 'counters/reports':
        return <Counters />;

      case 'finance':
      case 'finance/accounts':
      case 'finance/expenses':
      case 'finance/profit-loss':
      case 'finance/tax':
        return <Finance />;

      case 'sales':
      case 'sales/orders':
      case 'sales/pos':
      case 'sales/reports':
        return <Sales />;

      case 'settings':
      case 'settings/general':
      case 'settings/users':
      case 'settings/permissions':
      case 'settings/backup':
        return <Settings />;

      case 'hr':
      case 'hr/employees':
      case 'hr/attendance':
      case 'hr/payroll':
      case 'hr/training':
        return <HumanResources />;

      default:
        return (
          <div className="p-6">
            <div className="bg-white p-8 rounded-xl shadow-lg border border-gray-200 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 21V5a2 2 0 00-2-2H7a2 2 0 00-2 2v16m14 0h2m-2 0h-5m-9 0H3m2 0h5M9 7h1m-1 4h1m4-4h1m-1 4h1m-5 10v-5a1 1 0 011-1h2a1 1 0 011 1v5m-4 0h4" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">
                {activeSection.split('/').pop()?.replace('-', ' ').toUpperCase() || 'SECTION'}
              </h3>
              <p className="text-gray-600 mb-4">
                This section is under development. More features coming soon!
              </p>
              <div className="flex justify-center space-x-4">
                <button 
                  onClick={() => onOpenModal('sales')}
                  className="btn btn-outline btn-sm"
                >
                  View Sales
                </button>
                <button 
                  onClick={() => onOpenModal('orders')}
                  className="btn btn-outline btn-sm"
                >
                  View Orders
                </button>
              </div>
            </div>
          </div>
        );
    }
  };

  return (
    <div className="flex-1">
      {renderContent()}
    </div>
  );
};

export default ContentManager;
