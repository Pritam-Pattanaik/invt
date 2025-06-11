import React, { useState, useEffect } from 'react';
import { useQuery, useQueryClient, useMutation } from '@tanstack/react-query';
import toast from 'react-hot-toast';
import anime from 'animejs';
import { manufacturingAPI } from '../services/api';
import { useAuth } from '../contexts/AuthContext';

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

// Login Prompt Component
const LoginPrompt: React.FC<{ onLoginSuccess?: () => void }> = ({ onLoginSuccess }) => {
  const { login } = useAuth();
  const [email, setEmail] = useState('manager@rotifactory.com');
  const [password, setPassword] = useState('admin123');
  const [isLoading, setIsLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    try {
      await login(email, password);
      toast.success('Login successful! You can now access the database.');
      if (onLoginSuccess) {
        onLoginSuccess();
      }
    } catch (error) {
      toast.error('Login failed. Please check your credentials.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="max-w-md mx-auto mt-8">
      <div className="bg-white rounded-lg shadow-lg p-6 border border-gray-200">
        <div className="text-center mb-6">
          <div className="mx-auto h-12 w-12 bg-red-100 rounded-full flex items-center justify-center mb-4">
            <svg className="h-6 w-6 text-red-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-gray-900 mb-2">Authentication Required</h3>
          <p className="text-gray-600">Please log in to access the Manufacturing Products database.</p>
        </div>

        <form onSubmit={handleLogin} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password</label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
              required
            />
          </div>
          <button
            type="submit"
            disabled={isLoading}
            className="w-full bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md font-medium transition-colors disabled:opacity-50"
          >
            {isLoading ? 'Logging in...' : 'Login to Access Database'}
          </button>
        </form>

        <div className="mt-4 p-3 bg-gray-50 rounded-md">
          <p className="text-xs text-gray-600 mb-2"><strong>Test Credentials:</strong></p>
          <div className="text-xs text-gray-600 space-y-1">
            <div><strong>Manager:</strong> manager@rotifactory.com</div>
            <div><strong>Admin:</strong> admin@rotifactory.com</div>
            <div><strong>Password:</strong> admin123</div>
          </div>
        </div>
      </div>
    </div>
  );
};

const ProductsPage: React.FC = () => {
  const { user, logout, checkAuthState } = useAuth();
  const queryClient = useQueryClient();
  const [editingProduct, setEditingProduct] = useState<any>(null);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showAddModal, setShowAddModal] = useState(false);
  const [authError, setAuthError] = useState<string | null>(null);
  const [newProduct, setNewProduct] = useState({
    name: '',
    description: '',
    sku: '',
    category: 'Basic',
    unitPrice: 0,
    costPrice: 0,
    unit: 'piece'
  });

  // Function to handle authentication errors (currently unused but kept for future use)
  // const handleAuthError = (error: any) => {
  //   if (error.response?.status === 401) {
  //     const token = localStorage.getItem('accessToken');
  //     if (!token) {
  //       setAuthError('No authentication token found. Please log in.');
  //     } else {
  //       setAuthError('Authentication token expired. Please log in again.');
  //       // Clear invalid tokens
  //       localStorage.removeItem('accessToken');
  //       localStorage.removeItem('refreshToken');
  //       localStorage.removeItem('user');
  //       logout();
  //     }
  //     return true;
  //   }
  //   return false;
  // };



  // Fetch products from API - database only (active products only)
  const { data: productsResponse, isLoading, error, refetch } = useQuery({
    queryKey: ['manufacturing-products'],
    queryFn: async () => {
      try {
        console.log('Manufacturing: Fetching active products...');
        // Fetch only active products by passing isActive=true parameter
        const response = await manufacturingAPI.getProducts({ isActive: true });
        console.log('Manufacturing: Products API response:', response);
        return response;
      } catch (error: any) {
        console.error('Manufacturing: Products API error:', error);
        // If 401 error, check if user is actually authenticated
        if (error.response?.status === 401) {
          const token = localStorage.getItem('accessToken');
          if (!token) {
            // No token, user needs to login
            throw new Error('No authentication token found');
          } else {
            // Token exists but invalid, might be expired
            throw new Error('Authentication token expired');
          }
        }
        throw error;
      }
    },
    enabled: !!user && !!localStorage.getItem('accessToken'), // Only run if authenticated
    staleTime: 5 * 60 * 1000, // 5 minutes
    retry: false, // Don't retry to avoid confusion
  });

  // Extract products with proper nested structure handling
  const products = React.useMemo(() => {
    console.log('Manufacturing: Processing products response:', productsResponse);

    // Handle nested API response structure: { data: { data: products[], pagination: {...} } }
    const productsData = productsResponse?.data?.data || productsResponse?.data || [];
    console.log('Manufacturing: Extracted products data:', productsData);

    // Ensure we always return an array
    return Array.isArray(productsData) ? productsData : [];
  }, [productsResponse]);

  // Update product mutation - database only
  const updateProductMutation = useMutation({
    mutationFn: async ({ id, data }: { id: string; data: any }) => {
      console.log('Manufacturing: Updating product in database:', { id, data });
      const response = await manufacturingAPI.updateProduct(id, data);
      console.log('Manufacturing: Product updated in database:', response);
      return response.data;
    },
    onSuccess: (data) => {
      // Database update successful - force refresh from database
      console.log('Manufacturing: Product successfully updated in database:', data);
      queryClient.invalidateQueries({ queryKey: ['manufacturing-products'] });
      queryClient.refetchQueries({ queryKey: ['manufacturing-products'] });
      toast.success('Product updated successfully in database!');
      setShowEditModal(false);
      setEditingProduct(null);
    },
    onError: (error: any) => {
      console.error('Manufacturing: Failed to update product in database:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to update products');
      } else {
        toast.error(error.response?.data?.message || 'Failed to update product in database');
      }
    },
  });

  // Delete product mutation - database only
  const deleteProductMutation = useMutation({
    mutationFn: async (id: string) => {
      console.log('Manufacturing: Deleting product from database with ID:', id);
      const response = await manufacturingAPI.deleteProduct(id);
      console.log('Manufacturing: Delete response from database:', response);
      return response.data;
    },
    onSuccess: (data) => {
      // Database delete successful - force refresh from database
      console.log('Manufacturing: Product successfully deleted from database:', data);
      queryClient.invalidateQueries({ queryKey: ['manufacturing-products'] });
      queryClient.refetchQueries({ queryKey: ['manufacturing-products'] });

      // Show appropriate message based on whether it was soft delete or hard delete
      if (data?.message?.includes('deactivated')) {
        toast.success('Product deactivated in database! (Product has existing dependencies)');
      } else {
        toast.success('Product deleted successfully from database!');
      }
    },
    onError: (error: any) => {
      console.error('Manufacturing: Failed to delete product from database:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to delete products');
      } else {
        toast.error(error.response?.data?.message || 'Failed to delete product from database');
      }
    },
  });

  // Add product mutation - database only
  const addProductMutation = useMutation({
    mutationFn: async (data: any) => {
      console.log('Manufacturing: Adding product to database:', data);
      const response = await manufacturingAPI.createProduct(data);
      console.log('Manufacturing: Product added to database:', response);
      return response.data;
    },
    onSuccess: (data) => {
      // Database create successful - force refresh from database
      console.log('Manufacturing: Product successfully added to database:', data);
      queryClient.invalidateQueries({ queryKey: ['manufacturing-products'] });
      queryClient.refetchQueries({ queryKey: ['manufacturing-products'] });
      toast.success('Product added successfully to database!');
      setShowAddModal(false);
      setNewProduct({
        name: '',
        description: '',
        sku: '',
        category: 'Basic',
        unitPrice: 0,
        costPrice: 0,
        unit: 'piece'
      });
    },
    onError: (error: any) => {
      console.error('Manufacturing: Failed to add product to database:', error);
      if (error.response?.status === 401) {
        toast.error('Please log in to add products');
      } else {
        toast.error(error.response?.data?.message || 'Failed to add product to database');
      }
    },
  });

  const handleAddProduct = () => {
    setShowAddModal(true);
  };

  const handleSaveNewProduct = () => {
    try {
      if (!newProduct.name || !newProduct.sku) {
        toast.error('Please fill in required fields (Name and SKU)');
        return;
      }
      addProductMutation.mutate(newProduct);
    } catch (error) {
      console.error('Error saving product:', error);
      toast.error('Failed to save product');
    }
  };

  const handleEditProduct = (product: any) => {
    setEditingProduct({
      id: product.id,
      name: product.name,
      category: product.category,
      unitPrice: product.unitPrice,
      costPrice: product.costPrice,
      unit: product.unit,
      description: product.description || '',
    });
    setShowEditModal(true);
  };

  const handleSaveProduct = () => {
    if (editingProduct && editingProduct.id) {
      const { id, ...updateData } = editingProduct;
      updateProductMutation.mutate({ id, data: updateData });
    }
  };

  const handleDeleteProduct = (productId: string) => {
    if (window.confirm('Are you sure you want to delete this product?')) {
      deleteProductMutation.mutate(productId);
    }
  };



  if (isLoading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-green-600"></div>
      </div>
    );
  }

  if (error || authError) {
    // Show login prompt for authentication errors
    if ((error as any)?.response?.status === 401 || authError) {
      return (
        <div className="space-y-6">
          <div className="text-center">
            <h3 className="text-xl font-semibold text-gray-900 mb-2">Manufacturing Products</h3>
            <p className="text-gray-600">Authentication required</p>
          </div>

          {/* Show authentication error message */}
          {authError && (
            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 max-w-md mx-auto">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <svg className="h-5 w-5 text-yellow-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                  </svg>
                </div>
                <div className="ml-3">
                  <h3 className="text-sm font-medium text-yellow-800">Authentication Issue</h3>
                  <p className="text-sm text-yellow-700">{authError}</p>
                </div>
              </div>
            </div>
          )}

          <LoginPrompt onLoginSuccess={() => {
            setAuthError(null);
            refetch();
          }} />
        </div>
      );
    }

    // Show error message for other errors
    return (
      <div className="text-center py-12">
        <div className="bg-red-50 border border-red-200 rounded-lg p-6 max-w-md mx-auto">
          <div className="flex items-center justify-center mb-4">
            <svg className="h-12 w-12 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.35 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
          </div>
          <h3 className="text-lg font-medium text-red-800 mb-2">Unable to Load Products</h3>
          <p className="text-red-600 mb-4">
            Failed to connect to the database. Please check your connection and try again.
          </p>
          <button
            onClick={() => refetch()}
            className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Authentication Debug Info */}
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm">
          <h4 className="font-medium text-blue-800 mb-2">Authentication Status</h4>
          <div className="space-y-1 text-blue-700">
            <p><strong>User:</strong> {user ? `${user.firstName} ${user.lastName} (${user.role})` : 'Not logged in'}</p>
            <p><strong>Access Token:</strong> {localStorage.getItem('accessToken') ? 'Present' : 'Missing'}</p>
            <p><strong>Refresh Token:</strong> {localStorage.getItem('refreshToken') ? 'Present' : 'Missing'}</p>
            <p><strong>Auth Error:</strong> {authError || 'None'}</p>
            <p><strong>API Error:</strong> {error ? (error as any).message : 'None'}</p>
          </div>
          <div className="mt-3 space-x-2">
            <button
              onClick={() => refetch()}
              className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1 rounded text-xs"
            >
              Retry API Call
            </button>
            <button
              onClick={() => {
                checkAuthState();
                setAuthError(null);
              }}
              className="bg-green-600 hover:bg-green-700 text-white px-3 py-1 rounded text-xs"
            >
              Fix Auth State
            </button>
            <button
              onClick={() => {
                localStorage.removeItem('accessToken');
                localStorage.removeItem('refreshToken');
                localStorage.removeItem('user');
                logout();
                setAuthError('Tokens cleared - please log in again');
              }}
              className="bg-red-600 hover:bg-red-700 text-white px-3 py-1 rounded text-xs"
            >
              Clear Tokens
            </button>
          </div>
        </div>
      </div>

      {/* User Status Indicator */}
      {user && localStorage.getItem('accessToken') && (
        <div className="bg-green-50 border border-green-200 rounded-lg p-4">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-green-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm3.707-9.293a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-green-800">Database Connected</h3>
              <div className="mt-1 text-sm text-green-700">
                <p>Logged in as <strong>{user.firstName} {user.lastName}</strong> ({user.role}) - All changes will be saved to the database.</p>
              </div>
            </div>
          </div>
        </div>
      )}

      <div className="manufacturing-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <div className="flex items-center justify-between mb-6">
          <h3 className="text-xl font-semibold text-gray-900">Product Catalog</h3>
          <button
            onClick={handleAddProduct}
            className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
          >
            Add New Product
          </button>
        </div>

        {!Array.isArray(products) || products.length === 0 ? (
          <div className="text-center py-12">
            <div className="bg-gray-50 rounded-lg p-8 max-w-md mx-auto">
              <div className="flex items-center justify-center mb-4">
                <svg className="h-16 w-16 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">
                {!Array.isArray(products) ? 'Loading Products...' : 'No Products Found'}
              </h3>
              <p className="text-gray-600 mb-4">
                {!Array.isArray(products)
                  ? 'Please wait while we load your products.'
                  : 'Get started by adding your first product to the catalog.'
                }
              </p>
              {Array.isArray(products) && (
                <button
                  onClick={handleAddProduct}
                  className="bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-lg font-medium transition-colors"
                >
                  Add Your First Product
                </button>
              )}
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {Array.isArray(products) && products.map((product: any) => (
              <div key={product.id} className="border border-gray-200 rounded-lg p-4 hover:shadow-md transition-shadow">
                <div className="flex items-center justify-between mb-2">
                  <h4 className="font-semibold text-gray-900">{product.name}</h4>
                  <span className="text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded">{product.category}</span>
                </div>
                <div className="space-y-2">
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit Price:</span>
                    <span className="font-medium">₹{Number(product.unitPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Cost Price:</span>
                    <span className="font-medium">₹{Number(product.costPrice).toFixed(2)}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600">Unit:</span>
                    <span className="font-medium">{product.unit}</span>
                  </div>
                  {product.sku && (
                    <div className="flex justify-between">
                      <span className="text-gray-600">SKU:</span>
                      <span className="font-medium text-sm">{product.sku}</span>
                    </div>
                  )}
                </div>
                <div className="mt-4 flex space-x-2">
                  <button
                    onClick={() => handleEditProduct(product)}
                    disabled={updateProductMutation.isPending}
                    className="flex-1 bg-blue-100 hover:bg-blue-200 text-blue-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {updateProductMutation.isPending ? 'Updating...' : 'Edit'}
                  </button>
                  <button
                    onClick={() => handleDeleteProduct(product.id)}
                    disabled={deleteProductMutation.isPending}
                    className="flex-1 bg-red-100 hover:bg-red-200 text-red-700 px-3 py-1 rounded text-sm transition-colors disabled:opacity-50"
                  >
                    {deleteProductMutation.isPending ? 'Deleting...' : 'Delete'}
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Edit Product Modal */}
      {showEditModal && editingProduct && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Product</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name</label>
                <input
                  type="text"
                  value={editingProduct.name}
                  onChange={(e) => setEditingProduct({...editingProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={editingProduct.description}
                  onChange={(e) => setEditingProduct({...editingProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  rows={2}
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.unitPrice}
                  onChange={(e) => setEditingProduct({...editingProduct, unitPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={editingProduct.costPrice}
                  onChange={(e) => setEditingProduct({...editingProduct, costPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={editingProduct.unit}
                  onChange={(e) => setEditingProduct({...editingProduct, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={editingProduct.category}
                  onChange={(e) => setEditingProduct({...editingProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Specialty">Specialty</option>
                  <option value="Healthy">Healthy</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveProduct}
                disabled={updateProductMutation.isPending}
                className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {updateProductMutation.isPending ? 'Saving...' : 'Save Changes'}
              </button>
              <button
                onClick={() => {
                  setShowEditModal(false);
                  setEditingProduct(null);
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Add Product Modal */}
      {showAddModal && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-lg p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Product</h3>

            <div className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Product Name *</label>
                <input
                  type="text"
                  value={newProduct.name}
                  onChange={(e) => setNewProduct({...newProduct, name: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter product name"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">SKU *</label>
                <input
                  type="text"
                  value={newProduct.sku}
                  onChange={(e) => setNewProduct({...newProduct, sku: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Enter SKU (e.g., ROTI-006)"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
                <textarea
                  value={newProduct.description}
                  onChange={(e) => setNewProduct({...newProduct, description: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  rows={2}
                  placeholder="Enter product description"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.unitPrice}
                  onChange={(e) => setNewProduct({...newProduct, unitPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Cost Price (₹)</label>
                <input
                  type="number"
                  step="0.01"
                  value={newProduct.costPrice}
                  onChange={(e) => setNewProduct({...newProduct, costPrice: Number(e.target.value)})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="0.00"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Unit</label>
                <select
                  value={newProduct.unit}
                  onChange={(e) => setNewProduct({...newProduct, unit: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="piece">Piece</option>
                  <option value="kg">Kilogram</option>
                  <option value="gram">Gram</option>
                  <option value="liter">Liter</option>
                  <option value="pack">Pack</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select
                  value={newProduct.category}
                  onChange={(e) => setNewProduct({...newProduct, category: e.target.value})}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="Basic">Basic</option>
                  <option value="Premium">Premium</option>
                  <option value="Specialty">Specialty</option>
                  <option value="Healthy">Healthy</option>
                </select>
              </div>
            </div>

            <div className="flex space-x-3 mt-6">
              <button
                onClick={handleSaveNewProduct}
                disabled={addProductMutation.isPending}
                className="flex-1 bg-green-600 hover:bg-green-700 text-white px-4 py-2 rounded-md transition-colors disabled:opacity-50"
              >
                {addProductMutation.isPending ? 'Adding...' : 'Add Product'}
              </button>
              <button
                onClick={() => {
                  setShowAddModal(false);
                  setNewProduct({
                    name: '',
                    description: '',
                    sku: '',
                    category: 'Basic',
                    unitPrice: 0,
                    costPrice: 0,
                    unit: 'piece'
                  });
                }}
                className="flex-1 bg-gray-300 hover:bg-gray-400 text-gray-700 px-4 py-2 rounded-md transition-colors"
              >
                Cancel
              </button>
            </div>
          </div>
        </div>
      )}
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
