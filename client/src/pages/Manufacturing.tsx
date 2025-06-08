import React, { useState, useEffect } from 'react';
import anime from 'animejs';

const Manufacturing: React.FC = () => {
  const [currentView, setCurrentView] = useState<'products' | 'raw-materials' | 'inventory' | 'production' | 'quality'>('products');

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');

      if (hash === 'manufacturing/products') {
        setCurrentView('products');
      } else if (hash === 'manufacturing/raw-materials') {
        setCurrentView('raw-materials');
      } else if (hash === 'manufacturing/inventory') {
        setCurrentView('inventory');
      } else if (hash === 'manufacturing/production') {
        setCurrentView('production');
      } else if (hash === 'manufacturing/quality') {
        setCurrentView('quality');
      } else if (hash === 'manufacturing') {
        setCurrentView('products');
        window.location.hash = 'manufacturing/products';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.manufacturing-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const tabs = [
    { id: 'products', name: 'Products', icon: '📦' },
    { id: 'raw-materials', name: 'Raw Materials', icon: '🌾' },
    { id: 'inventory', name: 'Inventory', icon: '📋' },
    { id: 'production', name: 'Production', icon: '⚙️' },
    { id: 'quality', name: 'Quality Control', icon: '✅' },
  ];

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">Manufacturing</h2>
          <p className="text-gray-600">Manage production, inventory, and quality control</p>
        </div>
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
                  window.location.hash = `manufacturing/${tab.id}`;
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
      <div className="manufacturing-content">
        {currentView === 'products' && <ProductsPage />}
        {currentView === 'raw-materials' && <RawMaterialsPage />}
        {currentView === 'inventory' && <InventoryPage />}
        {currentView === 'production' && <ProductionPage />}
        {currentView === 'quality' && <QualityPage />}
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const products = [
    { id: 1, name: 'Plain Roti', price: 8, stock: 500, category: 'Basic' },
    { id: 2, name: 'Butter Roti', price: 12, stock: 300, category: 'Premium' },
    { id: 3, name: 'Masala Roti', price: 15, stock: 200, category: 'Specialty' },
    { id: 4, name: 'Wheat Roti', price: 10, stock: 400, category: 'Healthy' },
    { id: 5, name: 'Stuffed Paratha', price: 25, stock: 150, category: 'Premium' },
  ];

  return (
    <div className="space-y-6">
      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Product Catalog</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Add New Product
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {products.map((product) => (
            <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-center justify-between mb-2">
                <h4 className="font-semibold text-gray-900">{product.name}</h4>
                <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{product.category}</span>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-gray-600">Price:</span>
                  <span className="font-medium">₹{product.price}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-600">Stock:</span>
                  <span className={`font-medium ${product.stock < 200 ? 'text-red-600' : 'text-green-600'}`}>
                    {product.stock} units
                  </span>
                </div>
              </div>
              <div className="mt-4 flex space-x-2">
                <button className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 px-3 py-1 rounded text-sm transition-colors">
                  Edit
                </button>
                <button className="flex-1 bg-green-100 hover:bg-green-200 text-green-700 px-3 py-1 rounded text-sm transition-colors">
                  Restock
                </button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const RawMaterialsPage: React.FC = () => {
  const rawMaterials = [
    { id: 1, name: 'Wheat Flour', stock: 500, unit: 'kg', reorderLevel: 100, supplier: 'ABC Suppliers' },
    { id: 2, name: 'Cooking Oil', stock: 80, unit: 'liters', reorderLevel: 50, supplier: 'XYZ Oil Mills' },
    { id: 3, name: 'Salt', stock: 25, unit: 'kg', reorderLevel: 10, supplier: 'Local Vendor' },
    { id: 4, name: 'Spices Mix', stock: 15, unit: 'kg', reorderLevel: 20, supplier: 'Spice House' },
    { id: 5, name: 'Butter', stock: 40, unit: 'kg', reorderLevel: 25, supplier: 'Dairy Co.' },
  ];

  return (
    <div className="space-y-6">
      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Raw Materials Inventory</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Add Raw Material
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Material</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stock</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Reorder Level</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Supplier</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {rawMaterials.map((material) => (
                <tr key={material.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{material.name}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{material.stock} {material.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{material.reorderLevel} {material.unit}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-gray-900">{material.supplier}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      material.stock <= material.reorderLevel
                        ? 'bg-red-100 text-red-800'
                        : material.stock <= material.reorderLevel * 1.5
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-green-100 text-green-800'
                    }`}>
                      {material.stock <= material.reorderLevel ? 'Low Stock' :
                       material.stock <= material.reorderLevel * 1.5 ? 'Medium' : 'Good'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    <button className="text-green-600 hover:text-green-900 mr-3">Reorder</button>
                    <button className="text-blue-600 hover:text-blue-900">Edit</button>
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

const InventoryPage: React.FC = () => {
  const inventoryStats = [
    { label: 'Total Products', value: '5', color: 'blue' },
    { label: 'Low Stock Items', value: '2', color: 'red' },
    { label: 'Total Value', value: '₹45,670', color: 'green' },
    { label: 'Reorder Alerts', value: '3', color: 'yellow' },
  ];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {inventoryStats.map((stat, index) => (
          <div key={index} className={`manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6`}>
            <div className="flex items-center">
              <div className={`w-12 h-12 bg-${stat.color}-100 rounded-lg flex items-center justify-center`}>
                <span className={`text-${stat.color}-600 text-xl font-bold`}>📊</span>
              </div>
              <div className="ml-4">
                <p className="text-sm text-gray-600">{stat.label}</p>
                <p className="text-2xl font-bold text-gray-900">{stat.value}</p>
              </div>
            </div>
          </div>
        ))}
      </div>

      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-xl font-semibold text-gray-900 mb-6">Inventory Movement</h3>
        <div className="space-y-4">
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Plain Roti - Restocked</p>
              <p className="text-sm text-gray-600">Added 200 units • 2 hours ago</p>
            </div>
            <span className="text-green-600 font-medium">+200</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Butter Roti - Sold</p>
              <p className="text-sm text-gray-600">Order #ORD-001 • 4 hours ago</p>
            </div>
            <span className="text-red-600 font-medium">-50</span>
          </div>
          <div className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
            <div>
              <p className="font-medium text-gray-900">Masala Roti - Production</p>
              <p className="text-sm text-gray-600">Batch #B-001 completed • 6 hours ago</p>
            </div>
            <span className="text-green-600 font-medium">+100</span>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductionPage: React.FC = () => {
  const productionBatches = [
    { id: 'B-001', product: 'Plain Roti', quantity: 500, status: 'Completed', startTime: '08:00', endTime: '10:30' },
    { id: 'B-002', product: 'Butter Roti', quantity: 300, status: 'In Progress', startTime: '11:00', endTime: '-' },
    { id: 'B-003', product: 'Masala Roti', quantity: 200, status: 'Scheduled', startTime: '14:00', endTime: '-' },
  ];

  return (
    <div className="space-y-6">
      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Production Schedule</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            Schedule Batch
          </button>
        </div>

        <div className="space-y-4">
          {productionBatches.map((batch) => (
            <div key={batch.id} className="border border-gray-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-2">
                <div className="flex items-center space-x-4">
                  <span className="font-medium text-gray-900">{batch.id}</span>
                  <span className="text-gray-600">{batch.product}</span>
                  <span className="text-sm text-gray-500">{batch.quantity} units</span>
                </div>
                <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                  batch.status === 'Completed' ? 'bg-green-100 text-green-800' :
                  batch.status === 'In Progress' ? 'bg-blue-100 text-blue-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {batch.status}
                </span>
              </div>
              <div className="flex items-center space-x-6 text-sm text-gray-600">
                <span>Start: {batch.startTime}</span>
                <span>End: {batch.endTime}</span>
                <div className="flex-1"></div>
                <button className="text-blue-600 hover:text-blue-800">View Details</button>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
};

const QualityPage: React.FC = () => {
  const qualityChecks = [
    { id: 'QC-001', batch: 'B-001', product: 'Plain Roti', score: 95, status: 'Passed', inspector: 'John Doe' },
    { id: 'QC-002', batch: 'B-002', product: 'Butter Roti', score: 88, status: 'Passed', inspector: 'Jane Smith' },
    { id: 'QC-003', batch: 'B-003', product: 'Masala Roti', score: 72, status: 'Failed', inspector: 'Mike Johnson' },
  ];

  return (
    <div className="space-y-6">
      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Quality Control Reports</h3>
          <button className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors">
            New QC Check
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">QC ID</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Batch</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Score</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Inspector</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {qualityChecks.map((check) => (
                <tr key={check.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">{check.id}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{check.batch}</td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{check.product}</td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`font-medium ${check.score >= 80 ? 'text-green-600' : 'text-red-600'}`}>
                      {check.score}%
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                      check.status === 'Passed' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                    }`}>
                      {check.status}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-gray-900">{check.inspector}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Manufacturing;
