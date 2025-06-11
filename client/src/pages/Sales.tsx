import React, { useState } from 'react';
import { Routes, Route, useNavigate, useLocation, Navigate } from 'react-router-dom';
import { useQuery, useQueryClient } from '@tanstack/react-query';

import toast from 'react-hot-toast';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import { salesAPI, reportsAPI } from '../services/api';
import ActionButtons from '../components/ActionButtons';
import { generateSalesReportPDF } from '../utils/pdfGenerator';

// Types
interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
  category: string;
  stock: number;
}

interface OrderItem {
  productId: string;
  productName?: string;
  quantity: number;
  unitPrice?: number;
  totalPrice?: number;
  price?: number;
  product?: {
    id?: string;
    name?: string;
  };
}

interface Order {
  id: string;
  orderNumber?: string;
  customerName?: string;
  customerPhone?: string;
  customerAddress?: string;
  customer?: {
    name?: string;
    phone?: string;
    address?: string;
  };
  orderDate: string;
  deliveryDate: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PARTIAL' | 'PAID';
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
}

interface POSTransaction {
  id: string;
  transactionNumber?: string;
  customerName?: string;
  items?: OrderItem[];
  transactionItems?: OrderItem[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
  transactionDate?: string;
  createdAt?: string;
  date?: string;
  cashierName?: string;
}

const Sales: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const navigate = useNavigate();
  const location = useLocation();
  const queryClient = useQueryClient();

  // State
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [showPOS, setShowPOS] = useState(false);
  const [showEditOrder, setShowEditOrder] = useState(false);
  const [showEditPOS, setShowEditPOS] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [editingPOS, setEditingPOS] = useState<POSTransaction | null>(null);
  const [loading, setLoading] = useState(false);
  const [reportPeriod, setReportPeriod] = useState('today');

  // React Query for data fetching
  const { data: orders = [] } = useQuery({
    queryKey: ['orders', 'today-delivery'],
    queryFn: async () => {
      try {
        console.log('Fetching orders...');

        // Fetch ALL orders first, then filter on frontend for reliability
        const response = await salesAPI.getOrders({
          limit: 100 // Get more orders to ensure we have all data
        });

        console.log('Orders API response:', response);

        // The API returns { data: orders[], pagination: {...} }
        const allOrders = response.data?.data || response.data || [];
        console.log('All orders from API:', allOrders.length, allOrders);

        // Ensure we return an array
        return Array.isArray(allOrders) ? allOrders : [];
      } catch (error) {
        console.error('Orders API error:', error);
        // Orders API not available, using mock data
        const mockData = getMockOrders();
        console.log('Using mock orders data:', mockData.length);
        return Array.isArray(mockData) ? mockData : [];
      }
    },
    enabled: !!localStorage.getItem('accessToken'), // Only run if authenticated
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests
  });

  // Advance Orders Query
  const { data: advanceOrders = [], isLoading: advanceOrdersLoading } = useQuery({
    queryKey: ['advance-orders'],
    queryFn: async () => {
      try {
        // Get today's date in YYYY-MM-DD format
        const today = new Date().toISOString().split('T')[0];

        // Fetch all orders and filter for advance orders (delivery date > today)
        const response = await salesAPI.getOrders({
          limit: 100 // Get more orders to filter
        });

        console.log('Advance orders API response:', response);

        // The API returns { data: orders[], pagination: {...} }
        const allOrders = response.data?.data || response.data || [];

        // Ensure we have an array before filtering
        if (!Array.isArray(allOrders)) {
          console.warn('Advance orders API returned non-array:', allOrders);
          return [];
        }

        return allOrders.filter((order: any) => {
          const orderDeliveryDate = order.deliveryDate ? order.deliveryDate.split('T')[0] : '';
          return orderDeliveryDate > today;
        });
      } catch (error) {
        // Advance Orders API not available, using mock data
        const mockData = getMockOrders();
        if (!Array.isArray(mockData)) {
          console.warn('Mock orders is not an array:', mockData);
          return [];
        }

        return mockData.filter((order: Order) => {
          const today = new Date().toISOString().split('T')[0];
          const orderDeliveryDate = order.deliveryDate ? order.deliveryDate.split('T')[0] : '';
          return orderDeliveryDate > today;
        });
      }
    },
    enabled: !!localStorage.getItem('accessToken'), // Only run if authenticated
    staleTime: 30000, // 30 seconds
  });

  const { data: posTransactions = [] } = useQuery({
    queryKey: ['posTransactions'],
    queryFn: async () => {
      try {
        console.log('Fetching POS transactions...');

        // Fetch ALL POS transactions first, then filter on frontend
        const response = await salesAPI.getPOSTransactions({
          limit: 100 // Get more records
        });

        console.log('POS API response:', response);

        // The API returns { data: transactions[], pagination: {...} }
        const allTransactions = response.data?.data || response.data || [];
        console.log('All POS transactions from API:', allTransactions.length, allTransactions);

        // Ensure we return an array
        return Array.isArray(allTransactions) ? allTransactions : [];
      } catch (error) {
        console.error('POS API error:', error);
        // POS API not available, using mock data
        const mockData = getMockPOS();
        console.log('Using mock POS data:', mockData.length);
        return Array.isArray(mockData) ? mockData : [];
      }
    },
    enabled: !!localStorage.getItem('accessToken'), // Only run if authenticated
    staleTime: 30000, // 30 seconds
    retry: 2, // Retry failed requests
  });

  const { data: products = [] } = useQuery({
    queryKey: ['products'],
    queryFn: async () => {
      try {
        console.log('Fetching products...');
        const response = await salesAPI.getProducts();
        console.log('Products API response:', response);

        // Handle nested response structure
        const productsData = response.data?.data || response.data || [];
        console.log('Products data extracted:', productsData);

        // Ensure we return an array
        return Array.isArray(productsData) ? productsData : [];
      } catch (error) {
        console.error('Products API error:', error);
        // Products API not available, using mock data
        const mockData = getMockProducts();
        console.log('Using mock products data:', mockData);
        return Array.isArray(mockData) ? mockData : [];
      }
    },
    enabled: !!localStorage.getItem('accessToken'), // Only run if authenticated
    staleTime: 300000, // 5 minutes
    retry: 2,
  });

