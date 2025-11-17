import React, { useState, useEffect } from 'react';
import { Routes, Route, useNavigate, useLocation } from 'react-router-dom';
import anime from 'animejs';
import { formatDate } from '../utils/dateUtils';
import { useAuth } from '../contexts/AuthContext';
import { toast } from 'react-hot-toast';
import { hotelsAPI } from '../services/api';

interface Hotel {
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

interface HotelOrder {
  id: string;
  hotelId: string;
  orderDate: string;
  totalQuantity: number;
  totalPackets: number;
  status: string;
  items: HotelOrderItem[];
}

interface HotelOrderItem {
  id: string;
  packetSize: number;
  quantity: number;
  totalRotis: number;
}

const Hotels: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { user } = useAuth();
  const [currentView, setCurrentView] = useState<'list' | 'add' | 'orders'>('list');
  const [hotels, setHotels] = useState<Hotel[]>([]);
  const [selectedHotel, setSelectedHotel] = useState<Hotel | null>(null);
  const [showOrderModal, setShowOrderModal] = useState(false);
  const [loading, setLoading] = useState(false);

  // Determine current view from URL
  useEffect(() => {
    const path = location.pathname.split('/').pop();
    if (path === 'add') setCurrentView('add');
    else if (path === 'orders') setCurrentView('orders');
    else setCurrentView('list');
  }, [location]);

  // Load hotels data
  useEffect(() => {
    loadHotels();
  }, []);

  const loadHotels = async () => {
    setLoading(true);
    try {
      const response = await hotelsAPI.getHotels();
      setHotels(response.data.hotels || []);
    } catch (error) {
      console.error('Failed to load hotels:', error);
      // Fallback to mock data if API fails
      const mockHotels: Hotel[] = [
        {
          id: '1',
          name: 'Grand Palace Hotel',
          code: 'GPH-001',
          managerName: 'Rajesh Kumar',
          managerPhone: '+91 9876543210',
          address: '123 Main Street',
          city: 'Mumbai',
          state: 'Maharashtra',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        },
        {
          id: '2',
          name: 'Royal Inn Hotel',
          code: 'RIH-002',
          managerName: 'Priya Sharma',
          managerPhone: '+91 9876543211',
          address: '456 Park Avenue',
          city: 'Delhi',
          state: 'Delhi',
          status: 'ACTIVE',
          createdAt: new Date().toISOString()
        }
      ];
      setHotels(mockHotels);
      toast.error('Failed to load hotels from server, showing sample data');
    } finally {
      setLoading(false);
    }
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.hotel-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView, hotels]);

  const openHotelDetails = (hotel: Hotel) => {
    setSelectedHotel(hotel);
    setShowOrderModal(true);
  };

  const tabs = [
    { id: 'list', name: 'All Hotels', icon: '🏨', path: '/hotels/list' },
    { id: 'add', name: 'Add Hotel', icon: '➕', path: '/hotels/add' },
    { id: 'orders', name: 'Daily Orders', icon: '📋', path: '/hotels/orders' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Hotel Management</h2>
          <p className="text-gray-600">Manage hotels and track daily orders</p>
        </div>
        <button 
          onClick={() => navigate('/hotels/add')}
          className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors"
        >
          Add New Hotel
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
        <Route path="/" element={<HotelListPage hotels={hotels} loading={loading} onHotelClick={openHotelDetails} />} />
        <Route path="/list" element={<HotelListPage hotels={hotels} loading={loading} onHotelClick={openHotelDetails} />} />
        <Route path="/add" element={<AddHotelPage onHotelAdded={loadHotels} />} />
        <Route path="/orders" element={<HotelOrdersPage hotels={hotels} />} />
      </Routes>

      {/* Hotel Details Modal */}
      {showOrderModal && selectedHotel && (
        <HotelDetailsModal
          hotel={selectedHotel}
          onClose={() => {
            setShowOrderModal(false);
            setSelectedHotel(null);
          }}
        />
      )}
    </div>
  );
};

