import React, { useState, useEffect } from 'react';
import anime from 'animejs';
import toast from 'react-hot-toast';
import { generateSalesReportPDF } from '../utils/pdfGenerator';
import { useAuth } from '../contexts/AuthContext';
import { usePermissions } from '../utils/permissions';
import ActionButtons from '../components/ActionButtons';

interface Product {
  id: string;
  name: string;
  price: number;
  unit: string;
}

interface OrderItem {
  productId: string;
  productName: string;
  quantity: number;
  price: number;
  total: number;
}

interface Order {
  id: string;
  orderNumber: string;
  customerName: string;
  customerPhone: string;
  customerAddress: string;
  items: OrderItem[];
  totalAmount: number;
  orderDate: string;
  deliveryDate: string;
  status: 'PENDING' | 'CONFIRMED' | 'PREPARING' | 'READY' | 'DELIVERED' | 'CANCELLED';
  paymentStatus: 'PENDING' | 'PAID' | 'PARTIAL';
  createdAt: string;
}

interface POSTransaction {
  id: string;
  transactionNumber: string;
  customerName?: string;
  items: OrderItem[];
  totalAmount: number;
  paymentMethod: 'CASH' | 'CARD' | 'UPI';
  transactionDate: string;
  cashierName: string;
  createdAt: string;
}

interface SalesReport {
  period: string;
  orders: {
    totalOrders: number;
    totalRevenue: number;
    averageOrderValue: number;
  };
  pos: {
    totalTransactions: number;
    totalRevenue: number;
    averageTransactionValue: number;
  };
  products: {
    name: string;
    quantitySold: number;
    revenue: number;
  }[];
  totalRevenue: number;
}