  // Additional client-side filtering to ensure only today's orders are shown
  const todaysOrders = React.useMemo(() => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    console.log('🗓️ Current Date Info:', {
      today: today.toISOString(),
      todayStr,
      localDate: today.toLocaleDateString('en-IN'),
      localTime: today.toLocaleTimeString('en-IN'),
      timezone: Intl.DateTimeFormat().resolvedOptions().timeZone
    });

    // Ensure orders is an array before filtering
    if (!Array.isArray(orders)) {
      console.warn('Orders is not an array:', orders);
      return [];
    }

    // Log all orders for debugging
    console.log('📋 All Orders:', orders.map(order => ({
      id: order.id,
      orderNumber: order.orderNumber,
      deliveryDate: order.deliveryDate,
      customerName: order.customerName || order.customer?.name
    })));

    const filtered = orders.filter((order: any) => {
      if (!order.deliveryDate) return false;

      // Normalize the delivery date to YYYY-MM-DD format
      let orderDeliveryDate = '';
      if (typeof order.deliveryDate === 'string') {
        if (order.deliveryDate.includes('T')) {
          orderDeliveryDate = order.deliveryDate.split('T')[0];
        } else if (order.deliveryDate.includes('/')) {
          // Handle DD/MM/YYYY format from your image
          const parts = order.deliveryDate.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            orderDeliveryDate = `${year}-${month}-${day}`;
          }
        } else {
          orderDeliveryDate = order.deliveryDate;
        }
      } else {
        orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
      }

      const isToday = orderDeliveryDate === todayStr;
      console.log(`📦 Order ${order.orderNumber}: deliveryDate="${orderDeliveryDate}", today="${todayStr}", isToday=${isToday}`);
      return isToday;
    });

    console.log('✅ Today\'s Orders Result:', {
      totalOrders: orders.length,
      filteredOrders: filtered.length,
      todayStr,
      availableDeliveryDates: [...new Set(orders.map(order => {
        if (!order.deliveryDate) return 'null';
        if (typeof order.deliveryDate === 'string' && order.deliveryDate.includes('/')) {
          const parts = order.deliveryDate.split('/');
          if (parts.length === 3) {
            const day = parts[0].padStart(2, '0');
            const month = parts[1].padStart(2, '0');
            const year = parts[2];
            return `${year}-${month}-${day}`;
          }
        }
        return order.deliveryDate.includes('T') ? order.deliveryDate.split('T')[0] : order.deliveryDate;
      }))]
    });

    // If no orders for today, show recent orders (last 7 days) for debugging
    if (filtered.length === 0 && orders.length > 0) {
      console.warn('⚠️ No orders found for today. Showing recent orders instead.');
      const last7Days = new Date();
      last7Days.setDate(last7Days.getDate() - 7);
      const last7DaysStr = last7Days.toISOString().split('T')[0];

      const recentOrders = orders.filter((order: any) => {
        if (!order.deliveryDate) return false;

        let orderDeliveryDate = '';
        if (typeof order.deliveryDate === 'string') {
          if (order.deliveryDate.includes('T')) {
            orderDeliveryDate = order.deliveryDate.split('T')[0];
          } else if (order.deliveryDate.includes('/')) {
            const parts = order.deliveryDate.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              orderDeliveryDate = `${year}-${month}-${day}`;
            }
          } else {
            orderDeliveryDate = order.deliveryDate;
          }
        } else {
          orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
        }

        return orderDeliveryDate >= last7DaysStr;
      });

