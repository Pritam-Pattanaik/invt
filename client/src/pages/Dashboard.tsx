import React from 'react';
import { useQuery } from '@tanstack/react-query';
import { reportsAPI } from '../services/api';
import LoadingSpinner from '../components/LoadingSpinner';
import {
  CurrencyRupeeIcon,
  ShoppingCartIcon,
  BuildingStorefrontIcon,
  CubeIcon,
  ExclamationTriangleIcon,
  ArrowTrendingUpIcon,
} from '@heroicons/react/24/outline';

const Dashboard: React.FC = () => {
  const { data: dashboardData, isLoading, error } = useQuery({
    queryKey: ['dashboard'],
    queryFn: () => reportsAPI.getDashboard(),
  });

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

  const data = dashboardData?.data?.data;

  const stats = [
    {
      name: 'Today\'s Sales',
      value: `₹${data?.today?.sales?.toLocaleString() || 0}`,
      change: '+12%',
      changeType: 'increase',
      icon: CurrencyRupeeIcon,
    },
    {
      name: 'Today\'s Orders',
      value: data?.today?.orders || 0,
      change: '+8%',
      changeType: 'increase',
      icon: ShoppingCartIcon,
    },
    {
      name: 'Active Franchises',
      value: data?.overview?.activeFranchises || 0,
      change: '+2',
      changeType: 'increase',
      icon: BuildingStorefrontIcon,
    },
    {
      name: 'Total Products',
      value: data?.overview?.totalProducts || 0,
      change: '+5',
      changeType: 'increase',
      icon: CubeIcon,
    },
  ];

  return (
    <div className="space-y-6">
      {/* Welcome Section */}
      <div className="bg-white overflow-hidden shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <ArrowTrendingUpIcon className="h-8 w-8 text-primary-600" />
            </div>
            <div className="ml-5 w-0 flex-1">
              <dl>
                <dt className="text-sm font-medium text-gray-500 truncate">
                  Welcome to Roti Factory ERP
                </dt>
                <dd className="text-lg font-medium text-gray-900">
                  Your business overview at a glance
                </dd>
              </dl>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 gap-5 sm:grid-cols-2 lg:grid-cols-4">
        {stats.map((item) => {
          const Icon = item.icon;
          return (
            <div key={item.name} className="bg-white overflow-hidden shadow rounded-lg">
              <div className="p-5">
                <div className="flex items-center">
                  <div className="flex-shrink-0">
                    <Icon className="h-6 w-6 text-gray-400" />
                  </div>
                  <div className="ml-5 w-0 flex-1">
                    <dl>
                      <dt className="text-sm font-medium text-gray-500 truncate">
                        {item.name}
                      </dt>
                      <dd className="flex items-baseline">
                        <div className="text-2xl font-semibold text-gray-900">
                          {item.value}
                        </div>
                        <div
                          className={`ml-2 flex items-baseline text-sm font-semibold ${
                            item.changeType === 'increase'
                              ? 'text-green-600'
                              : 'text-red-600'
                          }`}
                        >
                          {item.change}
                        </div>
                      </dd>
                    </dl>
                  </div>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Recent Activity and Alerts */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {/* Recent Orders */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Recent Orders
            </h3>
            <div className="space-y-3">
              {data?.recentOrders?.slice(0, 5).map((order: any) => (
                <div key={order.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {order.orderNumber}
                    </p>
                    <p className="text-sm text-gray-500">
                      {order.counter?.franchise?.name} - {order.counter?.name}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-gray-900">
                      ₹{order.finalAmount}
                    </p>
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                      order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                      'bg-blue-100 text-blue-800'
                    }`}>
                      {order.status}
                    </span>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No recent orders</p>
              )}
            </div>
          </div>
        </div>

        {/* Low Stock Alerts */}
        <div className="bg-white shadow rounded-lg">
          <div className="px-4 py-5 sm:p-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
              Low Stock Alerts
            </h3>
            <div className="space-y-3">
              {data?.alerts?.lowStockProducts?.slice(0, 5).map((item: any) => (
                <div key={item.id} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {item.product?.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      SKU: {item.product?.sku}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-sm font-medium text-red-600">
                      {item.availableStock} {item.product?.unit}
                    </p>
                    <p className="text-xs text-gray-500">
                      Reorder: {item.reorderPoint}
                    </p>
                  </div>
                </div>
              )) || (
                <p className="text-sm text-gray-500">No low stock items</p>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* Top Products */}
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            Top Selling Products (Last 30 Days)
          </h3>
          <div className="space-y-3">
            {data?.topProducts?.map((product: any, index: number) => (
              <div key={product.id || index} className="flex items-center justify-between py-2 border-b border-gray-100 last:border-b-0">
                <div className="flex items-center">
                  <span className="flex items-center justify-center w-8 h-8 bg-primary-100 text-primary-600 rounded-full text-sm font-medium mr-3">
                    {index + 1}
                  </span>
                  <div>
                    <p className="text-sm font-medium text-gray-900">
                      {product.name}
                    </p>
                    <p className="text-sm text-gray-500">
                      SKU: {product.sku}
                    </p>
                  </div>
                </div>
                <div className="text-right">
                  <p className="text-sm font-medium text-gray-900">
                    {product.totalQuantity} sold
                  </p>
                  <p className="text-sm text-gray-500">
                    ₹{product.totalRevenue?.toLocaleString()}
                  </p>
                </div>
              </div>
            )) || (
              <p className="text-sm text-gray-500">No sales data available</p>
            )}
          </div>
        </div>
      </div>
    </div>
  );
};

export default Dashboard;