const Sales: React.FC = () => {
  const { user } = useAuth();
  const permissions = usePermissions(user);
  const [currentView, setCurrentView] = useState<'orders' | 'pos' | 'reports'>('orders');
  const [, setLoading] = useState(false);
  const [editingOrder, setEditingOrder] = useState<Order | null>(null);
  const [, setEditingPOS] = useState<POSTransaction | null>(null);

  // Products state
  const [products, setProducts] = useState<Product[]>([]);

  // Orders state
  const [orders, setOrders] = useState<Order[]>([]);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [orderForm, setOrderForm] = useState({
    customerName: '',
    customerPhone: '',
    customerAddress: '',
    orderDate: new Date().toISOString().split('T')[0],
    deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0], // Tomorrow by default
    items: [] as { productId: string; quantity: number }[],
    totalAmount: 0,
    paymentMethod: 'CASH' as 'CASH' | 'CARD' | 'UPI',
    notes: ''
  });

  // POS state
  const [posTransactions, setPosTransactions] = useState<POSTransaction[]>([]);
  const [showPOS, setShowPOS] = useState(false);
  const [, setShowAddPOS] = useState(false);
  const [posForm, setPosForm] = useState({
    customerName: '',
    items: [] as { productId: string; quantity: number }[],
    paymentMethod: 'CASH' as POSTransaction['paymentMethod'],
    cashierName: 'Store Manager',
    totalAmount: 0,
    transactionDate: new Date().toISOString().split('T')[0],
    notes: ''
  });

  // Reports state
  const [salesReport, setSalesReport] = useState<SalesReport | null>(null);
  const [reportPeriod, setReportPeriod] = useState('today');
  const [reportDateRange, setReportDateRange] = useState({
    startDate: new Date().toISOString().split('T')[0],
    endDate: new Date().toISOString().split('T')[0]
  });

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'sales/orders') {
        setCurrentView('orders');
      } else if (hash === 'sales/pos') {
        setCurrentView('pos');
      } else if (hash === 'sales/reports') {
        setCurrentView('reports');
      } else if (hash === 'sales') {
        setCurrentView('orders');
        window.location.hash = 'sales/orders';
      }
    };

    handleRouteChange();
    window.addEventListener('hashchange', handleRouteChange);
    return () => window.removeEventListener('hashchange', handleRouteChange);
  }, []);

  // Load mock data
  useEffect(() => {
    loadMockData();
  }, []);

  const loadMockData = () => {
    // Mock Products
    const mockProducts: Product[] = [
      { id: '1', name: 'Plain Roti', price: 8, unit: 'piece' },
      { id: '2', name: 'Butter Roti', price: 12, unit: 'piece' },
      { id: '3', name: 'Masala Roti', price: 15, unit: 'piece' },
      { id: '4', name: 'Wheat Roti', price: 10, unit: 'piece' },
      { id: '5', name: 'Stuffed Paratha', price: 25, unit: 'piece' },
      { id: '6', name: 'Roti Combo Pack', price: 100, unit: 'pack' }
    ];

    // Mock Orders
    const mockOrders: Order[] = [
      {
        id: '1',
        orderNumber: 'ORD-001',
        customerName: 'Rajesh Kumar',
        customerPhone: '+91 9876543210',
        customerAddress: '123 Main Street, Delhi',
        items: [
          { productId: '1', productName: 'Plain Roti', quantity: 20, price: 8, total: 160 },
          { productId: '2', productName: 'Butter Roti', quantity: 10, price: 12, total: 120 }
        ],
        totalAmount: 280,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
        status: 'CONFIRMED',
        paymentStatus: 'PAID',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        orderNumber: 'ORD-002',
        customerName: 'Priya Sharma',
        customerPhone: '+91 9876543211',
        customerAddress: '456 Park Avenue, Mumbai',
        items: [
          { productId: '3', productName: 'Masala Roti', quantity: 15, price: 15, total: 225 },
          { productId: '5', productName: 'Stuffed Paratha', quantity: 5, price: 25, total: 125 }
        ],
        totalAmount: 350,
        orderDate: new Date().toISOString().split('T')[0],
        deliveryDate: new Date(Date.now() + 172800000).toISOString().split('T')[0], // Day after tomorrow
        status: 'PREPARING',
        paymentStatus: 'PENDING',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        orderNumber: 'ORD-003',
        customerName: 'Amit Singh',
        customerPhone: '+91 9876543212',
        customerAddress: '789 Garden Road, Bangalore',
        items: [
          { productId: '6', productName: 'Roti Combo Pack', quantity: 3, price: 100, total: 300 }
        ],
        totalAmount: 300,
        orderDate: new Date(Date.now() - 86400000).toISOString().split('T')[0], // Yesterday
        deliveryDate: new Date().toISOString().split('T')[0], // Today
        status: 'DELIVERED',
        paymentStatus: 'PAID',
        createdAt: new Date(Date.now() - 86400000).toISOString()
      }
    ];

    // Mock POS Transactions
    const mockPOSTransactions: POSTransaction[] = [
      {
        id: '1',
        transactionNumber: 'POS-001',
        customerName: 'Walk-in Customer',
        items: [
          { productId: '1', productName: 'Plain Roti', quantity: 5, price: 8, total: 40 },
          { productId: '2', productName: 'Butter Roti', quantity: 3, price: 12, total: 36 }
        ],
        totalAmount: 76,
        paymentMethod: 'CASH',
        transactionDate: new Date().toISOString().split('T')[0],
        cashierName: 'Store Manager',
        createdAt: new Date().toISOString()
      },
      {
        id: '2',
        transactionNumber: 'POS-002',
        items: [
          { productId: '3', productName: 'Masala Roti', quantity: 8, price: 15, total: 120 }
        ],
        totalAmount: 120,
        paymentMethod: 'UPI',
        transactionDate: new Date().toISOString().split('T')[0],
        cashierName: 'Store Manager',
        createdAt: new Date().toISOString()
      },
      {
        id: '3',
        transactionNumber: 'POS-003',
        customerName: 'Suresh Kumar',
        items: [
          { productId: '1', productName: 'Plain Roti', quantity: 10, price: 8, total: 80 },
          { productId: '4', productName: 'Wheat Roti', quantity: 5, price: 10, total: 50 }
        ],
        totalAmount: 130,
        paymentMethod: 'CARD',
        transactionDate: new Date().toISOString().split('T')[0],
        cashierName: 'Store Manager',
        createdAt: new Date().toISOString()
      }
    ];

    setProducts(mockProducts);
    setOrders(mockOrders);
    setPosTransactions(mockPOSTransactions);
    generateSalesReport(mockOrders, mockPOSTransactions, 'today');
  };

  const generateSalesReport = (orders: Order[], posTransactions: POSTransaction[], period: string) => {
    const today = new Date();
    const todayStr = today.toISOString().split('T')[0];

    let filteredOrders = orders;
    let filteredPOS = posTransactions;
    let periodLabel = 'Custom Period';

    if (period === 'today') {
      filteredOrders = orders.filter(o => o.orderDate === todayStr);
      filteredPOS = posTransactions.filter(t => t.transactionDate === todayStr);
      periodLabel = 'Today';
    } else if (period === 'yesterday') {
      const yesterday = new Date(today);
      yesterday.setDate(yesterday.getDate() - 1);
      const yesterdayStr = yesterday.toISOString().split('T')[0];
      filteredOrders = orders.filter(o => o.orderDate === yesterdayStr);
      filteredPOS = posTransactions.filter(t => t.transactionDate === yesterdayStr);
      periodLabel = 'Yesterday';
    } else if (period === 'this-week') {
      const weekStart = new Date(today);
      weekStart.setDate(today.getDate() - today.getDay());
      filteredOrders = orders.filter(o => new Date(o.orderDate) >= weekStart);
      filteredPOS = posTransactions.filter(t => new Date(t.transactionDate) >= weekStart);
      periodLabel = 'This Week';
    } else if (period === 'this-month') {
      const monthStart = new Date(today.getFullYear(), today.getMonth(), 1);
      filteredOrders = orders.filter(o => new Date(o.orderDate) >= monthStart);
      filteredPOS = posTransactions.filter(t => new Date(t.transactionDate) >= monthStart);
      periodLabel = 'This Month';
    } else if (period === 'last-month') {
      const lastMonthStart = new Date(today.getFullYear(), today.getMonth() - 1, 1);
      const lastMonthEnd = new Date(today.getFullYear(), today.getMonth(), 0);
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= lastMonthStart && orderDate <= lastMonthEnd;
      });
      filteredPOS = posTransactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        return transactionDate >= lastMonthStart && transactionDate <= lastMonthEnd;
      });
      periodLabel = 'Last Month';
    } else if (period === 'custom') {
      const startDate = new Date(reportDateRange.startDate);
      const endDate = new Date(reportDateRange.endDate);
      filteredOrders = orders.filter(o => {
        const orderDate = new Date(o.orderDate);
        return orderDate >= startDate && orderDate <= endDate;
      });
      filteredPOS = posTransactions.filter(t => {
        const transactionDate = new Date(t.transactionDate);
        return transactionDate >= startDate && transactionDate <= endDate;
      });
      periodLabel = `${reportDateRange.startDate} to ${reportDateRange.endDate}`;
    }

    const report: SalesReport = {
      period: periodLabel,
      orders: {
        totalOrders: filteredOrders.length,
        totalRevenue: filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0),
        averageOrderValue: filteredOrders.length > 0 ?
          filteredOrders.reduce((sum, o) => sum + o.totalAmount, 0) / filteredOrders.length : 0
      },
      pos: {
        totalTransactions: filteredPOS.length,
        totalRevenue: filteredPOS.reduce((sum, t) => sum + t.totalAmount, 0),
        averageTransactionValue: filteredPOS.length > 0 ?
          filteredPOS.reduce((sum, t) => sum + t.totalAmount, 0) / filteredPOS.length : 0
      },
      products: [],
      totalRevenue: 0
    };

    report.totalRevenue = report.orders.totalRevenue + report.pos.totalRevenue;
    setSalesReport(report);
  };

  const exportSalesReportPDF = () => {
    if (!salesReport) {
      toast.error('No sales report data available');
      return;
    }

    try {
      const reportData = {
        totalOrders: salesReport.orders.totalOrders,
        totalRevenue: salesReport.totalRevenue,
        avgOrderValue: salesReport.orders.averageOrderValue,
        posRevenue: salesReport.pos.totalRevenue,
        orders: orders.filter(order => {
          // Filter orders based on current report period
          if (reportPeriod === 'today') {
            return order.orderDate === new Date().toISOString().split('T')[0];
          }
          // Add more filtering logic as needed
          return true;
        })
      };

      const pdf = generateSalesReportPDF(reportData, salesReport.period);
      const filename = `sales-report-${salesReport.period.toLowerCase().replace(/\s+/g, '-')}-${new Date().toISOString().split('T')[0]}.pdf`;
      pdf.save(filename);

      toast.success('Sales report exported successfully!');
    } catch (error) {
      console.error('Error exporting PDF:', error);
      toast.error('Failed to export PDF report');
    }
  };

  // SuperAdmin edit/delete functions
  const handleEditOrder = (order: Order) => {
    if (!permissions.canEdit('SALES')) {
      toast.error('You do not have permission to edit orders');
      return;
    }
    setEditingOrder(order);
    setOrderForm({
      customerName: order.customerName,
      customerPhone: order.customerPhone,
      customerAddress: order.customerAddress,
      items: order.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      totalAmount: order.totalAmount,
      paymentMethod: 'CASH',
      orderDate: order.orderDate,
      deliveryDate: order.deliveryDate || '',
      notes: ''
    });
    setShowAddOrder(true);
  };

  const handleDeleteOrder = async (orderId: string) => {
    if (!permissions.canDelete('SALES')) {
      toast.error('You do not have permission to delete orders');
      return;
    }

    if (!confirm('Are you sure you want to delete this order? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would call an API
      setOrders(prev => prev.filter(order => order.id !== orderId));
      toast.success('Order deleted successfully');
    } catch (error) {
      console.error('Error deleting order:', error);
      toast.error('Failed to delete order');
    } finally {
      setLoading(false);
    }
  };

  const handleEditPOS = (transaction: POSTransaction) => {
    if (!permissions.canEdit('SALES')) {
      toast.error('You do not have permission to edit POS transactions');
      return;
    }
    setEditingPOS(transaction);
    setPosForm({
      customerName: transaction.customerName || '',
      items: transaction.items.map(item => ({ productId: item.productId, quantity: item.quantity })),
      totalAmount: transaction.totalAmount,
      paymentMethod: transaction.paymentMethod,
      transactionDate: transaction.transactionDate,
      notes: '',
      cashierName: transaction.cashierName
    });
    setShowAddPOS(true);
  };

  const handleDeletePOS = async (transactionId: string) => {
    if (!permissions.canDelete('SALES')) {
      toast.error('You do not have permission to delete POS transactions');
      return;
    }

    if (!confirm('Are you sure you want to delete this POS transaction? This action cannot be undone.')) {
      return;
    }

    try {
      setLoading(true);
      // In a real app, this would call an API
      setPosTransactions(prev => prev.filter(transaction => transaction.id !== transactionId));
      toast.success('POS transaction deleted successfully');
    } catch (error) {
      console.error('Error deleting POS transaction:', error);
      toast.error('Failed to delete POS transaction');
    } finally {
      setLoading(false);
    }
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.sales-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const handleAddOrder = () => {
    if (!orderForm.customerName.trim() || !orderForm.customerPhone.trim() || orderForm.items.length === 0) {
      alert('Please fill in all required fields and add at least one item');
      return;
    }

    const orderItems: OrderItem[] = orderForm.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: item.quantity * product.price
      };
    });

    const totalAmount = orderItems.reduce((sum, item) => sum + item.total, 0);

    if (editingOrder) {
      // Update existing order
      const updatedOrder: Order = {
        ...editingOrder,
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        customerAddress: orderForm.customerAddress.trim(),
        items: orderItems,
        totalAmount,
        orderDate: orderForm.orderDate,
        deliveryDate: orderForm.deliveryDate
      };

      setOrders(prev => prev.map(order =>
        order.id === editingOrder.id ? updatedOrder : order
      ));

      setEditingOrder(null);
      alert('Order updated successfully!');
    } else {
      // Create new order
      const orderNumber = `ORD-${String(orders.length + 1).padStart(3, '0')}`;

      const newOrder: Order = {
        id: Date.now().toString(),
        orderNumber,
        customerName: orderForm.customerName.trim(),
        customerPhone: orderForm.customerPhone.trim(),
        customerAddress: orderForm.customerAddress.trim(),
        items: orderItems,
        totalAmount,
        orderDate: orderForm.orderDate,
        deliveryDate: orderForm.deliveryDate,
        status: 'PENDING',
        paymentStatus: 'PENDING',
        createdAt: new Date().toISOString()
      };

      setOrders(prev => [...prev, newOrder]);
      alert('Order created successfully!');
    }

    // Reset form
    setOrderForm({
      customerName: '',
      customerPhone: '',
      customerAddress: '',
      orderDate: new Date().toISOString().split('T')[0],
      deliveryDate: new Date(Date.now() + 86400000).toISOString().split('T')[0],
      items: [],
      totalAmount: 0,
      paymentMethod: 'CASH',
      notes: ''
    });
    setShowAddOrder(false);
  };

  const handleAddPOSSale = () => {
    if (posForm.items.length === 0) {
      alert('Please add at least one item to the sale');
      return;
    }

    const saleItems: OrderItem[] = posForm.items.map(item => {
      const product = products.find(p => p.id === item.productId)!;
      return {
        productId: item.productId,
        productName: product.name,
        quantity: item.quantity,
        price: product.price,
        total: item.quantity * product.price
      };
    });

    const totalAmount = saleItems.reduce((sum, item) => sum + item.total, 0);
    const transactionNumber = `POS-${String(posTransactions.length + 1).padStart(3, '0')}`;

    const newTransaction: POSTransaction = {
      id: Date.now().toString(),
      transactionNumber,
      customerName: posForm.customerName.trim() || undefined,
      items: saleItems,
      totalAmount,
      paymentMethod: posForm.paymentMethod,
      transactionDate: new Date().toISOString().split('T')[0],
      cashierName: posForm.cashierName,
      createdAt: new Date().toISOString()
    };

    setPosTransactions(prev => [...prev, newTransaction]);
    setPosForm({
      customerName: '',
      items: [],
      paymentMethod: 'CASH',
      cashierName: 'Store Manager',
      totalAmount: 0,
      transactionDate: new Date().toISOString().split('T')[0],
      notes: ''
    });
    setShowPOS(false);
    alert('Sale completed successfully!');
  };

  const addItemToOrder = () => {
    setOrderForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: products[0]?.id || '', quantity: 1 }]
    }));
  };

  const updateOrderItem = (index: number, field: 'productId' | 'quantity', value: string | number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeOrderItem = (index: number) => {
    setOrderForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const addItemToPOS = () => {
    setPosForm(prev => ({
      ...prev,
      items: [...prev.items, { productId: products[0]?.id || '', quantity: 1 }]
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

  const removePOSItem = (index: number) => {
    setPosForm(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const getTodayOrders = () => {
    const today = new Date().toISOString().split('T')[0];
    return orders.filter(order => order.orderDate === today);
  };

  const getTotalProductQuantities = () => {
    return orders.reduce((total, order) => {
      return total + order.items.reduce((orderTotal, item) => orderTotal + item.quantity, 0);
    }, 0);
  };

  const renderOrdersView = () => {
    const todayOrders = getTodayOrders();
    const totalProducts = products.length;
    const totalQuantities = getTotalProductQuantities();

    return (
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

        {/* Summary Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
          <div className="sales-card bg-blue-50 p-6 rounded-xl border border-blue-200">
            <h3 className="text-sm font-medium text-blue-900 mb-2">Today's Orders</h3>
            <p className="text-2xl font-bold text-blue-700">{todayOrders.length}</p>
          </div>
          <div className="sales-card bg-green-50 p-6 rounded-xl border border-green-200">
            <h3 className="text-sm font-medium text-green-900 mb-2">Total Products</h3>
            <p className="text-2xl font-bold text-green-700">{totalProducts}</p>
          </div>
          <div className="sales-card bg-purple-50 p-6 rounded-xl border border-purple-200">
            <h3 className="text-sm font-medium text-purple-900 mb-2">Total Quantities</h3>
            <p className="text-2xl font-bold text-purple-700">{totalQuantities}</p>
          </div>
          <div className="sales-card bg-orange-50 p-6 rounded-xl border border-orange-200">
            <h3 className="text-sm font-medium text-orange-900 mb-2">Today's Revenue</h3>
            <p className="text-2xl font-bold text-orange-700">
              ₹{todayOrders.reduce((sum, order) => sum + order.totalAmount, 0).toLocaleString()}
            </p>
          </div>
        </div>

        {/* Today's Orders */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">Today's Orders</h3>
          </div>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Order #</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Customer</th>
                  <th className="text-left py-3 px-6 font-semibold text-gray-900">Items</th>
                  <th className="text-right py-3 px-6 font-semibold text-gray-900">Amount</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                  <th className="text-center py-3 px-6 font-semibold text-gray-900">Payment</th>
                  {permissions.isSuperAdmin() && (
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  )}
                </tr>
              </thead>
              <tbody>
                {todayOrders.map((order) => (
                  <tr key={order.id} className="border-b border-gray-100 hover:bg-gray-50">
                    <td className="py-4 px-6 font-medium text-gray-900">{order.orderNumber}</td>
                    <td className="py-4 px-6">
                      <div>
                        <div className="font-medium text-gray-900">{order.customerName}</div>
                        <div className="text-sm text-gray-500">{order.customerPhone}</div>
                      </div>
                    </td>
                    <td className="py-4 px-6">
                      <div className="text-sm">
                        {order.items.map((item, index) => (
                          <div key={index} className="text-gray-600">
                            {item.productName} × {item.quantity}
                          </div>
                        ))}
                      </div>
                    </td>
                    <td className="py-4 px-6 text-right font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                        order.status === 'READY' ? 'bg-blue-100 text-blue-800' :
                        order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                        order.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-800' :
                        order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                        'bg-gray-100 text-gray-800'
                      }`}>
                        {order.status}
                      </span>
                    </td>
                    <td className="py-4 px-6 text-center">
                      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                        order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                        order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                        'bg-red-100 text-red-800'
                      }`}>
                        {order.paymentStatus}
                      </span>
                    </td>
                    {permissions.isSuperAdmin() && (
                      <td className="py-4 px-6 text-center">
                        <ActionButtons
                          onEdit={() => handleEditOrder(order)}
                          onDelete={() => handleDeleteOrder(order.id)}
                          canEdit={permissions.canEdit('SALES')}
                          canDelete={permissions.canDelete('SALES')}
                          size="sm"
                          variant="minimal"
                        />
                      </td>
                    )}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* All Orders by Date */}
        <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
          <div className="px-6 py-4 border-b border-gray-200">
            <h3 className="text-lg font-semibold text-gray-900">All Orders by Date</h3>
          </div>
          <div className="max-h-96 overflow-y-auto">
            {Object.entries(
              orders
                .sort((a, b) => new Date(b.orderDate).getTime() - new Date(a.orderDate).getTime())
                .reduce((groups, order) => {
                  const date = order.orderDate;
                  if (!groups[date]) groups[date] = [];
                  groups[date].push(order);
                  return groups;
                }, {} as Record<string, Order[]>)
            ).map(([date, dateOrders]) => (
              <div key={date} className="border-b border-gray-100 last:border-b-0">
                <div className="px-6 py-3 bg-gray-50 border-b border-gray-100">
                  <div className="flex items-center justify-between">
                    <h4 className="font-medium text-gray-900">
                      {new Date(date).toLocaleDateString('en-US', {
                        weekday: 'long',
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                      })}
                    </h4>
                    <div className="text-sm text-gray-600">
                      {dateOrders.length} orders • ₹{dateOrders.reduce((sum, o) => sum + o.totalAmount, 0).toLocaleString()}
                    </div>
                  </div>
                </div>
                <div className="divide-y divide-gray-100">
                  {dateOrders.map((order) => (
                    <div key={order.id} className="px-6 py-4 hover:bg-gray-50">
                      <div className="flex items-center justify-between">
                        <div className="flex-1">
                          <div className="flex items-center space-x-4">
                            <span className="font-medium text-gray-900">{order.orderNumber}</span>
                            <span className="text-gray-600">{order.customerName}</span>
                            <span className="text-sm text-gray-500">{order.customerPhone}</span>
                          </div>
                          <div className="mt-1 text-sm text-gray-600">
                            {order.items.map((item, index) => (
                              <span key={index}>
                                {item.productName} × {item.quantity}
                                {index < order.items.length - 1 ? ', ' : ''}
                              </span>
                            ))}
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <span className="font-medium text-gray-900">₹{order.totalAmount.toLocaleString()}</span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.status === 'DELIVERED' ? 'bg-green-100 text-green-800' :
                            order.status === 'READY' ? 'bg-blue-100 text-blue-800' :
                            order.status === 'PREPARING' ? 'bg-yellow-100 text-yellow-800' :
                            order.status === 'CONFIRMED' ? 'bg-purple-100 text-purple-800' :
                            order.status === 'CANCELLED' ? 'bg-red-100 text-red-800' :
                            'bg-gray-100 text-gray-800'
                          }`}>
                            {order.status}
                          </span>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            order.paymentStatus === 'PAID' ? 'bg-green-100 text-green-800' :
                            order.paymentStatus === 'PARTIAL' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {order.paymentStatus}
                          </span>
                          {permissions.isSuperAdmin() && (
                            <ActionButtons
                              onEdit={() => handleEditOrder(order)}
                              onDelete={() => handleDeleteOrder(order.id)}
                              canEdit={permissions.canEdit('SALES')}
                              canDelete={permissions.canDelete('SALES')}
                              size="sm"
                              variant="minimal"
                            />
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            ))}
          </div>
        </div>
      </div>
    );
  };

  return (
    <div className="p-6">
      {/* Render different views based on currentView */}
      {currentView === 'orders' && renderOrdersView()}
      {currentView === 'pos' && (
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

          {/* POS Summary Cards */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="sales-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Today's Sales</h3>
              <p className="text-2xl font-bold text-green-700">
                {posTransactions.filter(t => t.transactionDate === new Date().toISOString().split('T')[0]).length}
              </p>
            </div>
            <div className="sales-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Today's Revenue</h3>
              <p className="text-2xl font-bold text-blue-700">
                ₹{posTransactions
                  .filter(t => t.transactionDate === new Date().toISOString().split('T')[0])
                  .reduce((sum, t) => sum + t.totalAmount, 0).toLocaleString()}
              </p>
            </div>
            <div className="sales-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Average Sale</h3>
              <p className="text-2xl font-bold text-purple-700">
                ₹{posTransactions.length > 0 ?
                  Math.round(posTransactions.reduce((sum, t) => sum + t.totalAmount, 0) / posTransactions.length) : 0}
              </p>
            </div>
            <div className="sales-card bg-orange-50 p-6 rounded-xl border border-orange-200">
              <h3 className="text-sm font-medium text-orange-900 mb-2">Total Transactions</h3>
              <p className="text-2xl font-bold text-orange-700">{posTransactions.length}</p>
            </div>
          </div>

          {/* Recent POS Transactions */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Recent Transactions</h3>
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
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Date</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Cashier</th>
                    {permissions.isSuperAdmin() && (
                      <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                    )}
                  </tr>
                </thead>
                <tbody>
                  {posTransactions.map((transaction) => (
                    <tr key={transaction.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{transaction.transactionNumber}</td>
                      <td className="py-4 px-6 text-gray-600">
                        {transaction.customerName || 'Walk-in Customer'}
                      </td>
                      <td className="py-4 px-6">
                        <div className="text-sm">
                          {transaction.items.map((item, index) => (
                            <div key={index} className="text-gray-600">
                              {item.productName} × {item.quantity}
                            </div>
                          ))}
                        </div>
                      </td>
                      <td className="py-4 px-6 text-right font-medium text-gray-900">₹{transaction.totalAmount.toLocaleString()}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          transaction.paymentMethod === 'CASH' ? 'bg-green-100 text-green-800' :
                          transaction.paymentMethod === 'CARD' ? 'bg-blue-100 text-blue-800' :
                          'bg-purple-100 text-purple-800'
                        }`}>
                          {transaction.paymentMethod}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{new Date(transaction.transactionDate).toLocaleDateString()}</td>
                      <td className="py-4 px-6 text-gray-600">{transaction.cashierName}</td>
                      {permissions.isSuperAdmin() && (
                        <td className="py-4 px-6 text-center">
                          <ActionButtons
                            onEdit={() => handleEditPOS(transaction)}
                            onDelete={() => handleDeletePOS(transaction.id)}
                            canEdit={permissions.canEdit('SALES')}
                            canDelete={permissions.canDelete('SALES')}
                            size="sm"
                            variant="minimal"
                          />
                        </td>
                      )}
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {currentView === 'reports' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Sales Reports</h2>
              <p className="text-gray-600">Comprehensive sales analytics for Orders and Point of Sale</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={reportPeriod}
                onChange={(e) => {
                  setReportPeriod(e.target.value);
                  if (e.target.value !== 'custom') {
                    generateSalesReport(orders, posTransactions, e.target.value);
                  }
                }}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="today">Today</option>
                <option value="yesterday">Yesterday</option>
                <option value="this-week">This Week</option>
                <option value="this-month">This Month</option>
                <option value="last-month">Last Month</option>
                <option value="custom">Custom Range</option>
              </select>
              {reportPeriod === 'custom' && (
                <>
                  <input
                    type="date"
                    value={reportDateRange.startDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, startDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <span className="text-gray-500">to</span>
                  <input
                    type="date"
                    value={reportDateRange.endDate}
                    onChange={(e) => setReportDateRange(prev => ({ ...prev, endDate: e.target.value }))}
                    className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  />
                  <button
                    onClick={() => generateSalesReport(orders, posTransactions, 'custom')}
                    className="px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                  >
                    Generate
                  </button>
                </>
              )}
              <button
                onClick={exportSalesReportPDF}
                className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Export PDF</span>
              </button>
            </div>
          </div>

          {salesReport && (
            <>
              {/* Report Summary Cards */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
                <div className="sales-card bg-blue-50 p-6 rounded-xl border border-blue-200">
                  <h3 className="text-sm font-medium text-blue-900 mb-2">Total Revenue</h3>
                  <p className="text-2xl font-bold text-blue-700">₹{salesReport.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-blue-600 mt-1">{salesReport.period}</p>
                </div>
                <div className="sales-card bg-green-50 p-6 rounded-xl border border-green-200">
                  <h3 className="text-sm font-medium text-green-900 mb-2">Orders Revenue</h3>
                  <p className="text-2xl font-bold text-green-700">₹{salesReport.orders.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-green-600 mt-1">{salesReport.orders.totalOrders} orders</p>
                </div>
                <div className="sales-card bg-purple-50 p-6 rounded-xl border border-purple-200">
                  <h3 className="text-sm font-medium text-purple-900 mb-2">POS Revenue</h3>
                  <p className="text-2xl font-bold text-purple-700">₹{salesReport.pos.totalRevenue.toLocaleString()}</p>
                  <p className="text-xs text-purple-600 mt-1">{salesReport.pos.totalTransactions} transactions</p>
                </div>
                <div className="sales-card bg-orange-50 p-6 rounded-xl border border-orange-200">
                  <h3 className="text-sm font-medium text-orange-900 mb-2">Avg Order Value</h3>
                  <p className="text-2xl font-bold text-orange-700">₹{Math.round(salesReport.orders.averageOrderValue)}</p>
                  <p className="text-xs text-orange-600 mt-1">per order</p>
                </div>
              </div>

              {/* Detailed Reports */}
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                {/* Orders Report */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-green-50">
                    <h3 className="text-lg font-semibold text-green-900">Orders Report</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Orders</span>
                      <span className="font-medium text-gray-900">{salesReport.orders.totalOrders}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Revenue</span>
                      <span className="font-medium text-gray-900">₹{salesReport.orders.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Average Order Value</span>
                      <span className="font-medium text-gray-900">₹{Math.round(salesReport.orders.averageOrderValue)}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Order Status Breakdown</h4>
                      <div className="space-y-2">
                        {['PENDING', 'CONFIRMED', 'PREPARING', 'READY', 'DELIVERED', 'CANCELLED'].map(status => {
                          const count = orders.filter(o => o.status === status).length;
                          return (
                            <div key={status} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{status}</span>
                              <span className="font-medium">{count}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>

                {/* POS Report */}
                <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                  <div className="px-6 py-4 border-b border-gray-200 bg-purple-50">
                    <h3 className="text-lg font-semibold text-purple-900">Point of Sale Report</h3>
                  </div>
                  <div className="p-6 space-y-4">
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Transactions</span>
                      <span className="font-medium text-gray-900">{salesReport.pos.totalTransactions}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Total Revenue</span>
                      <span className="font-medium text-gray-900">₹{salesReport.pos.totalRevenue.toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between items-center">
                      <span className="text-gray-700">Average Transaction</span>
                      <span className="font-medium text-gray-900">₹{Math.round(salesReport.pos.averageTransactionValue)}</span>
                    </div>
                    <div className="pt-4 border-t border-gray-200">
                      <h4 className="font-medium text-gray-900 mb-3">Payment Method Breakdown</h4>
                      <div className="space-y-2">
                        {['CASH', 'CARD', 'UPI'].map(method => {
                          const count = posTransactions.filter(t => t.paymentMethod === method).length;
                          const revenue = posTransactions
                            .filter(t => t.paymentMethod === method)
                            .reduce((sum, t) => sum + t.totalAmount, 0);
                          return (
                            <div key={method} className="flex justify-between items-center text-sm">
                              <span className="text-gray-600">{method}</span>
                              <div className="text-right">
                                <div className="font-medium">{count} transactions</div>
                                <div className="text-xs text-gray-500">₹{revenue.toLocaleString()}</div>
                              </div>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Product Performance */}
              <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
                <div className="px-6 py-4 border-b border-gray-200">
                  <h3 className="text-lg font-semibold text-gray-900">Product Performance</h3>
                </div>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="text-left py-3 px-6 font-semibold text-gray-900">Product</th>
                        <th className="text-right py-3 px-6 font-semibold text-gray-900">Orders Qty</th>
                        <th className="text-right py-3 px-6 font-semibold text-gray-900">POS Qty</th>
                        <th className="text-right py-3 px-6 font-semibold text-gray-900">Total Qty</th>
                        <th className="text-right py-3 px-6 font-semibold text-gray-900">Revenue</th>
                      </tr>
                    </thead>
                    <tbody>
                      {products.map(product => {
                        const orderQty = orders.reduce((sum, order) => {
                          return sum + order.items
                            .filter(item => item.productId === product.id)
                            .reduce((itemSum, item) => itemSum + item.quantity, 0);
                        }, 0);

                        const posQty = posTransactions.reduce((sum, transaction) => {
                          return sum + transaction.items
                            .filter(item => item.productId === product.id)
                            .reduce((itemSum, item) => itemSum + item.quantity, 0);
                        }, 0);

                        const totalQty = orderQty + posQty;
                        const revenue = totalQty * product.price;

                        return (
                          <tr key={product.id} className="border-b border-gray-100 hover:bg-gray-50">
                            <td className="py-4 px-6 font-medium text-gray-900">{product.name}</td>
                            <td className="py-4 px-6 text-right text-gray-600">{orderQty}</td>
                            <td className="py-4 px-6 text-right text-gray-600">{posQty}</td>
                            <td className="py-4 px-6 text-right font-medium text-gray-900">{totalQty}</td>
                            <td className="py-4 px-6 text-right font-medium text-gray-900">₹{revenue.toLocaleString()}</td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </div>
            </>
          )}
        </div>
      )}

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-2xl mx-4 max-h-[90vh] overflow-y-auto">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              {editingOrder ? 'Edit Order' : 'Add New Order'}
            </h3>
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
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ₹{product.price}/{product.unit}
                          </option>
                        ))}
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
                        ₹{(products.find(p => p.id === item.productId)?.price || 0) * item.quantity}
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
                          const product = products.find(p => p.id === item.productId);
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
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Create Order
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
                    placeholder="Enter cashier name"
                  />
                </div>
              </div>

              {/* Sale Items */}
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
                        {products.map(product => (
                          <option key={product.id} value={product.id}>
                            {product.name} - ₹{product.price}/{product.unit}
                          </option>
                        ))}
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
                        ₹{(products.find(p => p.id === item.productId)?.price || 0) * item.quantity}
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
                          const product = products.find(p => p.id === item.productId);
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
                  className="px-6 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg font-medium"
                >
                  Complete Sale
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