// Hotel List Component
const HotelListPage: React.FC<{
  hotels: Hotel[];
  loading: boolean;
  onHotelClick: (hotel: Hotel) => void;
}> = ({ hotels, loading, onHotelClick }) => {
  return (
    <div className="space-y-6">
      {loading ? (
        <div className="flex items-center justify-center py-12">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
          <span className="ml-2 text-gray-600">Loading hotels...</span>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {hotels.map((hotel) => (
            <div
              key={hotel.id}
              className="hotel-card bg-white rounded-xl shadow-lg border border-gray-200 p-6 hover:shadow-xl transition-all duration-300 cursor-pointer"
              onClick={() => onHotelClick(hotel)}
            >
              <div className="flex items-center justify-between mb-4">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                  <span className="text-white font-bold text-lg">🏨</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                  hotel.status === 'ACTIVE' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                }`}>
                  {hotel.status}
                </span>
              </div>

              <h3 className="text-lg font-semibold text-gray-900 mb-2">{hotel.name}</h3>
              <p className="text-sm text-gray-600 mb-1">Code: {hotel.code}</p>
              <p className="text-sm text-gray-600 mb-1">Manager: {hotel.managerName}</p>
              <p className="text-sm text-gray-600 mb-1">Phone: {hotel.managerPhone}</p>
              <p className="text-sm text-gray-600 mb-3">{hotel.city}, {hotel.state}</p>

              <div className="flex items-center justify-between text-xs text-gray-500">
                <span>Added: {formatDate(hotel.createdAt)}</span>
                <span className="text-blue-600 hover:text-blue-800">Click for orders →</span>
              </div>
            </div>
          ))}
        </div>
      )}

      {!loading && hotels.length === 0 && (
        <div className="text-center py-12">
          <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <span className="text-2xl">🏨</span>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">No hotels found</h3>
          <p className="text-gray-600">Add your first hotel to get started.</p>
        </div>
      )}
    </div>
  );
};

// Add Hotel Component
const AddHotelPage: React.FC<{ onHotelAdded: () => void }> = ({ onHotelAdded }) => {
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
      await hotelsAPI.createHotel({
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

      toast.success('Hotel added successfully!');
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
      onHotelAdded();
    } catch (error) {
      console.error('Failed to add hotel:', error);
      toast.error('Failed to add hotel');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="max-w-2xl mx-auto">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-8">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Add New Hotel</h3>
        
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Name *</label>
              <input
                type="text"
                required
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., Grand Palace Hotel"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Hotel Code *</label>
              <input
                type="text"
                required
                value={formData.code}
                onChange={(e) => setFormData({ ...formData, code: e.target.value })}
                className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                placeholder="e.g., GPH-001"
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
              {isSubmitting ? 'Adding...' : 'Add Hotel'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// Hotel Orders Component
const HotelOrdersPage: React.FC<{ hotels: Hotel[] }> = ({ hotels }) => {
  return (
    <div className="space-y-6">
      <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Daily Orders Management</h3>
        <p className="text-gray-600">Select a hotel from the grid to manage daily orders.</p>
      </div>
    </div>
  );
};

// Hotel Details Modal Component
const HotelDetailsModal: React.FC<{
  hotel: Hotel;
  onClose: () => void;
}> = ({ hotel, onClose }) => {
  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="p-6">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-xl font-semibold text-gray-900">Hotel Details & Daily Orders</h3>
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
              <h4 className="font-medium text-gray-900 mb-2">{hotel.name}</h4>
              <p className="text-sm text-gray-600">Code: {hotel.code}</p>
              <p className="text-sm text-gray-600">Manager: {hotel.managerName}</p>
              <p className="text-sm text-gray-600">Phone: {hotel.managerPhone}</p>
              <p className="text-sm text-gray-600">{hotel.city}, {hotel.state}</p>
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

export default Hotels;
