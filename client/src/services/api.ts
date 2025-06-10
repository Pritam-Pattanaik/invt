import axios from 'axios';
import toast from 'react-hot-toast';

const API_URL = import.meta.env.VITE_API_URL || (import.meta.env.PROD ? '/api' : 'http://localhost:3001/api');

// Create axios instance
const api = axios.create({
  baseURL: API_URL,
  headers: {
    'Content-Type': 'application/json',
  },
  timeout: 30000, // 30 second timeout for mobile networks
  withCredentials: false, // Disable credentials for mobile compatibility
});

// Request interceptor to add auth token
api.interceptors.request.use(
  (config) => {
    const token = localStorage.getItem('accessToken');
    if (token) {
      config.headers.Authorization = `Bearer ${token}`;
    }
    return config;
  },
  (error) => {
    return Promise.reject(error);
  }
);

// Response interceptor to handle errors
api.interceptors.response.use(
  (response) => {
    return response;
  },
  async (error) => {
    const originalRequest = error.config;

    // Handle network errors gracefully
    if (!error.response) {
      // Network error - show user-friendly message for mobile
      console.error('Network error:', error.message);
      if (error.code === 'ECONNABORTED' || error.message.includes('timeout')) {
        toast.error('Request timeout. Please check your connection and try again.');
      } else {
        toast.error('Unable to connect to server. Please check your internet connection.');
      }
      return Promise.reject(error);
    }

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      try {
        const refreshToken = localStorage.getItem('refreshToken');
        if (refreshToken) {
          const response = await axios.post(`${API_URL}/auth/refresh`, {
            refreshToken,
          });

          const { accessToken } = response.data;
          localStorage.setItem('accessToken', accessToken);

          // Retry the original request
          originalRequest.headers.Authorization = `Bearer ${accessToken}`;
          return api(originalRequest);
        }
      } catch (refreshError) {
        // Refresh failed, redirect to login
        localStorage.removeItem('accessToken');
        localStorage.removeItem('refreshToken');
        localStorage.removeItem('user');
        window.location.href = '/login';
        return Promise.reject(refreshError);
      }
    }

    // Only show error toast for client errors (4xx) and server errors (5xx), not for network issues
    if (error.response?.status >= 400 && error.response?.status !== 401) {
      const message = error.response?.data?.message || error.response?.data?.error || `HTTP ${error.response.status}`;
      // API Error - handled silently for non-critical errors
      // Only show toast for critical errors, not for expected failures
      if (error.response.status >= 500) {
        toast.error(message);
      }
    }

    return Promise.reject(error);
  }
);

// Auth API
export const authAPI = {
  login: (credentials: { email: string; password: string }) =>
    api.post('/auth/login', credentials),
  
  register: (userData: {
    email: string;
    password: string;
    firstName: string;
    lastName: string;
    phone?: string;
    role: string;
  }) => api.post('/auth/register', userData),
  
  logout: () => api.post('/auth/logout'),
  
  getProfile: () => api.get('/auth/profile'),
  
  refreshToken: (refreshToken: string) =>
    api.post('/auth/refresh', { refreshToken }),
};

// Users API
export const usersAPI = {
  getUsers: (params?: {
    page?: number;
    limit?: number;
    role?: string;
    status?: string;
    search?: string;
  }) => api.get('/users', { params }),
  
  getUser: (id: string) => api.get(`/users/${id}`),
  
  updateUser: (id: string, data: any) => api.put(`/users/${id}`, data),
  
  deleteUser: (id: string) => api.delete(`/users/${id}`),
  
  getUserStats: () => api.get('/users/stats/overview'),
};

// Manufacturing API
export const manufacturingAPI = {
  // Products
  getProducts: (params?: {
    page?: number;
    limit?: number;
    category?: string;
    search?: string;
    isActive?: boolean;
  }) => api.get('/manufacturing/products', { params }),
  
  createProduct: (data: {
    name: string;
    description?: string;
    sku: string;
    category: string;
    unitPrice: number;
    costPrice: number;
    unit: string;
  }) => api.post('/manufacturing/products', data),

  updateProduct: (id: string, data: {
    name?: string;
    description?: string;
    category?: string;
    unitPrice?: number;
    costPrice?: number;
    unit?: string;
  }) => api.put(`/manufacturing/products/${id}`, data),

  deleteProduct: (id: string) => api.delete(`/manufacturing/products/${id}`),
  
  // Raw Materials
  getRawMaterials: (params?: {
    page?: number;
    limit?: number;
    search?: string;
  }) => api.get('/manufacturing/raw-materials', { params }),
  
  createRawMaterial: (data: {
    name: string;
    description?: string;
    sku: string;
    unit: string;
    costPrice: number;
    supplier?: string;
    minStock?: number;
    maxStock?: number;
  }) => api.post('/manufacturing/raw-materials', data),
  
  // Inventory
  getInventory: (params?: {
    type?: 'products' | 'raw-materials' | 'all';
    lowStock?: boolean;
  }) => api.get('/manufacturing/inventory', { params }),
};

