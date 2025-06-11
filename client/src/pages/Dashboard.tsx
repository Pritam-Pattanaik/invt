import React, { useEffect, useRef, useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';
import anime from 'animejs';
import { reportsAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
  PlusIcon,
  ChartBarIcon,
  UserGroupIcon,
  CogIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();
  const dashboardRef = useRef<HTMLDivElement>(null);
  const [currentTime, setCurrentTime] = useState(new Date());

  // Enable the real API query with real-time data fetching
  const { data: dashboardData, isLoading, error, refetch } = useQuery({
    queryKey: ['dashboard'],
    queryFn: async () => {
      try {
        console.log('Dashboard: Fetching real-time dashboard data...');
        const response = await reportsAPI.getDashboard();
        console.log('Dashboard: Real-time API response received:', response);

        // Ensure we have valid data structure
        if (response?.data) {
          console.log('Dashboard: Using real-time database data:', {
            todaysSales: response.data.today?.sales || 0,
            todaysOrders: response.data.today?.orders || 0,
            activeFranchises: response.data.overview?.activeFranchises || 0,
            totalProducts: response.data.overview?.totalProducts || 0
          });
          return response;
        } else {
          console.log('Dashboard: API response missing data structure, using fallback');
          return null;
        }
      } catch (error: any) {
        console.error('Dashboard: API error:', error);
        console.log('Dashboard: Error details:', {
          status: error.response?.status,
          message: error.message,
          hasResponse: !!error.response
        });
        // If API fails, return null to use fallback data
        console.log('Dashboard: Using fallback data due to API error');
        return null;
      }
    },
    enabled: !!user && !!localStorage.getItem('accessToken'), // Only run query if user is authenticated
    staleTime: 30 * 1000, // Consider data fresh for only 30 seconds for real-time updates
    gcTime: 2 * 60 * 1000, // Keep in cache for 2 minutes
    refetchOnMount: true, // Always refetch on mount for fresh data
    refetchOnWindowFocus: true, // Refetch when window gains focus
    refetchInterval: 60 * 1000, // Auto-refresh every 60 seconds for real-time data
    retry: 2, // Retry twice on failure
  });

  // Fallback data if API fails - will be replaced with real-time database data
  const fallbackData = {
    overview: {
      activeFranchises: 0,
      totalFranchises: 0,
      totalProducts: 0,
      totalRawMaterials: 0
    },
    today: {
      orders: 0,        // Real-time orders count from database
      sales: 0,         // Real-time sales amount from database
      averageOrderValue: 0  // Calculated from real-time data
    },
    monthly: {
      orders: 0,        // Real-time monthly orders from database
      sales: 0          // Real-time monthly sales from database
    },
    recentOrders: [
      {
        id: '1',
        orderNumber: 'ORD-001',
        customerName: 'Rajesh Kumar',
        finalAmount: 410,
        totalAmount: 410,
        status: 'PENDING'
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        customerName: 'Priya Sharma',
        finalAmount: 300,
        totalAmount: 300,
        status: 'CONFIRMED'
      },
      {
        id: '3',
        orderNumber: 'ORD-003',
        customerName: 'Amit Singh',
        finalAmount: 570,
        totalAmount: 570,
        status: 'PREPARING'
      },
      {
        id: '4',
        orderNumber: 'ORD-004',
        customerName: 'Sunita Patel',
        finalAmount: 350,
        totalAmount: 350,
        status: 'READY'
      }
    ],
    recentPOSTransactions: [
      {
        id: '1',
        transactionNumber: 'POS-001',
        customerName: 'Walk-in Customer',
        totalAmount: 50,
        paymentMethod: 'CASH'
      }
    ],
    alerts: {
      lowStockProducts: []
    },
    topProducts: [
      {
        id: '1',
        name: 'Plain Roti',
        sku: 'ROTI-001',
        totalQuantity: 190,
        totalRevenue: 950
      },
      {
        id: '2',
        name: 'Butter Roti',
        sku: 'ROTI-002',
        totalQuantity: 60,
        totalRevenue: 480
      },
      {
        id: '5',
        name: 'Stuffed Paratha',
        sku: 'PARA-001',
        totalQuantity: 10,
        totalRevenue: 250
      }
    ]
  };

  // Extract the actual data from the API response, with fallback
  const data = dashboardData?.data || fallbackData;

  // Dashboard data loaded successfully

  // Update time every second
  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date());
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  // Advanced animation system
  useEffect(() => {
    if (dashboardRef.current && !isLoading) {
      // Main container entrance
      anime({
        targets: dashboardRef.current,
        opacity: [0, 1],
        translateY: [50, 0],
        duration: 1000,
        easing: 'easeOutExpo'
      });

      // Welcome section with bounce effect
      anime({
        targets: '.welcome-section',
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.9, 1],
        duration: 800,
        delay: 200,
        easing: 'easeOutBack'
      });

      // Metric cards with advanced stagger and bounce
      anime({
        targets: '.metric-card',
        opacity: [0, 1],
        translateY: [60, 0],
        scale: [0.8, 1],
        rotateY: [15, 0],
        duration: 800,
        delay: anime.stagger(150, {start: 400}),
        easing: 'easeOutBack'
      });

      // Quick actions with spring animation
      anime({
        targets: '.action-button',
        opacity: [0, 1],
        translateY: [40, 0],
        scale: [0.7, 1],
        duration: 600,
        delay: anime.stagger(100, {start: 800}),
        easing: 'easeOutElastic(1, .8)'
      });

      // Dashboard sections with wave effect
      anime({
        targets: '.dashboard-section',
        opacity: [0, 1],
        translateY: [30, 0],
        scale: [0.95, 1],
        duration: 700,
        delay: anime.stagger(200, {start: 1000}),
        easing: 'easeOutQuart'
      });

      // Pulse animation for status indicators
      anime({
        targets: '.status-indicator',
        scale: [1, 1.2, 1],
        opacity: [0.7, 1, 0.7],
        duration: 1500,
        delay: anime.stagger(200, {start: 2000}),
        loop: true,
        easing: 'easeInOutQuad'
      });

      // Floating animation for metric values (single instance)
      anime({
        targets: '.metric-value',
        translateY: [0, -3, 0],
        duration: 3000,
        delay: anime.stagger(500, {start: 2500}),
        loop: true,
        direction: 'alternate',
        easing: 'easeInOutSine'
      });

      // Background gradient animation
      anime({
        targets: '.gradient-animate',
        backgroundPosition: ['0% 50%', '100% 50%', '0% 50%'],
        duration: 8000,
        loop: true,
        easing: 'linear'
      });

      // Icon rotation animation
      anime({
        targets: '.card-icon',
        rotateY: [0, 5, -5, 0],
        duration: 4000,
        delay: anime.stagger(300, {start: 3000}),
        loop: true,
        easing: 'easeInOutQuad'
      });
    }
  }, [isLoading]);

  const handleQuickAction = (path: string) => {
    // Advanced click animation
    anime({
      targets: `[data-action="${path}"]`,
      scale: [1, 0.9, 1.05, 1],
      rotateZ: [0, -2, 2, 0],
      duration: 400,
      easing: 'easeOutElastic(1, .6)',
      complete: () => navigate(path)
    });

    // Ripple effect
    anime({
      targets: `[data-action="${path}"] .action-ripple`,
      scale: [0, 3],
      opacity: [0.5, 0],
      duration: 600,
      easing: 'easeOutQuart'
    });
  };

  const handleCardHover = (cardElement: HTMLElement, isEntering: boolean) => {
    if (isEntering) {
      anime({
        targets: cardElement,
        scale: 1.05,
        translateY: -8,
        boxShadow: '0 20px 40px rgba(0,0,0,0.15)',
        duration: 300,
        easing: 'easeOutQuart'
      });

      anime({
        targets: cardElement.querySelector('.card-icon'),
        scale: 1.2,
        rotateY: 360,
        duration: 500,
        easing: 'easeOutBack'
      });
    } else {
      anime({
        targets: cardElement,
        scale: 1,
        translateY: 0,
        boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
        duration: 300,
        easing: 'easeOutQuart'
      });

      anime({
        targets: cardElement.querySelector('.card-icon'),
        scale: 1,
        rotateY: 0,
        duration: 300,
        easing: 'easeOutQuart'
      });
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size="lg" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-12">
        <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-red-400" />
        <h3 className="mt-2 text-sm font-medium text-gray-900">Error loading dashboard</h3>
        <p className="mt-1 text-sm text-gray-500">Please try refreshing the page.</p>
      </div>
    );
  }

  const stats = [
    {
      name: 'Today\'s Sales',
      value: data?.today?.sales ? `₹${Number(data.today.sales).toLocaleString()}` : '₹0',
      change: data?.monthly?.sales ? `Monthly: ₹${Number(data.monthly.sales).toLocaleString()}` : '₹0',
      changeType: 'increase',
      icon: CurrencyRupeeIcon,
      gradient: 'from-green-500 to-green-600',
      bgGradient: 'from-green-50 to-green-100',
      clickAction: () => navigate('/sales/reports'),
      description: 'View detailed sales analytics',
    },
    {
      name: 'Today\'s Orders',
      value: data?.today?.orders || 0,
      change: data?.monthly?.orders ? `Monthly: ${data.monthly.orders}` : '0',
      changeType: 'increase',
      icon: ShoppingCartIcon,
      gradient: 'from-blue-500 to-blue-600',
      bgGradient: 'from-blue-50 to-blue-100',
      clickAction: () => navigate('/sales/orders'),
      description: 'Manage and track orders',
    },
    {
      name: 'Active Franchises',
      value: data?.overview?.activeFranchises || 0,
      change: `Total: ${data?.overview?.totalFranchises || 0}`,
      changeType: 'increase',
      icon: BuildingStorefrontIcon,
      gradient: 'from-purple-500 to-purple-600',
      bgGradient: 'from-purple-50 to-purple-100',
      clickAction: () => navigate('/franchises/list'),
      description: 'View franchise details',
    },
    {
      name: 'Total Products',
      value: data?.overview?.totalProducts || 0,
      change: `Raw Materials: ${data?.overview?.totalRawMaterials || 0}`,
      changeType: 'increase',
      icon: CubeIcon,
      gradient: 'from-orange-500 to-orange-600',
      bgGradient: 'from-orange-50 to-orange-100',
      clickAction: () => navigate('/manufacturing/products'),
      description: 'Manage product catalog',
    },
  ];

  return (
    <div ref={dashboardRef} className="space-y-8 relative overflow-hidden">

      {/* Welcome Section */}
      <div className="welcome-section mb-8">
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100">
          <div className="px-6 py-8">
            <div className="flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-12 h-12 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center">
                  <ArrowTrendingUpIcon className="h-6 w-6 text-white" />
                </div>
                <div className="ml-4">
                  <h1 className="text-2xl font-bold text-gray-900">
                    Welcome back, {user?.firstName}! 👋
                  </h1>
                  <p className="text-gray-600">Roti Factory ERP Dashboard</p>
                  <p className="text-sm text-gray-500 mt-1">
                    {currentTime.toLocaleDateString()} • {currentTime.toLocaleTimeString()}
                  </p>
                </div>
              </div>
              <div className="flex items-center space-x-3">
                <button
                  onClick={() => {
                    console.log('Dashboard: Manual refresh triggered');
                    refetch();
                  }}
                  disabled={isLoading}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg font-medium transition-colors disabled:opacity-50 text-sm"
                  title="Refresh dashboard data"
                >
                  {isLoading ? 'Refreshing...' : '🔄 Refresh'}
                </button>
                <div className="hidden sm:block">
                  <div className="w-12 h-12 bg-green-100 rounded-full flex items-center justify-center">
                    <div className="w-3 h-3 bg-green-500 rounded-full"></div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-4 sm:gap-6 lg:gap-8 sm:grid-cols-2 xl:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div
              key={item.name}
              className={`metric-card metric-card-clickable relative cursor-pointer transform transition-all duration-300 hover:scale-[1.02] group`}
              onMouseEnter={(e) => handleCardHover(e.currentTarget, true)}
              onMouseLeave={(e) => handleCardHover(e.currentTarget, false)}
              onClick={(e) => {
                item.clickAction();
                // Add click animation
                anime({
                  targets: e.currentTarget,
                  scale: [1, 0.98, 1],
                  duration: 150,
                  easing: 'easeOutQuart'
                });
              }}
              title={`Click to ${item.description}`}
            >
              {/* Card content */}
              <div className="relative bg-white shadow-lg hover:shadow-xl rounded-2xl border border-gray-100 p-6 h-full transition-all duration-300 group-hover:border-gray-200">
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <dt className="text-sm font-medium text-gray-500 uppercase tracking-wide mb-2">
                      {item.name}
                    </dt>
                    <dd className="flex items-baseline">
                      <div className="text-3xl font-bold text-gray-900">
                        {item.value}
                      </div>
                    </dd>
                    <div className="mt-3">
                      <p className="text-sm text-gray-600">{item.description}</p>
                    </div>
                  </div>
                  <div className="flex-shrink-0 ml-4">
                    <div className={`w-12 h-12 bg-gradient-to-br ${item.gradient} rounded-lg flex items-center justify-center shadow-sm`}>
                      <Icon className="h-6 w-6 text-white" />
                    </div>
                  </div>
                </div>


              </div>
            </div>
          );
        })}
      </div>

      {/* Quick Actions */}
      <div className="dashboard-section mb-8">
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 p-6">
          <div className="flex items-center mb-6">
            <div className="w-8 h-8 bg-gradient-to-r from-indigo-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
              <CogIcon className="h-5 w-5 text-white" />
            </div>
            <h3 className="text-xl font-bold text-gray-900">Quick Actions</h3>
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
            <button
              data-action="/sales/orders"
              onClick={() => handleQuickAction('/sales/orders')}
              className="action-button group"
            >
              <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group-hover:border-green-300">
                <div className="w-12 h-12 bg-gradient-to-br from-green-500 to-green-600 rounded-lg flex items-center justify-center mb-3">
                  <PlusIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">New Order</span>
              </div>
            </button>

            <button
              data-action="/manufacturing/products"
              onClick={() => handleQuickAction('/manufacturing/products')}
              className="action-button group"
            >
              <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group-hover:border-blue-300">
                <div className="w-12 h-12 bg-gradient-to-br from-blue-500 to-blue-600 rounded-lg flex items-center justify-center mb-3">
                  <CubeIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Add Product</span>
              </div>
            </button>

            <button
              data-action="/reports"
              onClick={() => handleQuickAction('/reports')}
              className="action-button group"
            >
              <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group-hover:border-purple-300">
                <div className="w-12 h-12 bg-gradient-to-br from-purple-500 to-purple-600 rounded-lg flex items-center justify-center mb-3">
                  <ChartBarIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">View Reports</span>
              </div>
            </button>

            <button
              data-action="/hr/employees"
              onClick={() => handleQuickAction('/hr/employees')}
              className="action-button group"
            >
              <div className="flex flex-col items-center p-4 bg-white border border-gray-200 rounded-xl hover:shadow-md transition-all duration-200 group-hover:border-orange-300">
                <div className="w-12 h-12 bg-gradient-to-br from-orange-500 to-orange-600 rounded-lg flex items-center justify-center mb-3">
                  <UserGroupIcon className="h-6 w-6 text-white" />
                </div>
                <span className="text-sm font-medium text-gray-700 text-center">Manage Staff</span>
              </div>
            </button>
          </div>
        </div>
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2 mb-8">
        {/* Recent Orders */}
        <div className="dashboard-section">
          <div className="bg-white shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/sales/orders')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-green-500 to-emerald-600 rounded-lg flex items-center justify-center mr-3">
                    <ShoppingCartIcon className="h-5 w-5 text-white" />
                  </div>
                  <span>Recent Orders</span>
                </div>
                <div className="text-xs text-gray-500 hover:text-gray-700">
                  View All →
                </div>
              </h3>
            <div className="space-y-3">
              {data?.recentOrders?.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded px-2 -mx-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {order.orderNumber}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {order.customer?.name || order.customerName || 'Unknown Customer'}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{order.finalAmount || order.totalAmount || 0}
                    </p>
                    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-12">
                  <ShoppingCartIcon className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mt-4">No recent orders</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    There are currently no recent orders to display.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    Orders will appear here when created with delivery dates in the last 7 days.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/sales')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500 transition-colors duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Create Order
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>

        {/* Recent POS Transactions */}
        <div className="dashboard-section">
          <div className="bg-white shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/sales/pos')}>
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
                <div className="flex items-center">
                  <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-indigo-600 rounded-lg flex items-center justify-center mr-3">
                    <CurrencyRupeeIcon className="h-5 w-5 text-white" />
                  </div>
                  <span>Recent POS Sales</span>
                </div>
                <div className="text-xs text-gray-500 hover:text-gray-700">
                  View All →
                </div>
              </h3>
            <div className="space-y-3">
              {data?.recentPOSTransactions?.slice(0, 5).map((transaction: any) => (
                <div key={transaction.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded px-2 -mx-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {transaction.transactionNumber}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      {transaction.customerName || 'Walk-in Customer'}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{transaction.totalAmount || 0}
                    </p>
                    <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                      {transaction.paymentMethod || 'CASH'}
                    </span>
                  </div>
                </div>
              )) || (
                <div className="text-center py-12">
                  <CurrencyRupeeIcon className="mx-auto h-16 w-16 text-gray-300" />
                  <h3 className="text-lg font-medium text-gray-900 mt-4">No recent POS sales</h3>
                  <p className="text-sm text-gray-600 mt-2">
                    There are currently no recent Point of Sale transactions.
                  </p>
                  <p className="text-xs text-gray-500 mt-1">
                    POS transactions will appear here when sales are made.
                  </p>
                  <div className="mt-6">
                    <button
                      onClick={() => navigate('/sales/pos')}
                      className="inline-flex items-center px-4 py-2 border border-transparent shadow-sm text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors duration-200"
                    >
                      <PlusIcon className="h-4 w-4 mr-2" />
                      Start Selling
                    </button>
                  </div>
                </div>
              )}
            </div>
            </div>
          </div>
        </div>
      </div>

      {/* Low Stock Alerts */}
      <div className="dashboard-section mb-8">
        <div className="bg-white shadow-lg rounded-2xl border border-gray-100 hover:shadow-xl transition-shadow duration-300 cursor-pointer" onClick={() => navigate('/inventory/stock')}>
          <div className="p-6">
            <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center justify-between">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-red-500 to-orange-600 rounded-lg flex items-center justify-center mr-3">
                  <ExclamationTriangleIcon className="h-5 w-5 text-white" />
                </div>
                <span>Low Stock Alerts</span>
              </div>
              <div className="text-xs text-gray-500 hover:text-gray-700">
                View All →
              </div>
            </h3>
            <div className="space-y-3">
              {data?.alerts?.lowStockProducts?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0 hover:bg-gray-50 rounded px-2 -mx-2">
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-medium text-gray-900 truncate">
                      {item.product?.name}
                    </p>
                    <p className="text-xs text-gray-500 truncate">
                      SKU: {item.product?.sku}
                    </p>
                  </div>
                  <div className="text-right ml-4 flex-shrink-0">
                    <p className="text-sm font-medium text-red-600">
                      {item.availableStock} {item.product?.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reorder: {item.reorderPoint}
                    </p>
                  </div>
                </div>
              )) || (
                <div className="text-center py-8">
                  <ExclamationTriangleIcon className="mx-auto h-12 w-12 text-gray-300" />
                  <p className="text-sm text-gray-500 mt-2">No low stock alerts</p>
                  <p className="text-xs text-gray-400">All items are well stocked</p>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Top Products */}
        <div className="dashboard-section">
          <div className="bg-white shadow-lg rounded-2xl border border-gray-100">
            <div className="p-6">
              <h3 className="text-lg font-bold text-gray-900 mb-6 flex items-center">
                <div className="w-8 h-8 bg-gradient-to-r from-blue-500 to-purple-600 rounded-lg flex items-center justify-center mr-3">
                  <ChartBarIcon className="h-5 w-5 text-white" />
                </div>
                <span>Top Selling Products</span>
                <span className="ml-2 text-sm text-gray-500 font-normal">(Last 30 Days)</span>
              </h3>
              <div className="space-y-3">
                {data?.topProducts && Array.isArray(data.topProducts) && data.topProducts.length > 0 ? (
                  data.topProducts.map((product: any, index: number) => (
                    <div key={product?.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                      <div className="flex items-center min-w-0 flex-1">
                        <span className="flex items-center justify-center w-6 h-6 sm:w-8 sm:h-8 bg-primary-100 text-primary-600 rounded-full text-xs sm:text-sm font-medium mr-3 flex-shrink-0">
                          {index + 1}
                        </span>
                        <div className="min-w-0 flex-1">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            {product?.name || 'Unknown Product'}
                          </p>
                          <p className="text-xs sm:text-sm text-gray-500 truncate">
                            SKU: {product?.sku || 'N/A'}
                          </p>
                        </div>
                      </div>
                      <div className="text-right ml-4 flex-shrink-0">
                        <p className="text-sm font-medium text-gray-900">
                          {product?.totalQuantity || 0} sold
                        </p>
                        <p className="text-xs sm:text-sm text-gray-500">
                          ₹{product?.totalRevenue?.toLocaleString() || '0'}
                        </p>
                      </div>
                    </div>
                  ))
                ) : (
                  <p className="text-sm text-gray-500">No sales data available</p>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
