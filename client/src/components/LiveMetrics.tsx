import React, { useEffect, useState } from 'react';
import anime from 'animejs';

const LiveMetrics: React.FC = () => {
  const [metrics, setMetrics] = useState({
    activeOrders: 23,
    onlineCustomers: 156,
    productionRate: 94,
    revenue: 45670
  });

  useEffect(() => {
    // Simulate live data updates - much less frequent to avoid blinking
    const interval = setInterval(() => {
      setMetrics(prev => ({
        activeOrders: Math.max(0, prev.activeOrders + Math.floor(Math.random() * 3) - 1),
        onlineCustomers: Math.max(0, prev.onlineCustomers + Math.floor(Math.random() * 6) - 3),
        productionRate: Math.max(85, Math.min(100, prev.productionRate + Math.floor(Math.random() * 4) - 2)),
        revenue: prev.revenue + Math.floor(Math.random() * 200)
      }));
    }, 30000); // Update every 30 seconds instead of 3 seconds

    return () => clearInterval(interval);
  }, []);

  useEffect(() => {
    // Animate metrics when they change - but only if values actually changed significantly
    const animationTimeout = setTimeout(() => {
      anime({
        targets: '.metric-value',
        scale: [1, 1.05, 1],
        duration: 400,
        easing: 'easeOutQuart'
      });
    }, 100);

    return () => clearTimeout(animationTimeout);
  }, [metrics]);

  return (
    <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-8">
      <div className="bg-gradient-to-r from-blue-500 to-blue-600 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-blue-100 text-sm">Active Orders</p>
            <p className="metric-value text-2xl font-bold">{metrics.activeOrders}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-pulse"></div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-purple-500 to-purple-600 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-purple-100 text-sm">Online Customers</p>
            <p className="metric-value text-2xl font-bold">{metrics.onlineCustomers}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-bounce"></div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-green-500 to-green-600 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-green-100 text-sm">Production Rate</p>
            <p className="metric-value text-2xl font-bold">{metrics.productionRate}%</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <div className="w-3 h-3 bg-white rounded-full animate-ping"></div>
          </div>
        </div>
      </div>

      <div className="bg-gradient-to-r from-orange-500 to-orange-600 rounded-2xl p-4 text-white shadow-xl">
        <div className="flex items-center justify-between">
          <div>
            <p className="text-orange-100 text-sm">Today's Revenue</p>
            <p className="metric-value text-2xl font-bold">₹{metrics.revenue.toLocaleString()}</p>
          </div>
          <div className="w-12 h-12 bg-white/20 rounded-full flex items-center justify-center">
            <svg className="w-6 h-6 text-white animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  );
};

export default LiveMetrics;