// Franchises API
export const franchisesAPI = {
  getFranchises: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    search?: string;
  }) => api.get('/franchises', { params }),
  
  createFranchise: (data: {
    name: string;
    code: string;
    ownerName: string;
    ownerEmail: string;
    ownerPhone: string;
    address: string;
    city: string;
    state: string;
    pincode: string;
    gstNumber?: string;
    licenseNumber?: string;
    royaltyRate: number;
    managedBy?: string;
    openingDate?: string;
  }) => api.post('/franchises', data),
  
  getFranchise: (id: string) => api.get(`/franchises/${id}`),
  
  updateFranchise: (id: string, data: any) => api.put(`/franchises/${id}`, data),
  
  getFranchiseStats: (id: string) => api.get(`/franchises/${id}/stats`),
};

// Counters API
export const countersAPI = {
  getCounters: (params?: {
    franchiseId?: string;
    isActive?: boolean;
  }) => api.get('/counters', { params }),
  
  createCounter: (data: {
    franchiseId: string;
    name: string;
    location: string;
  }) => api.post('/counters', data),
  
  // Orders
  createOrder: (data: {
    counterId: string;
    items: Array<{
      productId: string;
      quantity: number;
      unitPrice: number;
      notes?: string;
    }>;
    customerId?: string;
    paymentMethod?: string;
    discount?: number;
    notes?: string;
  }) => api.post('/counters/orders', data),
  
  getOrders: (params?: {
    counterId?: string;
    status?: string;
    page?: number;
    limit?: number;
    date?: string;
  }) => api.get('/counters/orders', { params }),
  
  updateOrderStatus: (id: string, data: {
    status: string;
    notes?: string;
  }) => api.put(`/counters/orders/${id}`, data),
};

// Sales API
export const salesAPI = {
  getProducts: () => api.get('/sales/products'),

  getOrders: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
    deliveryDate?: string;
  }) => api.get('/sales/orders', { params }),

  createOrder: (data: {
    customerName: string;
    customerPhone: string;
    customerAddress?: string;
    orderDate: string;
    deliveryDate: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
  }) => api.post('/sales/orders', data),

  updateOrder: (id: string, data: {
    status?: string;
    paymentStatus?: string;
  }) => api.put(`/sales/orders/${id}`, data),

  deleteOrder: (id: string) => api.delete(`/sales/orders/${id}`),

  getPOSTransactions: (params?: {
    page?: number;
    limit?: number;
    startDate?: string;
    endDate?: string;
  }) => api.get('/sales/pos', { params }),

  createPOSTransaction: (data: {
    customerName?: string;
    items: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    paymentMethod: string;
    cashierName: string;
  }) => api.post('/sales/pos', data),

  updatePOSTransaction: (id: string, data: {
    customerName?: string;
    items?: Array<{
      productId: string;
      quantity: number;
      price: number;
    }>;
    paymentMethod?: string;
    cashierName?: string;
  }) => api.put(`/sales/pos/${id}`, data),

  deletePOSTransaction: (id: string) => api.delete(`/sales/pos/${id}`),

  getSalesReports: (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/sales/reports', { params }),
};

