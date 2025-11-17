import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import anime from 'animejs';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { hostelsAPI } from '../services/api';

interface Hostel {
  id: string;
  name: string;
  code: string;
  managerName: string;
  managerPhone: string;
  address: string;
  city: string;
  state: string;
  status: 'ACTIVE' | 'INACTIVE';
  createdAt: string;
}

// @ts-ignore - Interface used for future implementation
interface HostelOrder {
  id: string;
  hostelId: string;
  orderDate: string;
  totalQuantity: number;
  totalPackets: number;
  status: string;
  items: HostelOrderItem[];
}

interface HostelOrderItem {
  id: string;
  packetSize: number;
  quantity: number;
  totalRotis: number;
}

const Hostels: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  // @ts-ignore - User context for future implementation
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'orders'>('list');
  const [hostels, setHostels] = useState<Hostel[]>([]);
  const [selectedHostel, setSelectedHostel] = useState<Hostel | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine current view from URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'add') setCurrentView('add');
    else if (path === 'orders') setCurrentView('orders');
    else setCurrentView('list');
  }, [location]);

  // Load hostels data
  useEffect(() => {
    loadHostels();
  }, []);

  const loadHostels = async () => {
    setLoading(true);
    try {
      const response = await hostelsAPI.getHostels();
      setHostels(response.data.hostels || []);
    } catch (error) {
      console.error('Failed to load hostels:', error);
      // Fallback to mock data if API fails
      const mockHostels: Hostel[] = [
        {
          id: '1',
          name: 'Student Paradise Hostel',
          code: 'SPH-001',
          managerName: 'Amit Singh',
          managerPhone: '+91 9876543210',
          address: '789 College Road',
          city: 'Pune',
          state: 'Maharashtra',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'City Center Hostel',
          code: 'CCH-002',
          managerName: 'Neha Patel',
          managerPhone: '+91 9876543211',
          address: '321 Market Street',
          city: 'Bangalore',
          state: 'Karnataka',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ];
      setHostels(mockHostels);
      toast.error('Failed to load hostels from server, showing sample data');
    } finally {
      setLoading(false);
    }
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.hostel-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView, hostels]);

  const openHostelDetails = (hostel: Hostel) => {
    setSelectedHostel(hostel);
    setShowOrderModal(true);
  };

  const tabs = [
    { id: 'list', name: 'All Hostels', icon: '🏠', path: '/hostels/list' },
    { id: 'add', name: 'Add Hostel', icon: '➕', path: '/hostels/add' },
    { id: 'orders', name: 'Daily Orders', icon: '📋', path: '/hostels/orders' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hostel Management</h2>
          <p className="text-gray-600">Manage hostels and track daily orders</p>
        </div>
        <button 
          onClick={() => navigate('/hostels/add')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Add New Hostel
        </button>
      </div>

      {/* Tabs */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => navigate(tab.path)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                currentView === tab.id
                  ? 'border-green-500 text-green-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              <span className="mr-2">{tab.icon}</span>
              {tab.name}
            </button>
          ))}
        </nav>
      </div>

      {/* Content */}
      <Routes>
        <Route path="/" element={<HostelListPage hostels={hostels} loading={loading} onHostelClick={openHostelDetails} />} />
        <Route path="/list" element={<HostelListPage hostels={hostels} loading={loading} onHostelClick={openHostelDetails} />} />
        <Route path="/add" element={<AddHostelPage onHostelAdded={loadHostels} />} />
        <Route path="/orders" element={<HostelOrdersPage hostels={hostels} />} />
      </Routes>

      {/* Hostel Details Modal */}
      {showOrderModal && selectedHostel && (
        <HostelDetailsModal
          hostel={selectedHostel}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedHostel(null);
          }}
        />
      )}
    </div>
  );
};

// Hostel List Component
const HostelListPage: React.FC<{
  hostels: Hostel[];
  loading: boolean;
  onHostelClick: (hostel: Hostel) => void;
}> = ({ hostels, loading, onHostelClick }) => {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading hostels...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hostels.map((hostel) => (
            <div
              key={hostel.id}
              className="hostel-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => onHostelClick(hostel)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏠</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  hostel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hostel.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{hostel.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Code: {hostel.code}</p>
              <p className="text-sm text-gray-600 mb-1">Manager: {hostel.managerName}</p>
              <p className="text-sm text-gray-600 mb-1">Phone: {hostel.managerPhone}</p>
              <p className="text-sm text-gray-600 mb-3">{hostel.city}, {hostel.state}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Added: {formatDate(hostel.createdAt)}</span>
                <span className="text-orange-600 hover:text-orange-800">Click for orders →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hostels.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏠</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hostels found</h3>
          <p className="text-gray-600">Add your first hostel to get started.</p>
        </div>
      )}
    </div>
  );
};

