import React, { useState, useEffect } from 'react';
import anime from 'animejs';

interface Franchise {
  id: string;
  name: string;
  code: string;
  location: string;
  manager: string;
  phone: string;
  email: string;
  status: 'Active' | 'Inactive' | 'Pending';
  monthlyRevenue: number;
  royaltyRate: number;
  joinDate: string;
}

const Franchises: React.FC = () => {
  const [currentView, setCurrentView] = useState<'list' | 'performance' | 'royalty' | 'onboarding'>('list');
  const [franchises, setFranchises] = useState<Franchise[]>([]);

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'franchises/list') {
        setCurrentView('list');
      } else if (hash === 'franchises/performance') {
        setCurrentView('performance');
      } else if (hash === 'franchises/royalty') {
        setCurrentView('royalty');
      } else if (hash === 'franchises/onboarding') {
        setCurrentView('onboarding');
      } else if (hash === 'franchises') {
        setCurrentView('list');
        window.location.hash = 'franchises/list';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Load mock data
  useEffect(() => {
    const mockFranchises: Franchise[] = [
      {
        id: '1',
        name: 'Roti Factory - Central Delhi',
        code: 'RF-CD-001',
        location: 'Connaught Place, New Delhi',
        manager: 'Rajesh Kumar',
        phone: '+91 9876543210',
        email: 'rajesh@rotifactory.com',
        status: 'Active',
        monthlyRevenue: 250000,
        royaltyRate: 8,
        joinDate: '2024-01-15'
      },
      {
        id: '2',
        name: 'Roti Factory - Mumbai West',
        code: 'RF-MW-002',
        location: 'Bandra West, Mumbai',
        manager: 'Priya Sharma',
        phone: '+91 9876543211',
        email: 'priya@rotifactory.com',
        status: 'Active',
        monthlyRevenue: 320000,
        royaltyRate: 8,
        joinDate: '2024-02-01'
      },
      {
        id: '3',
        name: 'Roti Factory - Bangalore Tech',
        code: 'RF-BT-003',
        location: 'Koramangala, Bangalore',
        manager: 'Amit Singh',
        phone: '+91 9876543212',
        email: 'amit@rotifactory.com',
        status: 'Pending',
        monthlyRevenue: 0,
        royaltyRate: 8,
        joinDate: '2024-03-01'
      }
    ];
    setFranchises(mockFranchises);
  }, []);

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.franchise-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const tabs = [
    { id: 'list', name: 'All Franchises', icon: '🏪' },
    { id: 'performance', name: 'Performance', icon: '📊' },
    { id: 'royalty', name: 'Royalty Management', icon: '💰' },
    { id: 'onboarding', name: 'Onboarding', icon: '🚀' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Franchise Management</h2>
          <p className="text-gray-600">Manage franchise locations and track performance</p>
        </div>
        <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
          Add New Franchise
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
                  window.location.hash = `franchises/${tab.id}`;
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
      <div className="franchise-content">
        {currentView === 'list' && <FranchiseListPage franchises={franchises} />}
        {currentView === 'performance' && <PerformancePage franchises={franchises} />}
        {currentView === 'royalty' && <RoyaltyPage franchises={franchises} />}
        {currentView === 'onboarding' && <OnboardingPage />}
      </div>
    </div>
  );
};

const FranchiseListPage: React.FC<{ franchises: Franchise[] }> = ({ franchises }) => {
  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        {franchises.map((franchise) => (
          <div key={franchise.id} className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300">
            <div className="flex items-center justify-between mb-4">
              <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                <span className="text-white font-bold text-lg">🏪</span>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                franchise.status === 'Active' ? 'bg-green-100 text-green-800' :
                franchise.status === 'Pending' ? 'bg-yellow-100 text-yellow-800' :
                'bg-red-100 text-red-800'
              }`}>
                {franchise.status}
              </span>
            </div>

            <h3 className="text-xl font-bold text-gray-900 mb-2">{franchise.name}</h3>
            <p className="text-gray-600 mb-4">{franchise.location}</p>

            <div className="space-y-2 mb-4">
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Code</span>
                <span className="text-sm font-medium">{franchise.code}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Manager</span>
                <span className="text-sm font-medium">{franchise.manager}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm text-gray-500">Monthly Revenue</span>
                <span className="text-sm font-medium text-green-600">₹{franchise.monthlyRevenue.toLocaleString()}</span>
              </div>
            </div>

            <div className="pt-4 border-t border-gray-200">
              <div className="flex items-center justify-between text-sm">
                <span className="text-gray-500">Joined</span>
                <span className="font-medium">{new Date(franchise.joinDate).toLocaleDateString()}</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

const PerformancePage: React.FC<{ franchises: Franchise[] }> = ({ franchises }) => {
  const totalRevenue = franchises.reduce((sum, f) => sum + f.monthlyRevenue, 0);
  const activeFranchises = franchises.filter(f => f.status === 'Active').length;

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center">
              <span className="text-blue-600 text-xl">📊</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Total Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{totalRevenue.toLocaleString()}</p>
            </div>
          </div>
        </div>
        <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center">
              <span className="text-green-600 text-xl">🏪</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Active Franchises</p>
              <p className="text-2xl font-bold text-gray-900">{activeFranchises}</p>
            </div>
          </div>
        </div>
        <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <div className="flex items-center">
            <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
              <span className="text-purple-600 text-xl">📈</span>
            </div>
            <div className="ml-4">
              <p className="text-sm text-gray-600">Avg Revenue</p>
              <p className="text-2xl font-bold text-gray-900">₹{Math.round(totalRevenue / activeFranchises).toLocaleString()}</p>
            </div>
          </div>
        </div>
      </div>

      <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Franchise Performance</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Growth</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {franchises.map((franchise) => (
                <tr key={franchise.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div>
                      <div className="font-medium text-gray-900">{franchise.name}</div>
                      <div className="text-sm text-gray-500">{franchise.code}</div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{franchise.monthlyRevenue.toLocaleString()}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className="text-green-600 font-medium">+12%</span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      franchise.status === 'Active' ? 'bg-green-100 text-green-800' : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {franchise.status}
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

const RoyaltyPage: React.FC<{ franchises: Franchise[] }> = ({ franchises }) => {
  return (
    <div className="space-y-6">
      <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Royalty Calculations</h3>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Franchise</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Revenue</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Rate</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Royalty Due</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {franchises.filter(f => f.status === 'Active').map((franchise) => {
                const royaltyDue = franchise.monthlyRevenue * (franchise.royaltyRate / 100);
                return (
                  <tr key={franchise.id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="font-medium text-gray-900">{franchise.name}</div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">₹{franchise.monthlyRevenue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap text-gray-900">{franchise.royaltyRate}%</td>
                    <td className="px-6 py-4 whitespace-nowrap font-medium text-green-600">₹{royaltyDue.toLocaleString()}</td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className="inline-flex px-2 py-1 text-xs font-semibold rounded-full bg-green-100 text-green-800">
                        Paid
                      </span>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

const OnboardingPage: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="franchise-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">New Franchise Onboarding</h3>
        <div className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Franchise Name</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="e.g., Roti Factory - Location" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Location</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="e.g., City, State" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name</label>
              <input type="text" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="e.g., John Doe" />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Contact Number</label>
              <input type="tel" className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500" placeholder="e.g., +91 9876543210" />
            </div>
          </div>
          <div className="flex justify-end">
            <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors">
              Start Onboarding Process
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Franchises;
