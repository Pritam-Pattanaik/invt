import React, { useEffect, useState } from 'react';
import anime from 'animejs';

interface OrdersModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface Order {
  id: string;
  orderNumber: string;
  counterId: string;
  customerId: string;
  status: string;
  totalAmount: string;
  discount: string;
  tax: string;
  finalAmount: string;
  paymentMethod: string;
  notes: string | null;
  createdBy: string;
  createdAt: string;
  updatedAt: string;
  items: Array<{
    id: string;
    orderId: string;
    productId: string;
    quantity: number;
    unitPrice: string;
    totalPrice: string;
    notes: string | null;
    product: {
      name: string;
      sku: string;
      unit: string;
    };
  }>;
  counter: {
    name: string;
    location: string;
    franchise: {
      name: string;
      code: string;
    };
  };
  customer: {
    name: string;
    phone: string;
  };
  creator: {
    firstName: string;
    lastName: string;
  };
}

const OrdersModal: React.FC<OrdersModalProps> = ({ isOpen, onClose }) => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [showAddOrder, setShowAddOrder] = useState(false);
  const [newOrder, setNewOrder] = useState({
    customer: '',
    items: [{ name: 'Plain Roti', quantity: 1, price: 8 }]
  });

  const products = [
    { name: 'Plain Roti', price: 8 },
    { name: 'Butter Roti', price: 12 },
    { name: 'Masala Roti', price: 15 },
    { name: 'Wheat Roti', price: 10 },
    { name: 'Tandoor Roti', price: 18 }
  ];

  const fetchOrders = async () => {
    try {
      setLoading(true);
      setError(null);
      // Mock data for now - replace with actual API call
      const mockOrders: Order[] = [];
      setOrders(mockOrders);
    } catch (err) {
      console.error('Failed to fetch orders:', err);
      setError('Failed to load orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      fetchOrders();

      anime({
        targets: '.orders-modal',
        opacity: [0, 1],
        scale: [0.8, 1],
        duration: 400,
        easing: 'easeOutElastic(1, .8)'
      });
    }
  }, [isOpen]);

  useEffect(() => {
    if (orders.length > 0) {
      anime({
        targets: '.order-item',
        opacity: [0, 1],
        translateY: [30, 0],
        duration: 600,
        delay: anime.stagger(100),
        easing: 'easeOutQuart'
      });
    }
  }, [orders]);

  const getStatusColor = (status: string) => {
    switch (status.toUpperCase()) {
      case 'PENDING': return 'bg-yellow-100 text-yellow-800';
      case 'CONFIRMED': return 'bg-blue-100 text-blue-800';
      case 'IN_PREPARATION': return 'bg-purple-100 text-purple-800';
      case 'READY': return 'bg-green-100 text-green-800';
      case 'DELIVERED': return 'bg-gray-100 text-gray-800';
      case 'CANCELLED': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getStatusText = (status: string) => {
    switch (status.toUpperCase()) {
      case 'IN_PREPARATION': return 'Preparing';
      case 'CONFIRMED': return 'Confirmed';
      default: return status.charAt(0).toUpperCase() + status.slice(1).toLowerCase();
    }
  };

  const addOrderItem = () => {
    setNewOrder(prev => ({
      ...prev,
      items: [...prev.items, { name: 'Plain Roti', quantity: 1, price: 8 }]
    }));
  };

  const updateOrderItem = (index: number, field: string, value: any) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.map((item, i) => 
        i === index ? { ...item, [field]: value } : item
      )
    }));
  };

  const removeOrderItem = (index: number) => {
    setNewOrder(prev => ({
      ...prev,
      items: prev.items.filter((_, i) => i !== index)
    }));
  };

  const submitOrder = () => {
    const total = newOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0);
    const order: Order = {
      id: `ORD-${Date.now()}`,
      orderNumber: `ORD-${Date.now()}`,
      counterId: 'counter-1',
      customerId: 'customer-1',
      customer: {
        name: newOrder.customer,
        phone: '+91 9999999999'
      },
      counter: {
        name: 'Counter 1',
        location: 'Main Store',
        franchise: {
          name: 'Central Delhi',
          code: 'RF-DEL-001'
        }
      },
      creator: {
        firstName: 'Store',
        lastName: 'Manager'
      },
      items: newOrder.items.map((item, index) => ({
        id: `item-${index}`,
        orderId: `ORD-${Date.now()}`,
        productId: `prod-${index}`,
        quantity: item.quantity,
        unitPrice: item.price.toString(),
        totalPrice: (item.quantity * item.price).toString(),
        notes: null,
        product: {
          name: item.name,
          sku: `SKU-${index}`,
          unit: 'piece'
        }
      })),
      totalAmount: total.toString(),
      discount: '0',
      tax: '0',
      finalAmount: total.toString(),
      status: 'PENDING',
      paymentMethod: 'CASH',
      notes: null,
      createdBy: 'user-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    setOrders(prev => [order, ...prev]);
    setNewOrder({ customer: '', items: [{ name: 'Plain Roti', quantity: 1, price: 8 }] });
    setShowAddOrder(false);

    // Animate new order
    setTimeout(() => {
      anime({
        targets: '.order-item:first-child',
        backgroundColor: ['#dcfce7', '#ffffff'],
        duration: 2000,
        easing: 'easeOutQuart'
      });
    }, 100);
  };



  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 z-50 flex items-center justify-center p-4">
      <div className="orders-modal bg-white rounded-2xl shadow-2xl max-w-5xl w-full max-h-[90vh] overflow-hidden">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-500 to-blue-600 p-6 text-white">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold">Today's Orders</h2>
              <p className="text-blue-100">Order management and tracking</p>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setShowAddOrder(true)}
                className="bg-white/20 hover:bg-white/30 px-4 py-2 rounded-lg transition-colors flex items-center space-x-2"
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
                <span>Add Order</span>
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
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
              <span className="ml-2 text-gray-600">Loading orders...</span>
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
                    onClick={fetchOrders}
                    className="mt-2 text-sm text-red-600 hover:text-red-500 font-medium"
                  >
                    Try again
                  </button>
                </div>
              </div>
            </div>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              {/* Stats */}
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
                {[
                  { label: 'Total Orders', value: orders.length, bgClass: 'bg-blue-50', titleClass: 'text-blue-900', valueClass: 'text-blue-700' },
                  { label: 'Confirmed', value: orders.filter(o => o.status === 'CONFIRMED').length, bgClass: 'bg-blue-50', titleClass: 'text-blue-900', valueClass: 'text-blue-700' },
                  { label: 'Preparing', value: orders.filter(o => o.status === 'IN_PREPARATION').length, bgClass: 'bg-purple-50', titleClass: 'text-purple-900', valueClass: 'text-purple-700' },
                  { label: 'Ready', value: orders.filter(o => o.status === 'READY').length, bgClass: 'bg-green-50', titleClass: 'text-green-900', valueClass: 'text-green-700' }
                ].map((stat, index) => (
                  <div key={index} className={`${stat.bgClass} p-4 rounded-xl`}>
                    <h3 className={`font-semibold ${stat.titleClass}`}>{stat.label}</h3>
                    <p className={`text-2xl font-bold ${stat.valueClass}`}>{stat.value}</p>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && orders.length > 0 && (
            <>
              {/* Orders List */}
              <div className="space-y-4">
                {orders.map((order, index) => (
                  <div key={order.id} className="order-item bg-white border border-gray-200 rounded-xl p-4 hover:shadow-lg transition-all duration-300">
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-gradient-to-r from-blue-400 to-blue-500 rounded-full flex items-center justify-center">
                          <span className="text-white font-bold">#{index + 1}</span>
                        </div>
                        <div>
                          <h4 className="font-semibold text-gray-900">{order.customer.name}</h4>
                          <p className="text-sm text-gray-500">{order.counter.franchise.name} • {order.counter.name}</p>
                          <p className="text-xs text-gray-400">Order: {order.orderNumber}</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <div className="text-right">
                          <p className="text-xl font-bold text-blue-600">₹{parseFloat(order.finalAmount).toFixed(2)}</p>
                          <p className="text-sm text-gray-500">Total: ₹{order.totalAmount}</p>
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${getStatusColor(order.status)}`}>
                            {getStatusText(order.status)}
                          </span>
                        </div>
                      </div>
                    </div>

                    <div className="grid grid-cols-1 md:grid-cols-3 gap-2 mb-3">
                      {order.items.map((item, itemIndex) => (
                        <div key={itemIndex} className="bg-gray-50 p-2 rounded-lg">
                          <p className="text-sm font-medium">{item.product.name}</p>
                          <p className="text-xs text-gray-600">{item.quantity} × ₹{item.unitPrice} = ₹{item.totalPrice}</p>
                          <p className="text-xs text-gray-500">SKU: {item.product.sku}</p>
                        </div>
                      ))}
                    </div>

                    <div className="flex items-center justify-between">
                      <div>
                        <p className="text-sm text-gray-500">Customer: {order.customer.phone}</p>
                        <p className="text-sm text-gray-500">Created: {new Date(order.createdAt).toLocaleString()}</p>
                        <p className="text-sm text-gray-500">Payment: {order.paymentMethod}</p>
                      </div>
                      <div className="flex space-x-2">
                        {order.status !== 'DELIVERED' && (
                          <button className="px-3 py-1 bg-blue-100 text-blue-700 rounded-lg text-sm hover:bg-blue-200 transition-colors">
                            Update Status
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </>
          )}

          {!loading && !error && orders.length === 0 && (
            <div className="text-center py-12">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-4">
                <svg className="w-8 h-8 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
              </div>
              <h3 className="text-lg font-medium text-gray-900 mb-2">No orders found</h3>
              <p className="text-gray-500">Orders will appear here when customers place them.</p>
            </div>
          )}
        </div>
      </div>

      {/* Add Order Modal */}
      {showAddOrder && (
        <div className="fixed inset-0 bg-black bg-opacity-50 z-60 flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[80vh] overflow-hidden">
            <div className="bg-gradient-to-r from-green-500 to-green-600 p-4 text-white">
              <div className="flex items-center justify-between">
                <h3 className="text-xl font-bold">Add New Order</h3>
                <button
                  onClick={() => setShowAddOrder(false)}
                  className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
            </div>
            
            <div className="p-6 overflow-y-auto max-h-[calc(80vh-80px)]">
              <div className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Customer Name</label>
                  <input
                    type="text"
                    value={newOrder.customer}
                    onChange={(e) => setNewOrder(prev => ({ ...prev, customer: e.target.value }))}
                    className="input w-full"
                    placeholder="Enter customer name"
                  />
                </div>
                
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                    <button
                      onClick={addOrderItem}
                      className="btn btn-sm bg-green-100 text-green-700 hover:bg-green-200"
                    >
                      Add Item
                    </button>
                  </div>
                  
                  <div className="space-y-3">
                    {newOrder.items.map((item, index) => (
                      <div key={index} className="flex items-center space-x-3 p-3 bg-gray-50 rounded-lg">
                        <select
                          value={item.name}
                          onChange={(e) => {
                            const product = products.find(p => p.name === e.target.value);
                            updateOrderItem(index, 'name', e.target.value);
                            updateOrderItem(index, 'price', product?.price || 0);
                          }}
                          className="flex-1 input"
                        >
                          {products.map(product => (
                            <option key={product.name} value={product.name}>{product.name}</option>
                          ))}
                        </select>
                        <input
                          type="number"
                          value={item.quantity}
                          onChange={(e) => updateOrderItem(index, 'quantity', parseInt(e.target.value) || 1)}
                          className="w-20 input"
                          min="1"
                        />
                        <span className="text-sm text-gray-600 w-16">₹{item.price}</span>
                        {newOrder.items.length > 1 && (
                          <button
                            onClick={() => removeOrderItem(index)}
                            className="p-2 text-red-600 hover:bg-red-100 rounded-lg transition-colors"
                          >
                            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                          </button>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
                
                <div className="border-t pt-4">
                  <div className="flex items-center justify-between text-lg font-semibold">
                    <span>Total Amount:</span>
                    <span>₹{newOrder.items.reduce((sum, item) => sum + (item.quantity * item.price), 0)}</span>
                  </div>
                </div>
                
                <div className="flex space-x-3">
                  <button
                    onClick={() => setShowAddOrder(false)}
                    className="btn btn-outline btn-md flex-1"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={submitOrder}
                    disabled={!newOrder.customer.trim()}
                    className="btn btn-primary btn-md flex-1"
                  >
                    Create Order
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

export default OrdersModal;