// Finance API
export const financeAPI = {
  getAccounts: () => api.get('/finance/accounts'),

  createAccount: (data: {
    name: string;
    type: string;
    balance: number;
    description?: string;
  }) => api.post('/finance/accounts', data),

  getExpenses: (params?: {
    page?: number;
    limit?: number;
    status?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/finance/expenses', { params }),

  createExpense: (data: {
    title: string;
    amount: number;
    category: string;
    description?: string;
    date: string;
    paymentMethod: string;
  }) => api.post('/finance/expenses', data),

  updateExpense: (id: string, data: {
    status?: string;
  }) => api.put(`/finance/expenses/${id}`, data),

  getProfitLoss: (params?: {
    period?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/finance/profit-loss', { params }),

  getTaxRecords: () => api.get('/finance/tax-records'),

  createTaxRecord: (data: {
    taxType: string;
    period: string;
    amount: number;
    dueDate: string;
    description?: string;
  }) => api.post('/finance/tax-records', data),

  updateTaxRecord: (id: string, data: {
    status?: string;
    filedDate?: string;
    paidDate?: string;
  }) => api.put(`/finance/tax-records/${id}`, data),
};

// HR API
export const hrAPI = {
  getEmployees: (params?: {
    page?: number;
    limit?: number;
    department?: string;
    status?: string;
  }) => api.get('/hr/employees', { params }),

  createEmployee: (data: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    position: string;
    department: string;
    salary: number;
    joinDate: string;
    address?: string;
    emergencyContact?: string;
  }) => api.post('/hr/employees', data),

  updateEmployee: (id: string, data: {
    status?: string;
    salary?: number;
    position?: string;
    department?: string;
  }) => api.put(`/hr/employees/${id}`, data),

  getAttendance: (params?: {
    date?: string;
    employeeId?: string;
    startDate?: string;
    endDate?: string;
  }) => api.get('/hr/attendance', { params }),

  markAttendance: (data: {
    employeeId: string;
    date: string;
    checkIn?: string;
    checkOut?: string;
    status: string;
    notes?: string;
  }) => api.post('/hr/attendance', data),

  getPayroll: (params?: {
    month?: number;
    year?: number;
    employeeId?: string;
  }) => api.get('/hr/payroll', { params }),

  processPayroll: (data: {
    employeeId: string;
    month: number;
    year: number;
    basicSalary: number;
    allowances?: number;
    overtime?: number;
    deductions?: number;
  }) => api.post('/hr/payroll', data),

  getTrainingPrograms: () => api.get('/hr/training'),

  createTrainingProgram: (data: {
    title: string;
    description?: string;
    instructor: string;
    startDate: string;
    endDate: string;
    duration: number;
    maxParticipants: number;
    location: string;
    cost: number;
  }) => api.post('/hr/training', data),
};

// Settings API
export const settingsAPI = {
  getGeneralSettings: () => api.get('/settings/general'),

  updateGeneralSettings: (data: any) => api.put('/settings/general', data),

  getUsers: () => api.get('/settings/users'),

  createUser: (data: {
    firstName: string;
    lastName: string;
    email: string;
    role: string;
    password: string;
  }) => api.post('/settings/users', data),

  updateUser: (id: string, data: {
    isActive?: boolean;
    role?: string;
  }) => api.put(`/settings/users/${id}`, data),

  getPermissions: () => api.get('/settings/permissions'),

  updateRolePermissions: (role: string, data: {
    permissionIds: string[];
  }) => api.put(`/settings/permissions/${role}`, data),

  getBackups: () => api.get('/settings/backup'),

  createBackup: (data?: {
    type?: string;
  }) => api.post('/settings/backup', data || {}),

  deleteBackup: (id: string) => api.delete(`/settings/backup/${id}`),
};

// Dashboard API
export const dashboardAPI = {
  getDashboard: () => api.get('/reports/dashboard'),

  getDatabaseStatus: () => api.get('/db-status'),

  getOverview: () => api.get('/reports/overview'),
};

// Reports API
export const reportsAPI = {
  getDashboard: () => api.get('/reports/dashboard'),

  getSalesReport: (params?: {
    startDate?: string;
    endDate?: string;
    franchiseId?: string;
    counterId?: string;
    groupBy?: 'day' | 'week' | 'month';
  }) => api.get('/reports/sales', { params }),

  getInventoryReport: (params?: {
    type?: 'products' | 'raw-materials' | 'all';
    lowStock?: boolean;
  }) => api.get('/reports/inventory', { params }),
};

// Error handling utility
export const handleAPIError = (error: any): string => {
  if (error.response) {
    // Server responded with error status
    return error.response.data?.message || error.response.data?.error || `Server error: ${error.response.status}`;
  } else if (error.request) {
    // Request was made but no response received
    return 'Network error: Unable to connect to server';
  } else {
    // Something else happened
    return error.message || 'An unexpected error occurred';
  }
};

export default api;
