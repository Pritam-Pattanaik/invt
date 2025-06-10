import { getApiBaseUrl, getBaseUrl } from '../config/api';

const API_BASE_URL = getApiBaseUrl();

// Get auth token from localStorage
const getAuthToken = () => {
  return localStorage.getItem('accessToken') || localStorage.getItem('authToken');
};

// Create headers with auth token
const createHeaders = () => {
  const token = getAuthToken();
  return {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
  };
};

// Generic API request function
const apiRequest = async (endpoint, options = {}) => {
  const url = `${API_BASE_URL}${endpoint}`;
  const config = {
    headers: createHeaders(),
    ...options,
  };

  try {
    const response = await fetch(url, config);
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP error! status: ${response.status}`);
    }
    
    return await response.json();
  } catch (error) {
    console.error(`API request failed for ${endpoint}:`, error);
    throw error;
  }
};

// Dashboard API
export const dashboardAPI = {
  // Get dashboard overview data
  getDashboardData: async () => {
    return apiRequest('/reports/dashboard');
  },

  // Get database status (public endpoint)
  getDatabaseStatus: async () => {
    const baseUrl = getBaseUrl();
    const response = await fetch(`${baseUrl}/db-status`);
    if (!response.ok) {
      throw new Error('Failed to fetch database status');
    }
    return response.json();
  },
};

// Authentication API
export const authAPI = {
  login: async (email, password) => {
    return apiRequest('/auth/login', {
      method: 'POST',
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (userData) => {
    return apiRequest('/auth/register', {
      method: 'POST',
      body: JSON.stringify(userData),
    });
  },

  logout: async () => {
    return apiRequest('/auth/logout', {
      method: 'POST',
    });
  },

  refreshToken: async () => {
    return apiRequest('/auth/refresh', {
      method: 'POST',
    });
  },
};

// Users API
export const usersAPI = {
  getUsers: async () => {
    return apiRequest('/users');
  },

  getUser: async (id) => {
    return apiRequest(`/users/${id}`);
  },

  updateUser: async (id, userData) => {
    return apiRequest(`/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });
  },

  deleteUser: async (id) => {
    return apiRequest(`/users/${id}`, {
      method: 'DELETE',
    });
  },
};

// Manufacturing API
export const manufacturingAPI = {
  getProducts: async () => {
    return apiRequest('/manufacturing/products');
  },

  createProduct: async (productData) => {
    return apiRequest('/manufacturing/products', {
      method: 'POST',
      body: JSON.stringify(productData),
    });
  },

  updateProduct: async (id, productData) => {
    return apiRequest(`/manufacturing/products/${id}`, {
      method: 'PUT',
      body: JSON.stringify(productData),
    });
  },

  deleteProduct: async (id) => {
    return apiRequest(`/manufacturing/products/${id}`, {
      method: 'DELETE',
    });
  },

  getInventory: async () => {
    return apiRequest('/manufacturing/inventory');
  },

  createProductionBatch: async (batchData) => {
    return apiRequest('/manufacturing/production', {
      method: 'POST',
      body: JSON.stringify(batchData),
    });
  },

  getQualityChecks: async () => {
    return apiRequest('/manufacturing/quality-checks');
  },
};

// Franchises API
export const franchisesAPI = {
  getFranchises: async () => {
    return apiRequest('/franchises');
  },

  createFranchise: async (franchiseData) => {
    return apiRequest('/franchises', {
      method: 'POST',
      body: JSON.stringify(franchiseData),
    });
  },

  getFranchise: async (id) => {
    return apiRequest(`/franchises/${id}`);
  },

  updateFranchise: async (id, franchiseData) => {
    return apiRequest(`/franchises/${id}`, {
      method: 'PUT',
      body: JSON.stringify(franchiseData),
    });
  },
};

// Orders API
export const ordersAPI = {
  getOrders: async () => {
    return apiRequest('/counters/orders');
  },

  createOrder: async (orderData) => {
    return apiRequest('/counters/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrderStatus: async (id, status) => {
    return apiRequest(`/counters/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },
};

// Sales API
export const salesAPI = {
  // Orders
  getOrders: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/sales/orders${queryParams ? `?${queryParams}` : ''}`);
  },

  createOrder: async (orderData) => {
    return apiRequest('/sales/orders', {
      method: 'POST',
      body: JSON.stringify(orderData),
    });
  },

  updateOrder: async (id, orderData) => {
    return apiRequest(`/sales/orders/${id}`, {
      method: 'PUT',
      body: JSON.stringify(orderData),
    });
  },

  deleteOrder: async (id) => {
    return apiRequest(`/sales/orders/${id}`, {
      method: 'DELETE',
    });
  },

  // Point of Sale (POS)
  getPOSTransactions: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/sales/pos${queryParams ? `?${queryParams}` : ''}`);
  },

  createPOSTransaction: async (transactionData) => {
    return apiRequest('/sales/pos', {
      method: 'POST',
      body: JSON.stringify(transactionData),
    });
  },

  updatePOSTransaction: async (id, transactionData) => {
    return apiRequest(`/sales/pos/${id}`, {
      method: 'PUT',
      body: JSON.stringify(transactionData),
    });
  },

  deletePOSTransaction: async (id) => {
    return apiRequest(`/sales/pos/${id}`, {
      method: 'DELETE',
    });
  },

  // Products
  getProducts: async () => {
    return apiRequest('/sales/products');
  },

  // Sales Reports
  getSalesReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/sales/reports${queryParams ? `?${queryParams}` : ''}`);
  },

  // Sales Analytics
  getSalesAnalytics: async (period = 'today') => {
    return apiRequest(`/sales/analytics?period=${period}`);
  },
};

