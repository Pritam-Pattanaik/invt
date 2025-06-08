import React, { useEffect, useState } from 'react';
import anime from 'animejs';
import { reportsAPI } from '../services/api';

interface SalesModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface SalesData {
  summary: {
    totalSales: string;
    totalOrders: number;
    averageOrderValue: string;
    totalDiscount: string;
    totalTax: string;
  };
  chartData: Array<{
    date: string;
    totalSales: number;
    totalOrders: number;
    averageOrderValue: number;
  }>;
  orders: Array<{
    id: string;
    orderNumber: string;
    finalAmount: string;
    createdAt: string;
    status: string;
    counter: {
      name: string;
      franchise: any;
    };
    items: string;
  }>;
}

const SalesModal: React.FC<SalesModalProps> = ({ isOpen, onClose }) => {
  const [salesData, setSalesData] = useState<SalesData | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchSalesData = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await reportsAPI.getSalesReport();
      setSalesData(response.data || null);
    } catch (err) {
      console.error('Failed to fetch sales data:', err);
      setError('Failed to load sales data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchSalesData();

      // Animate modal entrance
      anime({
        targets: '.sales-modal',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (salesData && salesData.orders.length > 0) {
      // Animate sales items
      anime({
        targets: '.sales-item',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });
    }
  }, [salesData]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="sales-modal bg-white rounded-2xl shadow-2xl max-w-4xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-green-500 to-green-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Sales Report</h2>
              <p className="text-green-100">Sales analytics and transactions</p>
            </div>
            <div className="text-right">
              <p className="text-3xl font-bold">₹{salesData ? parseFloat(salesData.summary.totalSales).toLocaleString() : '0'}</p>
              <p className="text-green-100">Total Sales</p>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-green-600"></div>
              <span className="ml-2 text-gray-600">Loading sales data...</span>
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
                    onClick={fetchSalesData}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && salesData && (
            <>
              <div className="grid grid-cols-1 lg:grid-cols-4 gap-6 mb-6">
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-900">Average Order Value</h3>
                  <p className="text-2xl font-bold text-blue-700">₹{parseFloat(salesData.summary.averageOrderValue).toFixed(2)}</p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-900">Total Orders</h3>
                  <p className="text-2xl font-bold text-purple-700">{salesData.summary.totalOrders}</p>
                </div>
                <div className="bg-orange-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-orange-900">Total Discount</h3>
                  <p className="text-2xl font-bold text-orange-700">₹{parseFloat(salesData.summary.totalDiscount).toFixed(2)}</p>
                </div>
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-900">Total Tax</h3>
                  <p className="text-2xl font-bold text-green-700">₹{parseFloat(salesData.summary.totalTax).toFixed(2)}</p>
                </div>
              </div>

              <h3 className="text-lg font-semibold mb-4">Recent Transactions</h3>
              <div className="space-y-4">
                {salesData.orders.map((sale, index) => (
                  <div key={sale.id} className="sales-item bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-green-400 to-green-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{sale.counter.name}</h4>
                          <p className="text-sm text-gray-500">{sale.orderNumber} • {new Date(sale.createdAt).toLocaleString()}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                            sale.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            sale.status === 'READY' ? 'bg-blue-100 text-blue-800' :
                            sale.status === 'IN_PREPARATION' ? 'bg-purple-100 text-purple-800' :
                            'bg-yellow-100 text-yellow-800'
                          }`}>
                            {sale.status.replace('_', ' ')}
                          </span>
                        </div>
                      </div>
                      <div className="text-right">
                        <p className="text-xl font-bold text-green-600">₹{parseFloat(sale.finalAmount).toFixed(2)}</p>
                        <p className="text-sm text-gray-500">{sale.id.slice(-8)}</p>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && (!salesData || salesData.orders.length === 0) && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No sales data found</h3>
              <p className="text-gray-500">Sales transactions will appear here when orders are completed.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default SalesModal;
