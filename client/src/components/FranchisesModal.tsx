import React, { useEffect, useState } from 'react';
import anime from 'animejs';
import { franchisesAPI } from '../services/api';

interface FranchisesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Franchise {
  id: string;
  name: string;
  code: string;
  ownerName: string;
  ownerEmail: string;
  ownerPhone: string;
  address: string;
  city: string;
  state: string;
  pincode: string;
  gstNumber: string;
  licenseNumber: string;
  royaltyRate: string;
  status: string;
  openingDate: string;
  creator: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  manager: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  counters: Array<{
    id: string;
    name: string;
    location: string;
    isActive: boolean;
  }>;
  _count: {
    sales: number;
    royaltyPayments: number;
  };
}

const FranchisesModal: React.FC<FranchisesModalProps> = ({ isOpen, onClose }) => {
  const [franchises, setFranchises] = useState<Franchise[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchFranchises = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await franchisesAPI.getFranchises();
      setFranchises(response.data || []);
    } catch (err) {
      console.error('Failed to fetch franchises:', err);
      setError('Failed to load franchises');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchFranchises();

      anime({
        targets: '.franchises-modal',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (franchises.length > 0) {
      anime({
        targets: '.franchise-item',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });
    }
  }, [franchises]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'ACTIVE': return 'bg-green-100 text-green-800';
      case 'INACTIVE': return 'bg-red-100 text-red-800';
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="franchises-modal bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-500 to-purple-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Active Franchises</h2>
              <p className="text-purple-100">Franchise performance and management</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">{franchises.length}</p>
              <p className="text-purple-100">Total Franchises</p>
            </div>
            <button
              onClick={onClose}
              className="p-2 hover:bg-white/20 rounded-lg transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-purple-600"></div>
              <span className="ml-2 text-gray-600">Loading franchises...</span>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-6">
              <div className="flex">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-red-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-red-800">{error}</h3>
                  <button
                    onClick={fetchFranchises}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && franchises.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-900">Total Franchises</h3>
                  <p className="text-2xl font-bold text-green-700">
                    {franchises.length}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-900">Active Franchises</h3>
                  <p className="text-2xl font-bold text-blue-700">
                    {franchises.filter(f => f.status === 'ACTIVE').length}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-900">Total Counters</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    {franchises.reduce((sum, f) => sum + f.counters.length, 0)}
                  </p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-orange-900">Avg Royalty Rate</h3>
                  <p className="text-2xl font-bold text-orange-700">
                    {franchises.length > 0 ? Math.round(franchises.reduce((sum, f) => sum + parseFloat(f.royaltyRate), 0) / franchises.length * 10) / 10 : 0}%
                  </p>
                </div>
              </div>
            </>
          )}

          {!loading && !error && franchises.length > 0 && (
            <>
              {/* Franchises Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {franchises.map((franchise, index) => (
                  <div key={franchise.id} className="franchise-item bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-purple-400 to-purple-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{franchise.name}</h4>
                          <p className="text-sm text-gray-500">{franchise.address}, {franchise.city}</p>
                          <p className="text-xs text-gray-400">Code: {franchise.code}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(franchise.status)}`}>
                          {getStatusText(franchise.status)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Owner</span>
                        <span className="text-sm font-medium">{franchise.ownerName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Manager</span>
                        <span className="text-sm font-medium">{franchise.manager.firstName} {franchise.manager.lastName}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Phone</span>
                        <span className="text-sm font-medium">{franchise.ownerPhone}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Royalty Rate</span>
                        <span className="text-sm font-bold text-green-600">{franchise.royaltyRate}%</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Counters</span>
                        <span className="text-sm font-medium">{franchise.counters.length}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Opening Date</span>
                        <span className="text-sm font-medium">{new Date(franchise.openingDate).toLocaleDateString()}</span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-purple-100 text-purple-700 rounded-lg text-sm hover:bg-purple-200 transition-colors">
                        View Details
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                        Manage
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && franchises.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No franchises found</h3>
              <p className="text-gray-500">Get started by adding your first franchise.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FranchisesModal;
