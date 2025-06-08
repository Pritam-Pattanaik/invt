import React, { useEffect, useState } from 'react';
import anime from 'animejs';
import { manufacturingAPI } from '../services/api';

interface ProductsModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Product {
  id: string;
  name: string;
  description?: string;
  sku: string;
  category: string;
  unitPrice: string;
  costPrice: string;
  unit: string;
  isActive: boolean;
  createdAt: string;
  updatedAt: string;
  inventoryItems: any[];
  _count: {
    recipes: number;
    productionBatches: number;
  };
}

const ProductsModal: React.FC<ProductsModalProps> = ({ isOpen, onClose }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddProduct, setShowAddProduct] = useState(false);
  const [newProduct, setNewProduct] = useState({
    name: '',
    category: 'Basic Roti',
    price: 0,
    cost: 0,
    stock: 0
  });

  const categories = ['Basic Roti', 'Premium Roti', 'Specialty Roti', 'Healthy Roti'];

  const fetchProducts = async () => {
    try {
      setLoading(true);
      setError(null);
      const response = await manufacturingAPI.getProducts();
      setProducts(response.data || []);
    } catch (err) {
      console.error('Failed to fetch products:', err);
      setError('Failed to load products');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchProducts();

      anime({
        targets: '.products-modal',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (products.length > 0) {
      anime({
        targets: '.product-item',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });
    }
  }, [products]);

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  const getStatusText = (isActive: boolean) => {
    return isActive ? 'Active' : 'Inactive';
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'Basic Roti': return 'bg-blue-100 text-blue-800';
      case 'Premium Roti': return 'bg-purple-100 text-purple-800';
      case 'Specialty Roti': return 'bg-orange-100 text-orange-800';
      case 'Healthy Roti': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const addProduct = async () => {
    try {
      const productData = {
        name: newProduct.name,
        sku: `PROD-${Date.now()}`,
        category: newProduct.category,
        unitPrice: newProduct.price,
        costPrice: newProduct.cost,
        unit: 'pieces',
        description: `${newProduct.name} - ${newProduct.category}`
      };

      await manufacturingAPI.createProduct(productData);
      setNewProduct({ name: '', category: 'Basic Roti', price: 0, cost: 0, stock: 0 });
      setShowAddProduct(false);

      // Refresh the products list
      await fetchProducts();
    } catch (err) {
      console.error('Failed to create product:', err);
      setError('Failed to create product');
    }
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="products-modal bg-white rounded-2xl shadow-2xl max-w-6xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-orange-500 to-orange-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Product Catalog</h2>
              <p className="text-orange-100">Product management and inventory</p>
            </div>
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-3xl font-bold">{products.length}</p>
                <p className="text-orange-100">Total Products</p>
              </div>
              <button
                onClick={() => setShowAddProduct(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Product</span>
              </button>
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
        </div>

        {/* Content */}
        <div className="p-6 overflow-y-auto max-h-[calc(90vh-120px)]">
          {loading && (
            <div className="flex items-center justify-center py-12">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
              <span className="ml-2 text-gray-600">Loading products...</span>
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
                    onClick={fetchProducts}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              {/* Summary Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                <div className="bg-green-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-green-900">Total Products</h3>
                  <p className="text-2xl font-bold text-green-700">
                    {products.length}
                  </p>
                </div>
                <div className="bg-blue-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-blue-900">Active Products</h3>
                  <p className="text-2xl font-bold text-blue-700">
                    {products.filter(p => p.isActive).length}
                  </p>
                </div>
                <div className="bg-yellow-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-yellow-900">Categories</h3>
                  <p className="text-2xl font-bold text-yellow-700">
                    {new Set(products.map(p => p.category)).size}
                  </p>
                </div>
                <div className="bg-purple-50 p-4 rounded-xl">
                  <h3 className="font-semibold text-purple-900">Avg Price</h3>
                  <p className="text-2xl font-bold text-purple-700">
                    ₹{products.length > 0 ? Math.round(products.reduce((sum, p) => sum + parseFloat(p.unitPrice), 0) / products.length) : 0}
                  </p>
                </div>
              </div>
            </>
          )}

          {!loading && !error && products.length > 0 && (
            <>
              {/* Products Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {products.map((product) => (
                  <div key={product.id} className="product-item bg-white border border-gray-200 rounded-xl p-6 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-4">
                      <div className="flex items-center space-x-3">
                        <div className="w-12 h-12 bg-gradient-to-r from-orange-400 to-orange-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">🥖</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{product.name}</h4>
                          <p className="text-xs text-gray-500">SKU: {product.sku}</p>
                          <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${getCategoryColor(product.category)}`}>
                            {product.category}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(product.isActive)}`}>
                          {getStatusText(product.isActive)}
                        </span>
                      </div>
                    </div>

                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unit Price</span>
                        <span className="text-sm font-bold text-green-600">₹{product.unitPrice}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Cost Price</span>
                        <span className="text-sm font-medium">₹{product.costPrice}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Unit</span>
                        <span className="text-sm font-medium">{product.unit}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Recipes</span>
                        <span className="text-sm font-medium">{product._count.recipes}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Production Batches</span>
                        <span className="text-sm font-medium">{product._count.productionBatches}</span>
                      </div>

                      <div className="flex items-center justify-between">
                        <span className="text-sm text-gray-600">Profit Margin</span>
                        <span className="text-sm font-medium">
                          {Math.round(((parseFloat(product.unitPrice) - parseFloat(product.costPrice)) / parseFloat(product.unitPrice)) * 100)}%
                        </span>
                      </div>
                    </div>

                    <div className="mt-4 flex space-x-2">
                      <button className="flex-1 px-3 py-2 bg-orange-100 text-orange-700 rounded-lg text-sm hover:bg-orange-200 transition-colors">
                        Edit
                      </button>
                      <button className="flex-1 px-3 py-2 bg-gray-100 text-gray-700 rounded-lg text-sm hover:bg-gray-200 transition-colors">
                        Details
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && products.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No products found</h3>
              <p className="text-gray-500">Get started by adding your first product.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Product Modal */}
      {showAddProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-md w-full">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Product</h3>
                <button
                  onClick={() => setShowAddProduct(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Product Name</label>
                  <input
                    type="text"
                    value={newProduct.name}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, name: e.target.value }))}
                    className="input w-full"
                    placeholder="Enter product name"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Category</label>
                  <select
                    value={newProduct.category}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, category: e.target.value }))}
                    className="input w-full"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>{category}</option>
                    ))}
                  </select>
                </div>
                
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Price (₹)</label>
                    <input
                      type="number"
                      value={newProduct.price}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, price: parseFloat(e.target.value) || 0 }))}
                      className="input w-full"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Cost (₹)</label>
                    <input
                      type="number"
                      value={newProduct.cost}
                      onChange={(e) => setNewProduct(prev => ({ ...prev, cost: parseFloat(e.target.value) || 0 }))}
                      className="input w-full"
                      placeholder="0"
                      min="0"
                      step="0.01"
                    />
                  </div>
                </div>
                
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Initial Stock</label>
                  <input
                    type="number"
                    value={newProduct.stock}
                    onChange={(e) => setNewProduct(prev => ({ ...prev, stock: parseInt(e.target.value) || 0 }))}
                    className="input w-full"
                    placeholder="0"
                    min="0"
                  />
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddProduct(false)}
                    className="btn btn-outline btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={addProduct}
                    disabled={!newProduct.name.trim() || newProduct.price <= 0}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Add Product
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default ProductsModal;