      console.log('📅 Showing recent orders (last 7 days):', recentOrders.length);
      return recentOrders;
    }

    return filtered;
  }, [orders]);

  // Additional client-side filtering to ensure only today's POS transactions are shown
  const todaysPOSTransactions = React.useMemo(() => {
    const today = new Date().toISOString().split('T')[0];

    // Ensure posTransactions is an array before filtering
    if (!Array.isArray(posTransactions)) {
      console.warn('POS Transactions is not an array:', posTransactions);
      return [];
    }

    return posTransactions.filter((transaction: any) => {
      if (!transaction.transactionDate && !transaction.createdAt) return false;

      // Normalize the transaction date to YYYY-MM-DD format
      let transactionDate = '';
      if (transaction.transactionDate) {
        if (typeof transaction.transactionDate === 'string') {
          if (transaction.transactionDate.includes('T')) {
            transactionDate = transaction.transactionDate.split('T')[0];
          } else if (transaction.transactionDate.includes('/')) {
            // Handle DD/MM/YYYY format
            const parts = transaction.transactionDate.split('/');
            if (parts.length === 3) {
              const day = parts[0].padStart(2, '0');
              const month = parts[1].padStart(2, '0');
              const year = parts[2];
              transactionDate = `${year}-${month}-${day}`;
            }
          } else {
            transactionDate = transaction.transactionDate;
          }
        } else {
          transactionDate = new Date(transaction.transactionDate).toISOString().split('T')[0];
        }
      } else if (transaction.createdAt) {
        transactionDate = new Date(transaction.createdAt).toISOString().split('T')[0];
      }

      const isToday = transactionDate === today;
      if (import.meta.env.DEV) {
        console.log(`POS Transaction ${transaction.id || transaction.transactionNumber}: transactionDate="${transactionDate}", today="${today}", isToday=${isToday}`);
      }
      return isToday;
    });
  }, [posTransactions]);

  // Sales Reports Query
  const { data: salesReportData, isLoading: salesReportLoading } = useQuery({
    queryKey: ['sales-report', reportPeriod],
    queryFn: async () => {
      try {
        // Calculate date range based on period
        const today = new Date();
        let startDate = '';
        let endDate = today.toISOString().split('T')[0];

        switch (reportPeriod) {
          case 'today':
            startDate = endDate;
            break;
          case 'yesterday':
            const yesterday = new Date(today);
            yesterday.setDate(yesterday.getDate() - 1);
            startDate = endDate = yesterday.toISOString().split('T')[0];
            break;
          case 'this-week':
            const weekStart = new Date(today);
            weekStart.setDate(today.getDate() - today.getDay());
            startDate = weekStart.toISOString().split('T')[0];
            break;
          case 'this-month':
            startDate = new Date(today.getFullYear(), today.getMonth(), 1).toISOString().split('T')[0];
            break;
          case 'last-month':
            const lastMonth = new Date(today.getFullYear(), today.getMonth() - 1, 1);
            const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
            startDate = lastMonth.toISOString().split('T')[0];
            endDate = lastMonthEnd.toISOString().split('T')[0];
            break;
          default:
            startDate = endDate;
        }

        const response = await reportsAPI.getSalesReport({
          startDate,
          endDate
        });
        return response.data || null;
      } catch (error) {
        // Fallback to local data calculation
        const ordersTotal = todaysOrders.reduce((sum: number, order: any) => sum + (parseFloat(order?.totalAmount) || 0), 0);
        const posTotal = todaysPOSTransactions.reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0);
        const ordersCount = todaysOrders.length;
        const posCount = todaysPOSTransactions.length;

        return {
          summary: {
            totalSales: ordersTotal, // Only orders revenue for Total Sales
            totalOrders: ordersCount, // Only orders count for Total Orders
            averageOrderValue: ordersCount > 0 ? Math.round(ordersTotal / ordersCount) : 0, // Only orders average
          },
          ordersRevenue: ordersTotal,
          posRevenue: posTotal,
          ordersCount: ordersCount,
          posCount: posCount,
          period: reportPeriod
        };
      }
    },
    enabled: !!localStorage.getItem('accessToken'),
    staleTime: 30000, // 30 seconds
  });

  // const isDataLoading = ordersLoading || posLoading || productsLoading || advanceOrdersLoading;

  // Form states
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0], // Today
    deliveryDate: new Date().toISOString().split('T')[0], // Today (changed from tomorrow)
    items: [] as { productId: string; quantity: number }[]
  });

  const [posForm, setPosForm] = useState({
    customerName: '',
    transactionDate: new Date().toISOString().split('T')[0], // Today
    items: [] as { productId: string; quantity: number }[],
    paymentMethod: 'CASH' as POSTransaction['paymentMethod'],
    cashierName: user?.firstName + ' ' + user?.lastName || 'Store Manager'
  });

  // Mock data functions
  const getMockProducts = (): Product[] => [
    { id: '1', name: 'Plain Roti', price: 5, unit: 'piece', category: 'Roti', stock: 1000 },
    { id: '2', name: 'Butter Roti', price: 8, unit: 'piece', category: 'Roti', stock: 800 },
    { id: '3', name: 'Wheat Roti', price: 6, unit: 'piece', category: 'Roti', stock: 900 },
    { id: '4', name: 'Multigrain Roti', price: 10, unit: 'piece', category: 'Roti', stock: 500 },
    { id: '5', name: 'Stuffed Paratha', price: 25, unit: 'piece', category: 'Paratha', stock: 300 }
  ];

  const getMockOrders = (): Order[] => [
    {
      id: '1',
      orderNumber: 'ORD-001',
      customerName: 'Rajesh Kumar',
      customerPhone: '+91 9876543210',
      customerAddress: '123 Main Street, Delhi',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0], // Today's delivery
      items: [
        { productId: '1', productName: 'Plain Roti', quantity: 50, unitPrice: 5, totalPrice: 250 },
        { productId: '2', productName: 'Butter Roti', quantity: 20, unitPrice: 8, totalPrice: 160 }
      ],
      totalAmount: 410,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH'
    },
    {
      id: '2',
      orderNumber: 'ORD-002',
      customerName: 'Priya Sharma',
      customerPhone: '+91 9876543211',
      customerAddress: '456 Park Avenue, Mumbai',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0], // Today's delivery
      items: [
        { productId: '1', productName: 'Plain Roti', quantity: 30, unitPrice: 5, totalPrice: 150 },
        { productId: '3', productName: 'Wheat Roti', quantity: 25, unitPrice: 6, totalPrice: 150 }
      ],
      totalAmount: 300,
      status: 'CONFIRMED',
      paymentStatus: 'PAID',
      paymentMethod: 'UPI'
    },
    {
      id: '3',
      orderNumber: 'ORD-003',
      customerName: 'Amit Singh',
      customerPhone: '+91 9876543212',
      customerAddress: '789 Central Road, Bangalore',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date().toISOString().split('T')[0], // Today's delivery
      items: [
        { productId: '2', productName: 'Butter Roti', quantity: 40, unitPrice: 8, totalPrice: 320 },
        { productId: '5', productName: 'Stuffed Paratha', quantity: 10, unitPrice: 25, totalPrice: 250 }
      ],
      totalAmount: 570,
      status: 'PREPARING',
      paymentStatus: 'PAID',
      paymentMethod: 'CASH'
    },
    {
      id: '4',
      orderNumber: 'ORD-004',
      customerName: 'Sunita Patel',
      customerPhone: '+91 9876543213',
      customerAddress: '321 Garden Street, Pune',
      orderDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
      deliveryDate: new Date().toISOString().split('T')[0], // Today's delivery
      items: [
        { productId: '4', productName: 'Multigrain Roti', quantity: 35, unitPrice: 10, totalPrice: 350 }
      ],
      totalAmount: 350,
      status: 'READY',
      paymentStatus: 'PAID',
      paymentMethod: 'CARD'
    },
    {
      id: '5',
      orderNumber: 'ORD-005',
      customerName: 'Vikram Gupta',
      customerPhone: '+91 9876543214',
      customerAddress: '654 Market Square, Chennai',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow (advance order)
      items: [
        { productId: '1', productName: 'Plain Roti', quantity: 100, unitPrice: 5, totalPrice: 500 },
        { productId: '2', productName: 'Butter Roti', quantity: 50, unitPrice: 8, totalPrice: 400 }
      ],
      totalAmount: 900,
      status: 'PENDING',
      paymentStatus: 'PENDING',
      paymentMethod: 'CASH'
    }
  ];

  const getMockPOS = (): POSTransaction[] => [
    {
      id: '1',
      transactionNumber: 'POS-001',
      customerName: 'Walk-in Customer',
      items: [
        { productId: '1', productName: 'Plain Roti', quantity: 10, unitPrice: 5, totalPrice: 50 }
      ],
      totalAmount: 50,
      paymentMethod: 'CASH',
      transactionDate: new Date().toISOString().split('T')[0],
      cashierName: 'Store Manager'
    }
  ];

  // Add item functions
  const addItemToOrder = () => {
    const firstProduct = products && Array.isArray(products) && products.length > 0 ? products[0] : null;
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: firstProduct?.id || '', quantity: 1 }]
    }));
  };

  const addItemToPOS = () => {
    const firstProduct = products && Array.isArray(products) && products.length > 0 ? products[0] : null;
    setPosForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: firstProduct?.id || '', quantity: 1 }]
    }));
  };

  // Update item functions
  const updateOrderItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const updatePOSItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setPosForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  // Remove item functions
  const removeOrderItem = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const removePOSItem = (index: number) => {
    setPosForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  // Export PDF function
  const handleExportPDF = () => {
    try {
      const ordersRevenue = salesReportData?.ordersRevenue ||
        todaysOrders.reduce((sum: number, order: any) => sum + (parseFloat(order?.totalAmount) || 0), 0);
      const ordersCount = salesReportData?.ordersCount || todaysOrders.length;
      const posRevenue = salesReportData?.posRevenue ||
        todaysPOSTransactions.reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0);

      const pdfData = {
        totalOrders: ordersCount,
        totalRevenue: ordersRevenue, // Only orders revenue for Total Sales
        avgOrderValue: ordersCount > 0 ? Math.round(ordersRevenue / ordersCount) : 0, // Only orders average
        posRevenue: posRevenue
      };

      generateSalesReportPDF(pdfData, reportPeriod);
      toast.success('PDF exported successfully!');
    } catch (error) {
      console.error('PDF export error:', error);
      toast.error('Failed to export PDF');
    }
  };

  // Handle form submissions
  const handleAddOrder = async () => {
    try {

      if (!orderForm.customerName.trim() || !orderForm.customerPhone.trim() || orderForm.items.length === 0) {
        toast.error('Please fill all required fields and add at least one item');
        return;
      }

      // Check for duplicate orders (same customer phone and delivery date)
      const existingOrder = todaysOrders.find((order: any) =>
        order.customerPhone === orderForm.customerPhone.trim() &&
        order.deliveryDate === orderForm.deliveryDate
      );

      if (existingOrder) {
        toast.error(`Order already exists for ${orderForm.customerName} on ${new Date(orderForm.deliveryDate).toLocaleDateString('en-IN')}. Order #${existingOrder.orderNumber}`);
        return;
      }

      // Prepare items for API (server expects 'price' field, not 'unitPrice')
      const apiItems = orderForm.items.map(item => {
        const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product?.price || 0  // Server expects 'price' field
        };
      });

      const orderData = {
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        customerAddress: orderForm.customerAddress.trim(),
        orderDate: orderForm.orderDate,
        deliveryDate: orderForm.deliveryDate,
        items: apiItems  // Use API-compatible format
      };

      try {
        // Try to save to database via API
        await salesAPI.createOrder(orderData);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('Order saved to database successfully!');
      } catch (apiError) {
        // API not available
        toast.error('Failed to save order to database. Please try again.');
      }

      // Reset form
      setOrderForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date().toISOString().split('T')[0], // Today by default
        items: []
      });

      setShowAddOrder(false);
    } catch (error) {
      toast.error('Failed to create order');
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error('Error creating order:', error);
      }
    }
  };

  const handleAddPOSSale = async () => {
    try {

      if (posForm.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Check for duplicate POS transactions (same customer and items on same day)
      const today = new Date().toISOString().split('T')[0];
      const customerName = posForm.customerName.trim() || 'Walk-in Customer';

      const existingTransaction = todaysPOSTransactions.find((transaction: any) => {
        const transactionDate = new Date(transaction.createdAt || transaction.date || transaction.transactionDate).toISOString().split('T')[0];
        const transactionItems = transaction.items || transaction.transactionItems || [];
        return transaction.customerName === customerName &&
               transactionDate === today &&
               transactionItems.length === posForm.items.length &&
               transactionItems.every((item: any, index: number) =>
                 item.productId === posForm.items[index]?.productId &&
                 item.quantity === posForm.items[index]?.quantity
               );
      });

      if (existingTransaction) {
        toast.error(`Similar POS transaction already exists for ${customerName} today. Transaction #${existingTransaction.transactionNumber || existingTransaction.id}`);
        return;
      }

      // Prepare items for API (server expects 'price' field, not 'unitPrice')
      const apiItems = posForm.items.map(item => {
        const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product?.price || 0  // Server expects 'price' field
        };
      });

      const transactionData = {
        customerName: customerName,
        transactionDate: posForm.transactionDate,
        items: apiItems,  // Use API-compatible format
        paymentMethod: posForm.paymentMethod,
        cashierName: posForm.cashierName
      };

      try {
        // Try to save to database via API
        await salesAPI.createPOSTransaction(transactionData);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['posTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('Sale saved to database successfully!');
      } catch (apiError) {
        // API not available
        toast.error('Failed to save transaction to database. Please try again.');
      }

      // Reset form
      setPosForm({
        customerName: '',
        transactionDate: new Date().toISOString().split('T')[0], // Today
        items: [],
        paymentMethod: 'CASH',
        cashierName: user?.firstName + ' ' + user?.lastName || 'Store Manager'
      });

      setShowPOS(false);
    } catch (error) {
      toast.error('Failed to complete sale');
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error('Error completing sale:', error);
      }
    }
  };

  // Edit functions
  const handleEditOrder = (order: Order) => {
    setEditingOrder(order);

    // Handle both API response format and local format
    const customerName = order.customerName || order.customer?.name || '';
    const customerPhone = order.customerPhone || order.customer?.phone || '';
    const customerAddress = order.customerAddress || order.customer?.address || '';
    const orderDate = order.orderDate ? order.orderDate.split('T')[0] : new Date().toISOString().split('T')[0];
    const deliveryDate = order.deliveryDate ? order.deliveryDate.split('T')[0] : new Date().toISOString().split('T')[0];

    setOrderForm({
      customerName,
      customerPhone,
      customerAddress,
      orderDate,
      deliveryDate,
      items: order.items.map(item => ({
        productId: item.productId || item.product?.id || '',
        quantity: item.quantity
      }))
    });
    setShowEditOrder(true);
  };

  const handleUpdateOrder = async () => {
    if (!editingOrder) return;

    setLoading(true);
    try {
      // Calculate total amount
      const totalAmount = orderForm.items.reduce((sum, item) => {
        const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
        return sum + (product ? product.price * item.quantity : 0);
      }, 0);

      // Prepare update data
      const updateData = {
        customerName: orderForm.customerName,
        customerPhone: orderForm.customerPhone,
        customerAddress: orderForm.customerAddress,
        orderDate: orderForm.orderDate,
        deliveryDate: orderForm.deliveryDate,
        items: orderForm.items.map(item => {
          const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
          return {
            productId: item.productId,
            quantity: item.quantity,
            price: product?.price || 0
          };
        }),
        totalAmount
      };

      try {
        // Try to update in database via API
        await salesAPI.updateOrder(editingOrder.id, updateData as any);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('Order updated successfully!');
      } catch (apiError) {
        // API not available
        toast.error('Failed to update order. Please try again.');
      }

      // Reset form and close modal
      setOrderForm({
        customerName: '',
        customerPhone: '',
        customerAddress: '',
        orderDate: new Date().toISOString().split('T')[0], // Today
        deliveryDate: new Date().toISOString().split('T')[0], // Today
        items: []
      });
      setEditingOrder(null);
      setShowEditOrder(false);
    } catch (error) {
      toast.error('Failed to update order');
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error('Error updating order:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // POS Edit functions
  const handleEditPOS = (transaction: POSTransaction) => {
    setEditingPOS(transaction);

    // Populate form with transaction data
    setPosForm({
      customerName: transaction.customerName || '',
      transactionDate: transaction.transactionDate ? transaction.transactionDate.split('T')[0] : new Date().toISOString().split('T')[0],
      items: transaction.items?.map(item => ({
        productId: item.productId,
        quantity: item.quantity
      })) || [],
      paymentMethod: transaction.paymentMethod || 'CASH',
      cashierName: transaction.cashierName || user?.firstName + ' ' + user?.lastName || 'Store Manager'
    });

    setShowEditPOS(true);
  };

  const handleUpdatePOS = async () => {
    if (!editingPOS) return;

    try {
      setLoading(true);

      if (posForm.items.length === 0) {
        toast.error('Please add at least one item');
        return;
      }

      // Prepare items for API
      const apiItems = posForm.items.map(item => {
        const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
        return {
          productId: item.productId,
          quantity: item.quantity,
          price: product?.price || 0
        };
      });

      const updateData = {
        customerName: posForm.customerName.trim() || undefined,
        transactionDate: posForm.transactionDate,
        items: apiItems,
        paymentMethod: posForm.paymentMethod,
        cashierName: posForm.cashierName
      };

      try {
        // Try to update in database via API
        await salesAPI.updatePOSTransaction(editingPOS.id, updateData);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['posTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('POS transaction updated successfully!');
      } catch (apiError) {
        // API not available
        toast.error('Failed to update transaction. Please try again.');
      }

      // Reset form and close modal
      setPosForm({
        customerName: '',
        transactionDate: new Date().toISOString().split('T')[0], // Today
        items: [],
        paymentMethod: 'CASH',
        cashierName: user?.firstName + ' ' + user?.lastName || 'Store Manager'
      });
      setEditingPOS(null);
      setShowEditPOS(false);
    } catch (error) {
      toast.error('Failed to update transaction');
      // Log error for debugging
      if (import.meta.env.DEV) {
        console.error('Error updating transaction:', error);
      }
    } finally {
      setLoading(false);
    }
  };

  // Delete functions
  const handleDeleteOrder = async (orderId: string) => {
    if (window.confirm('Are you sure you want to delete this order?')) {
      try {
        // Try to delete from database via API
        await salesAPI.deleteOrder(orderId);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['orders'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('Order deleted from database successfully');
      } catch (apiError) {
        // API not available, deleting locally
        toast.success('Order deleted successfully (local only)');
      }
    }
  };

  const handleDeletePOS = async (transactionId: string) => {
    if (window.confirm('Are you sure you want to delete this transaction?')) {
      try {
        // Try to delete from database via API
        await salesAPI.deletePOSTransaction(transactionId);

        // Invalidate and refetch queries to update all related data
        queryClient.invalidateQueries({ queryKey: ['posTransactions'] });
        queryClient.invalidateQueries({ queryKey: ['dashboard'] });

        toast.success('Transaction deleted from database successfully');
      } catch (apiError) {
        // API not available, deleting locally
        toast.success('Transaction deleted successfully (local only)');
      }
    }
  };

  return (
    <div className="p-6">
      {/* Navigation Tabs */}
      <div className="mb-6">
        <nav className="flex space-x-8">
          <button
            onClick={() => navigate('/sales/orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/sales/orders' || location.pathname === '/sales'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Orders
          </button>
          <button
            onClick={() => navigate('/sales/advance-orders')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/sales/advance-orders'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Advance Orders
          </button>
          <button
            onClick={() => navigate('/sales/pos')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/sales/pos'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Point of Sale
          </button>
          <button
            onClick={() => navigate('/sales/reports')}
            className={`py-2 px-1 border-b-2 font-medium text-sm ${
              location.pathname === '/sales/reports'
                ? 'border-green-500 text-green-600'
                : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
            }`}
          >
            Reports
          </button>
        </nav>
      </div>

      {/* Routes */}
      <Routes>
        <Route path="/" element={<Navigate to="/sales/orders" replace />} />
        <Route path="/orders" element={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Orders</h2>
                <p className="text-gray-600">Manage customer orders and deliveries</p>
              </div>
              <button
                onClick={() => setShowAddOrder(true)}
                className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Order</span>
              </button>
            </div>

            {/* Orders Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">
                  {todaysOrders.length > 0 && orders.length > 0 &&
                   todaysOrders.length === orders.filter((order: any) => {
                     if (!order.deliveryDate) return false;
                     const today = new Date().toISOString().split('T')[0];
                     let orderDeliveryDate = '';
                     if (typeof order.deliveryDate === 'string') {
                       if (order.deliveryDate.includes('T')) {
                         orderDeliveryDate = order.deliveryDate.split('T')[0];
                       } else if (order.deliveryDate.includes('/')) {
                         const parts = order.deliveryDate.split('/');
                         if (parts.length === 3) {
                           const day = parts[0].padStart(2, '0');
                           const month = parts[1].padStart(2, '0');
                           const year = parts[2];
                           orderDeliveryDate = `${year}-${month}-${day}`;
                         }
                       } else {
                         orderDeliveryDate = order.deliveryDate;
                       }
                     } else {
                       orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
                     }
                     return orderDeliveryDate === today;
                   }).length
                   ? "Today's Orders"
                   : "Recent Orders (Last 7 Days)"}
                </h3>
                <p className="text-sm text-gray-600 mt-1">
                  {todaysOrders.length > 0 && orders.length > 0 &&
                   todaysOrders.length === orders.filter((order: any) => {
                     if (!order.deliveryDate) return false;
                     const today = new Date().toISOString().split('T')[0];
                     let orderDeliveryDate = '';
                     if (typeof order.deliveryDate === 'string') {
                       if (order.deliveryDate.includes('T')) {
                         orderDeliveryDate = order.deliveryDate.split('T')[0];
                       } else if (order.deliveryDate.includes('/')) {
                         const parts = order.deliveryDate.split('/');
                         if (parts.length === 3) {
                           const day = parts[0].padStart(2, '0');
                           const month = parts[1].padStart(2, '0');
                           const year = parts[2];
                           orderDeliveryDate = `${year}-${month}-${day}`;
                         }
                       } else {
                         orderDeliveryDate = order.deliveryDate;
                       }
                     } else {
                       orderDeliveryDate = new Date(order.deliveryDate).toISOString().split('T')[0];
                     }
                     return orderDeliveryDate === today;
                   }).length
                   ? `Orders scheduled for delivery today (${new Date().toLocaleDateString('en-IN')})`
                   : `No orders for today. Showing recent orders instead. Current date: ${new Date().toLocaleDateString('en-IN')}`}
                </p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Order #</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Customer</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Order Date</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Delivery Date</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Items</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                      {permissions.isSuperAdmin() && (
                        <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {todaysOrders && Array.isArray(todaysOrders) ? todaysOrders.map((order, index) => (
                      <tr key={order?.id || `order-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">{order?.orderNumber || 'N/A'}</td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{order?.customer?.name || order?.customerName || 'Unknown Customer'}</div>
                            <div className="text-sm text-gray-500">{order?.customer?.phone || order?.customerPhone || 'N/A'}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {order?.orderDate ? new Date(order.orderDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-sm text-gray-600">
                          {order?.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString('en-IN') : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            {order?.items && Array.isArray(order.items) && order.items.length > 0 ? order.items.map((item: any, index: number) => (
                              <div key={`item-${index}`} className="text-gray-600">
                                {item?.product?.name || item?.productName || 'Unknown Product'} × {item?.quantity || 0}
                              </div>
                            )) : (
                              <div className="text-gray-500">No items</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-900">₹{(order?.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-6 text-center">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order?.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order?.status === 'READY' ? 'bg-blue-100 text-blue-800' :
                            order?.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                            order?.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-800' :
                            order?.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order?.status || 'PENDING'}
                          </span>
                        </td>
                        {permissions.isSuperAdmin() && (
                          <td className="py-4 px-6 text-center">
                            <ActionButtons
                              onEdit={() => handleEditOrder(order)}
                              onDelete={() => handleDeleteOrder(order?.id)}
                              canEdit={permissions.canEdit('SALES')}
                              canDelete={permissions.canDelete('SALES')}
                              size="sm"
                              variant="minimal"
                            />
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={permissions.isSuperAdmin() ? 8 : 7} className="py-8 text-center text-gray-500">
                          No orders found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        <Route path="/advance-orders" element={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Advance Orders</h2>
                <p className="text-gray-600">Manage advance orders for future delivery</p>
              </div>
              <button
                onClick={() => setShowAddOrder(true)}
                className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                </svg>
                <span>Add Advance Order</span>
              </button>
            </div>

            {/* Advance Orders Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Advance Orders</h3>
                <p className="text-sm text-gray-500 mt-1">Orders scheduled for future delivery dates</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Order #</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Customer</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Order Date</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Delivery Date</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Items</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                      <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                      {permissions.isSuperAdmin() && (
                        <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {advanceOrdersLoading ? (
                      <tr>
                        <td colSpan={permissions.isSuperAdmin() ? 8 : 7} className="py-8 text-center text-gray-500">
                          Loading advance orders...
                        </td>
                      </tr>
                    ) : Array.isArray(advanceOrders) && advanceOrders.length > 0 ? advanceOrders.map((order: any) => (
                      <tr key={order.id} className="border-b border-gray-200 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">{order.orderNumber || order.id}</td>
                        <td className="py-4 px-6">
                          <div>
                            <div className="font-medium text-gray-900">{order.customer?.name || order.customerName}</div>
                            <div className="text-sm text-gray-500">{order.customer?.phone || order.customerPhone}</div>
                          </div>
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {order.orderDate ? new Date(order.orderDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6 text-gray-600">
                          {order.deliveryDate ? new Date(order.deliveryDate).toLocaleDateString() : 'N/A'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            {Array.isArray(order.items) && order.items.length > 0 ? order.items.map((item: any, idx: number) => (
                              <div key={idx} className="text-gray-600">
                                {item.product?.name || item.productName} × {item.quantity}
                              </div>
                            )) : 'No items'}
                          </div>
                        </td>
                        <td className="py-4 px-6 font-semibold text-gray-900">
                          ₹{order.totalAmount || order.items?.reduce((sum: number, item: any) => sum + (item.quantity * (item.price || item.unitPrice || 0)), 0) || 0}
                        </td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex px-2 py-1 text-xs font-semibold rounded-full ${
                            order.status === 'PENDING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'CONFIRMED' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PREPARING' ? 'bg-orange-100 text-orange-800' :
                            order.status === 'READY' ? 'bg-green-100 text-green-800' :
                            order.status === 'DELIVERED' ? 'bg-gray-100 text-gray-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.status || 'PENDING'}
                          </span>
                        </td>
                        {permissions.isSuperAdmin() && (
                          <td className="py-4 px-6">
                            <ActionButtons
                              onEdit={() => handleEditOrder(order)}
                              onDelete={() => handleDeleteOrder(order?.id)}
                              canEdit={permissions.canEdit('SALES')}
                              canDelete={permissions.canDelete('SALES')}
                              size="sm"
                              variant="minimal"
                            />
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={permissions.isSuperAdmin() ? 8 : 7} className="py-12 text-center text-gray-500">
                          <div className="flex flex-col items-center space-y-3">
                            <svg className="w-12 h-12 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                            </svg>
                            <div>
                              <p className="text-lg font-medium text-gray-900">No advance orders found</p>
                              <p className="text-gray-500">Advance orders will appear here when created</p>
                            </div>
                          </div>
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        <Route path="/pos" element={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Point of Sale</h2>
                <p className="text-gray-600">Direct sales from factory to customers</p>
              </div>
              <button
                onClick={() => setShowPOS(true)}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                </svg>
                <span>New Sale</span>
              </button>
            </div>

            {/* POS Transactions Table */}
            <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
              <div className="px-6 py-4 border-b border-gray-200">
                <h3 className="text-lg font-semibold text-gray-900">Today's POS Transactions</h3>
                <p className="text-sm text-gray-600 mt-1">Point of Sale transactions for today</p>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Transaction #</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Customer</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Items</th>
                      <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                      <th className="text-left py-3 px-6 font-semibold text-gray-900">Payment</th>
                      {permissions.isSuperAdmin() && (
                        <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                      )}
                    </tr>
                  </thead>
                  <tbody>
                    {todaysPOSTransactions && Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.map((transaction, index) => (
                      <tr key={transaction?.id || `pos-transaction-${index}`} className="border-b border-gray-100 hover:bg-gray-50">
                        <td className="py-4 px-6 font-medium text-gray-900">{transaction?.transactionNumber || 'N/A'}</td>
                        <td className="py-4 px-6 text-gray-600">
                          {transaction?.customerName || 'Walk-in Customer'}
                        </td>
                        <td className="py-4 px-6">
                          <div className="text-sm">
                            {transaction?.transactionItems && Array.isArray(transaction.transactionItems) && transaction.transactionItems.length > 0 ? transaction.transactionItems.map((item: any, index: number) => (
                              <div key={`transaction-item-${index}`} className="text-gray-600">
                                {item?.product?.name || item?.productName || 'Unknown Product'} × {item?.quantity || 0}
                              </div>
                            )) : transaction?.items && Array.isArray(transaction.items) && transaction.items.length > 0 ? transaction.items.map((item: any, index: number) => (
                              <div key={`item-${index}`} className="text-gray-600">
                                {item?.product?.name || item?.productName || 'Unknown Product'} × {item?.quantity || 0}
                              </div>
                            )) : (
                              <div className="text-gray-500">No items</div>
                            )}
                          </div>
                        </td>
                        <td className="py-4 px-6 text-right font-medium text-gray-900">₹{(transaction?.totalAmount || 0).toLocaleString()}</td>
                        <td className="py-4 px-6">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            transaction?.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                            transaction?.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-800' :
                            'bg-purple-100 text-purple-800'
                          }`}>
                            {transaction?.paymentMethod || 'CASH'}
                          </span>
                        </td>
                        {permissions.isSuperAdmin() && (
                          <td className="py-4 px-6 text-center">
                            <ActionButtons
                              onEdit={() => handleEditPOS(transaction)}
                              onDelete={() => handleDeletePOS(transaction?.id)}
                              canEdit={permissions.canEdit('SALES')}
                              canDelete={permissions.canDelete('SALES')}
                              size="sm"
                              variant="minimal"
                            />
                          </td>
                        )}
                      </tr>
                    )) : (
                      <tr>
                        <td colSpan={permissions.isSuperAdmin() ? 6 : 5} className="py-8 text-center text-gray-500">
                          No transactions found
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        } />
        <Route path="/reports" element={
          <div className="space-y-6">
            <div className="flex items-center justify-between">
              <div>
                <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
                <p className="text-gray-600">Comprehensive sales analytics and insights</p>
              </div>
              <div className="flex space-x-3">
                <select
                  value={reportPeriod}
                  onChange={(e) => setReportPeriod(e.target.value)}
                  className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="today">Today</option>
                  <option value="yesterday">Yesterday</option>
                  <option value="this-week">This Week</option>
                  <option value="this-month">This Month</option>
                  <option value="last-month">Last Month</option>
                  <option value="custom">Custom Range</option>
                </select>
                <button
                  onClick={handleExportPDF}
                  disabled={salesReportLoading}
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2 disabled:opacity-50"
                >
                  <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <span>{salesReportLoading ? 'Loading...' : 'Export PDF'}</span>
                </button>
              </div>
            </div>

            {/* Summary Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesReportLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        `₹${(salesReportData?.ordersRevenue ||
                          todaysOrders.reduce((sum: number, order: any) => sum + (parseFloat(order?.totalAmount) || 0), 0)
                        ).toLocaleString('en-IN')}`
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Total Orders</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesReportLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        (salesReportData?.ordersCount || todaysOrders.length).toLocaleString('en-IN')
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">Average Order Value</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesReportLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        `₹${(() => {
                          // Calculate average order value for ORDERS only (not POS)
                          const ordersRevenue = salesReportData?.ordersRevenue ||
                            todaysOrders.reduce((sum: number, order: any) => sum + (parseFloat(order?.totalAmount) || 0), 0);
                          const ordersCount = salesReportData?.ordersCount || todaysOrders.length;

                          if (ordersCount === 0) return '0';
                          return Math.round(ordersRevenue / ordersCount).toLocaleString('en-IN');
                        })()}`
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                    </svg>
                  </div>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">POS Sales</p>
                    <p className="text-2xl font-bold text-gray-900">
                      {salesReportLoading ? (
                        <span className="text-gray-400">Loading...</span>
                      ) : (
                        `₹${(salesReportData?.posRevenue ||
                          todaysPOSTransactions.reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0)
                        ).toLocaleString('en-IN')}`
                      )}
                    </p>
                  </div>
                  <div className="p-3 bg-orange-100 rounded-full">
                    <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                    </svg>
                  </div>
                </div>
              </div>
            </div>

            {/* Sales Breakdown */}
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              {/* Orders vs POS */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Sales Breakdown</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Orders</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(salesReportData?.ordersRevenue ||
                          todaysOrders.reduce((sum: number, order: any) => sum + (parseFloat(order?.totalAmount) || 0), 0)
                        ).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(salesReportData?.ordersCount || todaysOrders.length).toLocaleString('en-IN')} orders
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-gray-700">Point of Sale</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">
                        ₹{(salesReportData?.posRevenue ||
                          todaysPOSTransactions.reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0)
                        ).toLocaleString('en-IN')}
                      </p>
                      <p className="text-sm text-gray-500">
                        {(salesReportData?.posCount || todaysPOSTransactions.length).toLocaleString('en-IN')} transactions
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Payment Methods */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
                <h3 className="text-lg font-semibold text-gray-900 mb-4">Payment Methods</h3>
                <div className="space-y-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-green-500 rounded"></div>
                      <span className="text-gray-700">Cash</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'CASH').reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0) : 0).toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-500">{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'CASH').length : 0).toLocaleString('en-IN')} transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-blue-500 rounded"></div>
                      <span className="text-gray-700">Card</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'CARD').reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0) : 0).toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-500">{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'CARD').length : 0).toLocaleString('en-IN')} transactions</p>
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-4 h-4 bg-purple-500 rounded"></div>
                      <span className="text-gray-700">UPI</span>
                    </div>
                    <div className="text-right">
                      <p className="font-semibold text-gray-900">₹{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'UPI').reduce((sum: number, transaction: any) => sum + (parseFloat(transaction?.totalAmount) || 0), 0) : 0).toLocaleString('en-IN')}</p>
                      <p className="text-sm text-gray-500">{(Array.isArray(todaysPOSTransactions) ? todaysPOSTransactions.filter((t: any) => t?.paymentMethod === 'UPI').length : 0).toLocaleString('en-IN')} transactions</p>
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        } />
      </Routes>

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New Order</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddOrder(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={orderForm.customerPhone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={orderForm.orderDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={orderForm.deliveryDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min={orderForm.orderDate}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Enter delivery address"
                />
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Order Items *</label>
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.productId}
                        onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Product</option>
                        {Array.isArray(products) && products.length > 0 ? products.map((product, productIndex) => (
                          <option key={product?.id || `product-${productIndex}`} value={product?.id || ''}>
                            {product?.name || 'Unknown Product'} - ₹{product?.price || 0}/{product?.unit || 'unit'}
                          </option>
                        )) : (
                          <option value="" disabled>No products available</option>
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Qty"
                        min="1"
                      />
                      <span className="w-20 text-sm text-gray-600">
                        ₹{(products && Array.isArray(products) ? (products.find(p => p?.id === item.productId)?.price || 0) : 0) * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {orderForm.items.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-900">Total Amount:</span>
                      <span className="text-lg font-bold text-green-700">
                        ₹{orderForm.items.reduce((sum, item) => {
                          const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
                          return sum + (product ? product.price * item.quantity : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddOrder(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Creating...' : 'Create Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit Order Modal */}
      {showEditOrder && editingOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit Order #{editingOrder.orderNumber}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdateOrder(); }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name *</label>
                  <input
                    type="text"
                    value={orderForm.customerName}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, customerName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter customer name"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Phone Number *</label>
                  <input
                    type="tel"
                    value={orderForm.customerPhone}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, customerPhone: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    placeholder="Enter phone number"
                    required
                  />
                </div>
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Order Date *</label>
                  <input
                    type="date"
                    value={orderForm.orderDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, orderDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Delivery Date *</label>
                  <input
                    type="date"
                    value={orderForm.deliveryDate}
                    onChange={(e) => setOrderForm(prev => ({ ...prev, deliveryDate: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    min={orderForm.orderDate}
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
                <textarea
                  value={orderForm.customerAddress}
                  onChange={(e) => setOrderForm(prev => ({ ...prev, customerAddress: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  rows={3}
                  placeholder="Enter delivery address"
                />
              </div>

              {/* Order Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Order Items *</label>
                  <button
                    type="button"
                    onClick={addItemToOrder}
                    className="text-green-600 hover:text-green-800 text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {orderForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.productId}
                        onChange={(e) => updateOrderItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                      >
                        <option value="">Select Product</option>
                        {Array.isArray(products) && products.length > 0 ? products.map((product, productIndex) => (
                          <option key={product?.id || `edit-product-${productIndex}`} value={product?.id || ''}>
                            {product?.name || 'Unknown Product'} - ₹{product?.price || 0}/{product?.unit || 'unit'}
                          </option>
                        )) : (
                          <option value="" disabled>No products available</option>
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updateOrderItem(index, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                        placeholder="Qty"
                        min="1"
                      />
                      <span className="w-20 text-sm text-gray-600">
                        ₹{(products && Array.isArray(products) ? (products.find(p => p?.id === item.productId)?.price || 0) : 0) * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removeOrderItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {orderForm.items.length > 0 && (
                  <div className="mt-3 p-3 bg-green-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-green-900">Total Amount:</span>
                      <span className="text-lg font-bold text-green-700">
                        ₹{orderForm.items.reduce((sum, item) => {
                          const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
                          return sum + (product ? product.price * item.quantity : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditOrder(false);
                    setEditingOrder(null);
                    setOrderForm({
                      customerName: '',
                      customerPhone: '',
                      customerAddress: '',
                      orderDate: new Date().toISOString().split('T')[0], // Today
                      deliveryDate: new Date().toISOString().split('T')[0], // Today
                      items: []
                    });
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Order'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* New Sale (POS) Modal */}
      {showPOS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">New Sale (Point of Sale)</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleAddPOSSale(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={posForm.customerName}
                  onChange={(e) => setPosForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  value={posForm.transactionDate}
                  onChange={(e) => setPosForm(prev => ({ ...prev, transactionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={posForm.paymentMethod}
                    onChange={(e) => setPosForm(prev => ({ ...prev, paymentMethod: e.target.value as POSTransaction['paymentMethod'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cashier Name</label>
                  <input
                    type="text"
                    value={posForm.cashierName}
                    onChange={(e) => setPosForm(prev => ({ ...prev, cashierName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* POS Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Sale Items *</label>
                  <button
                    type="button"
                    onClick={addItemToPOS}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {posForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.productId}
                        onChange={(e) => updatePOSItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Product</option>
                        {Array.isArray(products) && products.length > 0 ? products.map((product, productIndex) => (
                          <option key={product?.id || `pos-product-${productIndex}`} value={product?.id || ''}>
                            {product?.name || 'Unknown Product'} - ₹{product?.price || 0}/{product?.unit || 'unit'}
                          </option>
                        )) : (
                          <option value="" disabled>No products available</option>
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updatePOSItem(index, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Qty"
                        min="1"
                      />
                      <span className="w-20 text-sm text-gray-600">
                        ₹{(products && Array.isArray(products) ? (products.find(p => p?.id === item.productId)?.price || 0) : 0) * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePOSItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {posForm.items.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-900">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-700">
                        ₹{posForm.items.reduce((sum, item) => {
                          const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
                          return sum + (product ? product.price * item.quantity : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowPOS(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Processing...' : 'Complete Sale'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Edit POS Transaction Modal */}
      {showEditPOS && editingPOS && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Edit POS Transaction #{editingPOS.transactionNumber}</h3>
            <form onSubmit={(e) => { e.preventDefault(); handleUpdatePOS(); }} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Customer Name (Optional)</label>
                <input
                  type="text"
                  value={posForm.customerName}
                  onChange={(e) => setPosForm(prev => ({ ...prev, customerName: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  placeholder="Enter customer name (optional)"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Transaction Date *</label>
                <input
                  type="date"
                  value={posForm.transactionDate}
                  onChange={(e) => setPosForm(prev => ({ ...prev, transactionDate: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  required
                />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Payment Method *</label>
                  <select
                    value={posForm.paymentMethod}
                    onChange={(e) => setPosForm(prev => ({ ...prev, paymentMethod: e.target.value as POSTransaction['paymentMethod'] }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  >
                    <option value="CASH">Cash</option>
                    <option value="CARD">Card</option>
                    <option value="UPI">UPI</option>
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Cashier Name</label>
                  <input
                    type="text"
                    value={posForm.cashierName}
                    onChange={(e) => setPosForm(prev => ({ ...prev, cashierName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                    required
                  />
                </div>
              </div>

              {/* POS Items */}
              <div>
                <div className="flex items-center justify-between mb-3">
                  <label className="block text-sm font-medium text-gray-700">Sale Items *</label>
                  <button
                    type="button"
                    onClick={addItemToPOS}
                    className="text-blue-600 hover:text-blue-800 text-sm font-medium"
                  >
                    + Add Item
                  </button>
                </div>
                <div className="space-y-3">
                  {posForm.items.map((item, index) => (
                    <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                      <select
                        value={item.productId}
                        onChange={(e) => updatePOSItem(index, 'productId', e.target.value)}
                        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                      >
                        <option value="">Select Product</option>
                        {Array.isArray(products) && products.length > 0 ? products.map((product, productIndex) => (
                          <option key={product?.id || `pos-edit-product-${productIndex}`} value={product?.id || ''}>
                            {product?.name || 'Unknown Product'} - ₹{product?.price || 0}/{product?.unit || 'unit'}
                          </option>
                        )) : (
                          <option value="" disabled>No products available</option>
                        )}
                      </select>
                      <input
                        type="number"
                        value={item.quantity}
                        onChange={(e) => updatePOSItem(index, 'quantity', Number(e.target.value))}
                        className="w-24 px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                        placeholder="Qty"
                        min="1"
                      />
                      <span className="w-20 text-sm text-gray-600">
                        ₹{(products && Array.isArray(products) ? (products.find(p => p?.id === item.productId)?.price || 0) : 0) * item.quantity}
                      </span>
                      <button
                        type="button"
                        onClick={() => removePOSItem(index)}
                        className="text-red-600 hover:text-red-800"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                        </svg>
                      </button>
                    </div>
                  ))}
                </div>
                {posForm.items.length > 0 && (
                  <div className="mt-3 p-3 bg-blue-50 rounded-lg">
                    <div className="flex justify-between items-center">
                      <span className="font-medium text-blue-900">Total Amount:</span>
                      <span className="text-lg font-bold text-blue-700">
                        ₹{posForm.items.reduce((sum, item) => {
                          const product = products && Array.isArray(products) ? products.find(p => p?.id === item.productId) : null;
                          return sum + (product ? product.price * item.quantity : 0);
                        }, 0).toLocaleString()}
                      </span>
                    </div>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => {
                    setShowEditPOS(false);
                    setEditingPOS(null);
                  }}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={loading}
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium disabled:opacity-50"
                >
                  {loading ? 'Updating...' : 'Update Transaction'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Sales;