// Add Hostel Component
const AddHostelPage: React.FC<{ onHostelAdded: () => void }> = ({ onHostelAdded }) => {
  const [formData, setFormData] = useState({
    name: '',
    code: '',
    managerName: '',
    managerPhone: '',
    address: '',
    city: '',
    state: '',
    gstNumber: '',
    licenseNumber: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);

    try {
      await hostelsAPI.createHostel({
        name: formData.name,
        code: formData.code,
        managerName: formData.managerName,
        managerPhone: formData.managerPhone,
        address: formData.address,
        city: formData.city,
        state: formData.state,
        pincode: '000000', // Default pincode
        gstNumber: formData.gstNumber,
        licenseNumber: formData.licenseNumber,
      });

      toast.success('Hostel added successfully!');
      setFormData({
        name: '',
        code: '',
        managerName: '',
        managerPhone: '',
        address: '',
        city: '',
        state: '',
        gstNumber: '',
        licenseNumber: ''
      });
      onHostelAdded();
    } catch (error) {
      console.error('Failed to add hostel:', error);
      toast.error('Failed to add hostel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Hostel</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Student Paradise Hostel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hostel Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., SPH-001"
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Name *</label>
              <input
                type="text"
                required
                value={formData.managerName}
                onChange={(e) => setFormData({ ...formData, managerName: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="Manager's full name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Manager Phone *</label>
              <input
                type="tel"
                required
                value={formData.managerPhone}
                onChange={(e) => setFormData({ ...formData, managerPhone: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="+91 9876543210"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Address *</label>
            <textarea
              required
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              rows={3}
              className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              placeholder="Complete address"
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">City *</label>
              <input
                type="text"
                required
                value={formData.city}
                onChange={(e) => setFormData({ ...formData, city: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="City name"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">State *</label>
              <input
                type="text"
                required
                value={formData.state}
                onChange={(e) => setFormData({ ...formData, state: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="State name"
              />
            </div>
          </div>

          <div className="flex justify-end space-x-4">
            <button
              type="button"
              className="px-6 py-3 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
            >
              {isSubmitting ? 'Adding...' : 'Add Hostel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hostel Orders Component
const HostelOrdersPage: React.FC<{ hostels: Hostel[] }> = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Orders Management</h3>
        <p className="text-gray-600">Select a hostel from the grid to manage daily orders.</p>
      </div>
    </div>
  );
};

// Hostel Details Modal Component
const HostelDetailsModal: React.FC<{
  hostel: Hostel;
  onClose: () => void;
}> = ({ hostel, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Hostel Details & Daily Orders</h3>
            <button
              onClick={onClose}
              className="text-gray-400 hover:text-gray-600 transition-colors"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>

          <div className="space-y-6">
            <div className="bg-gray-50 rounded-lg p-4">
              <h4 className="font-medium text-gray-900 mb-2">{hostel.name}</h4>
              <p className="text-sm text-gray-600">Code: {hostel.code}</p>
              <p className="text-sm text-gray-600">Manager: {hostel.managerName}</p>
              <p className="text-sm text-gray-600">Phone: {hostel.managerPhone}</p>
              <p className="text-sm text-gray-600">{hostel.city}, {hostel.state}</p>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Add Daily Order</h4>
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Packet Size</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 10"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Quantity (Packets)</label>
                    <input
                      type="number"
                      className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      placeholder="e.g., 50"
                    />
                  </div>
                </div>
                <button className="w-full bg-green-600 text-white py-2 rounded-lg hover:bg-green-700 transition-colors">
                  Add Order
                </button>
              </div>
            </div>

            <div>
              <h4 className="font-medium text-gray-900 mb-4">Today's Orders</h4>
              <div className="text-center py-8 text-gray-500">
                <p>No orders for today</p>
                <p className="text-sm">Add an order above to get started</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Hostels;