// Reports API
export const reportsAPI = {
  getDashboard: async () => {
    return apiRequest('/reports/dashboard');
  },

  getSalesReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/reports/sales${queryParams ? `?${queryParams}` : ''}`);
  },

  getInventoryReport: async (filters = {}) => {
    const queryParams = new URLSearchParams(filters).toString();
    return apiRequest(`/reports/inventory${queryParams ? `?${queryParams}` : ''}`);
  },
};

// HR API
export const hrAPI = {
  getEmployees: async () => {
    return apiRequest('/hr/employees');
  },

  createEmployee: async (data) => {
    return apiRequest('/hr/employees', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateEmployee: async (id, data) => {
    return apiRequest(`/hr/employees/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getAttendance: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/hr/attendance${queryParams ? `?${queryParams}` : ''}`);
  },

  markAttendance: async (data) => {
    return apiRequest('/hr/attendance', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getPayroll: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/hr/payroll${queryParams ? `?${queryParams}` : ''}`);
  },

  processPayroll: async (data) => {
    return apiRequest('/hr/payroll', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getTrainingPrograms: async () => {
    return apiRequest('/hr/training');
  },

  createTrainingProgram: async (data) => {
    return apiRequest('/hr/training', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },
};

// Counters API
export const countersAPI = {
  getCounters: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/counters${queryParams ? `?${queryParams}` : ''}`);
  },

  createCounter: async (data) => {
    return apiRequest('/counters', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateCounter: async (id, data) => {
    return apiRequest(`/counters/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  deleteCounter: async (id) => {
    return apiRequest(`/counters/${id}`, {
      method: 'DELETE',
    });
  },
};

// Finance API
export const financeAPI = {
  getAccounts: async () => {
    return apiRequest('/finance/accounts');
  },

  createAccount: async (data) => {
    return apiRequest('/finance/accounts', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  getExpenses: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/finance/expenses${queryParams ? `?${queryParams}` : ''}`);
  },

  createExpense: async (data) => {
    return apiRequest('/finance/expenses', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateExpense: async (id, data) => {
    return apiRequest(`/finance/expenses/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getProfitLoss: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/finance/profit-loss${queryParams ? `?${queryParams}` : ''}`);
  },

  getTaxReports: async (params = {}) => {
    const queryParams = new URLSearchParams(params).toString();
    return apiRequest(`/finance/tax${queryParams ? `?${queryParams}` : ''}`);
  },
};

// Settings API
export const settingsAPI = {
  getGeneralSettings: async () => {
    return apiRequest('/settings/general');
  },

  updateGeneralSettings: async (data) => {
    return apiRequest('/settings/general', {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getUsers: async () => {
    return apiRequest('/settings/users');
  },

  createUser: async (data) => {
    return apiRequest('/settings/users', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  updateUser: async (id, data) => {
    return apiRequest(`/settings/users/${id}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getPermissions: async () => {
    return apiRequest('/settings/permissions');
  },

  updateRolePermissions: async (role, data) => {
    return apiRequest(`/settings/permissions/${role}`, {
      method: 'PUT',
      body: JSON.stringify(data),
    });
  },

  getBackups: async () => {
    return apiRequest('/settings/backup');
  },

  createBackup: async (data = {}) => {
    return apiRequest('/settings/backup', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  deleteBackup: async (id) => {
    return apiRequest(`/settings/backup/${id}`, {
      method: 'DELETE',
    });
  },
};

// Error handling utility
export const handleAPIError = (error) => {
  if (error.message.includes('401') || error.message.includes('Unauthorized')) {
    // Token expired or invalid
    localStorage.removeItem('authToken');
    localStorage.removeItem('accessToken');
    localStorage.removeItem('refreshToken');
    localStorage.removeItem('user');
    window.location.href = '/login';
    return;
  }

  console.error('API Error:', error);
  return error.message || 'An unexpected error occurred';
};

export default {
  dashboardAPI,
  authAPI,
  usersAPI,
  manufacturingAPI,
  franchisesAPI,
  ordersAPI,
  salesAPI,
  reportsAPI,
  countersAPI,
  financeAPI,
  hrAPI,
  settingsAPI,
  handleAPIError,
};
