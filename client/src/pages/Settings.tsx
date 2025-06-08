import React, { useState, useEffect } from 'react';
import anime from 'animejs';

interface User {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  role: 'SUPER_ADMIN' | 'ADMIN' | 'MANAGER' | 'FRANCHISE_MANAGER' | 'COUNTER_OPERATOR';
  isActive: boolean;
  lastLogin?: string;
  createdAt: string;
}

interface Permission {
  id: string;
  name: string;
  description: string;
  module: string;
  action: 'CREATE' | 'READ' | 'UPDATE' | 'DELETE';
}

interface RolePermission {
  roleId: string;
  roleName: string;
  permissions: string[];
}

interface GeneralSettings {
  companyName: string;
  companyAddress: string;
  companyPhone: string;
  companyEmail: string;
  currency: string;
  timezone: string;
  dateFormat: string;
  language: string;
  emailNotifications: boolean;
  smsNotifications: boolean;
  autoBackup: boolean;
  backupFrequency: 'DAILY' | 'WEEKLY' | 'MONTHLY';
}

interface BackupRecord {
  id: string;
  fileName: string;
  size: string;
  createdAt: string;
  type: 'MANUAL' | 'AUTOMATIC';
  status: 'SUCCESS' | 'FAILED' | 'IN_PROGRESS';
}

const Settings: React.FC = () => {
  const [currentView, setCurrentView] = useState<'general' | 'users' | 'permissions' | 'backup'>('general');
  const [loading, setLoading] = useState(false);

  // General Settings state
  const [generalSettings, setGeneralSettings] = useState<GeneralSettings>({
    companyName: 'Roti Factory',
    companyAddress: '123 Business Street, Mumbai, Maharashtra 400001',
    companyPhone: '+91 9876543210',
    companyEmail: 'info@rotifactory.com',
    currency: 'INR',
    timezone: 'Asia/Kolkata',
    dateFormat: 'DD/MM/YYYY',
    language: 'English',
    emailNotifications: true,
    smsNotifications: false,
    autoBackup: true,
    backupFrequency: 'DAILY'
  });

  // Users state
  const [users, setUsers] = useState<User[]>([]);
  const [showAddUser, setShowAddUser] = useState(false);
  const [userForm, setUserForm] = useState({
    firstName: '',
    lastName: '',
    email: '',
    role: 'COUNTER_OPERATOR' as User['role'],
    password: '',
    confirmPassword: ''
  });

  // Permissions state
  const [permissions, setPermissions] = useState<Permission[]>([]);
  const [rolePermissions, setRolePermissions] = useState<RolePermission[]>([]);
  const [selectedRole, setSelectedRole] = useState<string>('ADMIN');

  // Backup state
  const [backupRecords, setBackupRecords] = useState<BackupRecord[]>([]);
  const [isBackingUp, setIsBackingUp] = useState(false);

  // Handle route changes
  useEffect(() => {
    const handleRouteChange = () => {
      const hash = window.location.hash.replace('#', '');
      
      if (hash === 'settings/general') {
        setCurrentView('general');
      } else if (hash === 'settings/users') {
        setCurrentView('users');
      } else if (hash === 'settings/permissions') {
        setCurrentView('permissions');
      } else if (hash === 'settings/backup') {
        setCurrentView('backup');
      } else if (hash === 'settings') {
        setCurrentView('general');
        window.location.hash = 'settings/general';
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
    // Mock Users
    const mockUsers: User[] = [
      {
        id: '1',
        firstName: 'Admin',
        lastName: 'User',
        email: 'admin@rotifactory.com',
        role: 'SUPER_ADMIN',
        isActive: true,
        lastLogin: new Date().toISOString(),
        createdAt: '2024-01-01T00:00:00Z'
      },
      {
        id: '2',
        firstName: 'Rajesh',
        lastName: 'Kumar',
        email: 'rajesh@rotifactory.com',
        role: 'MANAGER',
        isActive: true,
        lastLogin: new Date(Date.now() - 3600000).toISOString(),
        createdAt: '2024-02-01T00:00:00Z'
      },
      {
        id: '3',
        firstName: 'Priya',
        lastName: 'Sharma',
        email: 'priya@rotifactory.com',
        role: 'COUNTER_OPERATOR',
        isActive: true,
        lastLogin: new Date(Date.now() - 7200000).toISOString(),
        createdAt: '2024-03-01T00:00:00Z'
      },
      {
        id: '4',
        firstName: 'Amit',
        lastName: 'Singh',
        email: 'amit@rotifactory.com',
        role: 'FRANCHISE_MANAGER',
        isActive: false,
        createdAt: '2024-04-01T00:00:00Z'
      }
    ];

    // Mock Permissions
    const mockPermissions: Permission[] = [
      { id: '1', name: 'View Dashboard', description: 'Access to main dashboard', module: 'Dashboard', action: 'READ' },
      { id: '2', name: 'Manage Orders', description: 'Create and manage orders', module: 'Sales', action: 'CREATE' },
      { id: '3', name: 'View Sales Reports', description: 'Access sales analytics', module: 'Sales', action: 'READ' },
      { id: '4', name: 'Manage Counters', description: 'Add and edit counters', module: 'Counters', action: 'UPDATE' },
      { id: '5', name: 'Manage Users', description: 'Add, edit, and delete users', module: 'Settings', action: 'CREATE' },
      { id: '6', name: 'View Finance', description: 'Access financial data', module: 'Finance', action: 'READ' },
      { id: '7', name: 'Manage Inventory', description: 'Control inventory operations', module: 'Manufacturing', action: 'UPDATE' }
    ];

    // Mock Role Permissions
    const mockRolePermissions: RolePermission[] = [
      { roleId: 'SUPER_ADMIN', roleName: 'Super Admin', permissions: ['1', '2', '3', '4', '5', '6', '7'] },
      { roleId: 'ADMIN', roleName: 'Admin', permissions: ['1', '2', '3', '4', '6', '7'] },
      { roleId: 'MANAGER', roleName: 'Manager', permissions: ['1', '2', '3', '6'] },
      { roleId: 'FRANCHISE_MANAGER', roleName: 'Franchise Manager', permissions: ['1', '2', '3'] },
      { roleId: 'COUNTER_OPERATOR', roleName: 'Counter Operator', permissions: ['1', '2'] }
    ];

    // Mock Backup Records
    const mockBackupRecords: BackupRecord[] = [
      {
        id: '1',
        fileName: 'backup_2024_06_15_daily.sql',
        size: '2.4 MB',
        createdAt: new Date().toISOString(),
        type: 'AUTOMATIC',
        status: 'SUCCESS'
      },
      {
        id: '2',
        fileName: 'backup_2024_06_14_manual.sql',
        size: '2.3 MB',
        createdAt: new Date(Date.now() - 86400000).toISOString(),
        type: 'MANUAL',
        status: 'SUCCESS'
      },
      {
        id: '3',
        fileName: 'backup_2024_06_13_daily.sql',
        size: '2.2 MB',
        createdAt: new Date(Date.now() - 172800000).toISOString(),
        type: 'AUTOMATIC',
        status: 'SUCCESS'
      }
    ];

    setUsers(mockUsers);
    setPermissions(mockPermissions);
    setRolePermissions(mockRolePermissions);
    setBackupRecords(mockBackupRecords);
  };

  // Animation effect
  useEffect(() => {
    anime({
      targets: '.settings-card',
      opacity: [0, 1],
      translateY: [30, 0],
      duration: 600,
      delay: anime.stagger(100),
      easing: 'easeOutQuart'
    });
  }, [currentView]);

  const handleSaveGeneralSettings = () => {
    setLoading(true);
    // Simulate API call
    setTimeout(() => {
      setLoading(false);
      alert('Settings saved successfully!');
    }, 1000);
  };

  const renderGeneralSettings = () => (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold text-gray-900">General Settings</h2>
          <p className="text-gray-600">Configure your application settings and preferences</p>
        </div>
        <button
          onClick={handleSaveGeneralSettings}
          disabled={loading}
          className="bg-green-600 hover:bg-green-700 disabled:bg-green-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200"
        >
          {loading ? 'Saving...' : 'Save Settings'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Company Information */}
        <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">Company Information</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Company Name</label>
              <input
                type="text"
                value={generalSettings.companyName}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyName: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Address</label>
              <textarea
                value={generalSettings.companyAddress}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyAddress: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                rows={3}
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Phone</label>
              <input
                type="tel"
                value={generalSettings.companyPhone}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyPhone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
              <input
                type="email"
                value={generalSettings.companyEmail}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, companyEmail: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>
          </div>
        </div>

        {/* System Preferences */}
        <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
          <h3 className="text-lg font-semibold text-gray-900 mb-4">System Preferences</h3>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Currency</label>
              <select
                value={generalSettings.currency}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, currency: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="INR">Indian Rupee (₹)</option>
                <option value="USD">US Dollar ($)</option>
                <option value="EUR">Euro (€)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Timezone</label>
              <select
                value={generalSettings.timezone}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, timezone: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="Asia/Kolkata">Asia/Kolkata (IST)</option>
                <option value="America/New_York">America/New_York (EST)</option>
                <option value="Europe/London">Europe/London (GMT)</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Date Format</label>
              <select
                value={generalSettings.dateFormat}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, dateFormat: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="DD/MM/YYYY">DD/MM/YYYY</option>
                <option value="MM/DD/YYYY">MM/DD/YYYY</option>
                <option value="YYYY-MM-DD">YYYY-MM-DD</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Language</label>
              <select
                value={generalSettings.language}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, language: e.target.value }))}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                <option value="English">English</option>
                <option value="Hindi">Hindi</option>
                <option value="Marathi">Marathi</option>
              </select>
            </div>
          </div>
        </div>
      </div>

      {/* Notification Settings */}
      <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Notification Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Email Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications via email</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.emailNotifications}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, emailNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">SMS Notifications</h4>
              <p className="text-sm text-gray-600">Receive notifications via SMS</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.smsNotifications}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, smsNotifications: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
        </div>
      </div>

      {/* Backup Settings */}
      <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Settings</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div className="flex items-center justify-between">
            <div>
              <h4 className="font-medium text-gray-900">Auto Backup</h4>
              <p className="text-sm text-gray-600">Automatically backup data</p>
            </div>
            <label className="relative inline-flex items-center cursor-pointer">
              <input
                type="checkbox"
                checked={generalSettings.autoBackup}
                onChange={(e) => setGeneralSettings(prev => ({ ...prev, autoBackup: e.target.checked }))}
                className="sr-only peer"
              />
              <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-green-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-green-600"></div>
            </label>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Backup Frequency</label>
            <select
              value={generalSettings.backupFrequency}
              onChange={(e) => setGeneralSettings(prev => ({ ...prev, backupFrequency: e.target.value as GeneralSettings['backupFrequency'] }))}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              disabled={!generalSettings.autoBackup}
            >
              <option value="DAILY">Daily</option>
              <option value="WEEKLY">Weekly</option>
              <option value="MONTHLY">Monthly</option>
            </select>
          </div>
        </div>
      </div>
    </div>
  );

  return (
    <div className="p-6">
      {/* Render different views based on currentView */}
      {currentView === 'general' && renderGeneralSettings()}
      {currentView === 'users' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">User Management</h2>
              <p className="text-gray-600">Manage system users and their access</p>
            </div>
            <button
              onClick={() => setShowAddUser(true)}
              className="bg-green-600 hover:bg-green-700 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
              </svg>
              <span>Add User</span>
            </button>
          </div>

          {/* User Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="settings-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Total Users</h3>
              <p className="text-2xl font-bold text-blue-700">{users.length}</p>
            </div>
            <div className="settings-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Active Users</h3>
              <p className="text-2xl font-bold text-green-700">{users.filter(u => u.isActive).length}</p>
            </div>
            <div className="settings-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Admins</h3>
              <p className="text-2xl font-bold text-yellow-700">
                {users.filter(u => u.role === 'SUPER_ADMIN' || u.role === 'ADMIN').length}
              </p>
            </div>
            <div className="settings-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Online Now</h3>
              <p className="text-2xl font-bold text-purple-700">
                {users.filter(u => u.lastLogin && new Date(u.lastLogin) > new Date(Date.now() - 3600000)).length}
              </p>
            </div>
          </div>

          {/* Users Table */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">System Users</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">User</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Email</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Role</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Last Login</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {users.map((user) => (
                    <tr key={user.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6">
                        <div>
                          <div className="font-medium text-gray-900">{user.firstName} {user.lastName}</div>
                          <div className="text-sm text-gray-500">ID: {user.id}</div>
                        </div>
                      </td>
                      <td className="py-4 px-6 text-gray-600">{user.email}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.role === 'SUPER_ADMIN' ? 'bg-red-100 text-red-800' :
                          user.role === 'ADMIN' ? 'bg-purple-100 text-purple-800' :
                          user.role === 'MANAGER' ? 'bg-blue-100 text-blue-800' :
                          user.role === 'FRANCHISE_MANAGER' ? 'bg-orange-100 text-orange-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {user.role.replace('_', ' ')}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {user.lastLogin ? new Date(user.lastLogin).toLocaleDateString() : 'Never'}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          user.isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
                        }`}>
                          {user.isActive ? 'Active' : 'Inactive'}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Edit
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            {user.isActive ? 'Deactivate' : 'Activate'}
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}
      {currentView === 'permissions' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Permissions Management</h2>
              <p className="text-gray-600">Configure role-based access control</p>
            </div>
            <div className="flex items-center space-x-4">
              <select
                value={selectedRole}
                onChange={(e) => setSelectedRole(e.target.value)}
                className="px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
              >
                {rolePermissions.map(role => (
                  <option key={role.roleId} value={role.roleId}>
                    {role.roleName}
                  </option>
                ))}
              </select>
              <button className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium transition-colors duration-200">
                Save Permissions
              </button>
            </div>
          </div>

          {/* Role Overview */}
          <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
            {rolePermissions.map(role => (
              <div
                key={role.roleId}
                className={`settings-card p-4 rounded-xl border-2 cursor-pointer transition-all duration-200 ${
                  selectedRole === role.roleId
                    ? 'border-green-500 bg-green-50'
                    : 'border-gray-200 bg-white hover:border-gray-300'
                }`}
                onClick={() => setSelectedRole(role.roleId)}
              >
                <h3 className="font-medium text-gray-900 mb-2">{role.roleName}</h3>
                <p className="text-sm text-gray-600">{role.permissions.length} permissions</p>
              </div>
            ))}
          </div>

          {/* Permissions Matrix */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">
                Permissions for {rolePermissions.find(r => r.roleId === selectedRole)?.roleName}
              </h3>
            </div>
            <div className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
                {Object.entries(
                  permissions.reduce((groups, permission) => {
                    if (!groups[permission.module]) groups[permission.module] = [];
                    groups[permission.module].push(permission);
                    return groups;
                  }, {} as Record<string, Permission[]>)
                ).map(([module, modulePermissions]) => (
                  <div key={module} className="border border-gray-200 rounded-lg p-4">
                    <h4 className="font-medium text-gray-900 mb-3">{module}</h4>
                    <div className="space-y-3">
                      {modulePermissions.map(permission => {
                        const currentRole = rolePermissions.find(r => r.roleId === selectedRole);
                        const hasPermission = currentRole?.permissions.includes(permission.id) || false;

                        return (
                          <div key={permission.id} className="flex items-start space-x-3">
                            <input
                              type="checkbox"
                              checked={hasPermission}
                              onChange={(e) => {
                                const newRolePermissions = rolePermissions.map(role => {
                                  if (role.roleId === selectedRole) {
                                    return {
                                      ...role,
                                      permissions: e.target.checked
                                        ? [...role.permissions, permission.id]
                                        : role.permissions.filter(p => p !== permission.id)
                                    };
                                  }
                                  return role;
                                });
                                setRolePermissions(newRolePermissions);
                              }}
                              className="mt-1 h-4 w-4 text-green-600 focus:ring-green-500 border-gray-300 rounded"
                            />
                            <div className="flex-1">
                              <div className="text-sm font-medium text-gray-900">{permission.name}</div>
                              <div className="text-xs text-gray-500">{permission.description}</div>
                              <div className="text-xs text-gray-400 mt-1">
                                Action: {permission.action}
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>

          {/* Permission Summary */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 p-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Permission Summary</h3>
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              {rolePermissions.map(role => (
                <div key={role.roleId} className="text-center p-4 bg-gray-50 rounded-lg">
                  <div className="font-medium text-gray-900">{role.roleName}</div>
                  <div className="text-2xl font-bold text-green-600 mt-2">{role.permissions.length}</div>
                  <div className="text-sm text-gray-500">permissions</div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {currentView === 'backup' && (
        <div className="space-y-6">
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">Backup & Restore</h2>
              <p className="text-gray-600">Manage your data backups and restoration</p>
            </div>
            <button
              onClick={() => {
                setIsBackingUp(true);
                setTimeout(() => {
                  setIsBackingUp(false);
                  const newBackup: BackupRecord = {
                    id: Date.now().toString(),
                    fileName: `backup_${new Date().toISOString().split('T')[0]}_manual.sql`,
                    size: '2.5 MB',
                    createdAt: new Date().toISOString(),
                    type: 'MANUAL',
                    status: 'SUCCESS'
                  };
                  setBackupRecords(prev => [newBackup, ...prev]);
                  alert('Backup created successfully!');
                }, 3000);
              }}
              disabled={isBackingUp}
              className="bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white px-6 py-3 rounded-lg font-medium transition-colors duration-200 flex items-center space-x-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M9 19l3 3m0 0l3-3m-3 3V10" />
              </svg>
              <span>{isBackingUp ? 'Creating Backup...' : 'Create Backup'}</span>
            </button>
          </div>

          {/* Backup Statistics */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
            <div className="settings-card bg-blue-50 p-6 rounded-xl border border-blue-200">
              <h3 className="text-sm font-medium text-blue-900 mb-2">Total Backups</h3>
              <p className="text-2xl font-bold text-blue-700">{backupRecords.length}</p>
            </div>
            <div className="settings-card bg-green-50 p-6 rounded-xl border border-green-200">
              <h3 className="text-sm font-medium text-green-900 mb-2">Successful</h3>
              <p className="text-2xl font-bold text-green-700">
                {backupRecords.filter(b => b.status === 'SUCCESS').length}
              </p>
            </div>
            <div className="settings-card bg-yellow-50 p-6 rounded-xl border border-yellow-200">
              <h3 className="text-sm font-medium text-yellow-900 mb-2">Last Backup</h3>
              <p className="text-sm font-bold text-yellow-700">
                {backupRecords.length > 0 ? new Date(backupRecords[0].createdAt).toLocaleDateString() : 'Never'}
              </p>
            </div>
            <div className="settings-card bg-purple-50 p-6 rounded-xl border border-purple-200">
              <h3 className="text-sm font-medium text-purple-900 mb-2">Total Size</h3>
              <p className="text-2xl font-bold text-purple-700">
                {backupRecords.reduce((total, backup) => {
                  const size = parseFloat(backup.size.split(' ')[0]);
                  return total + size;
                }, 0).toFixed(1)} MB
              </p>
            </div>
          </div>

          {/* Backup Actions */}
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Actions</h3>
              <div className="space-y-4">
                <button
                  onClick={() => alert('Full backup initiated!')}
                  className="w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Create Full Backup
                </button>
                <button
                  onClick={() => alert('Database backup initiated!')}
                  className="w-full bg-green-600 hover:bg-green-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Database Only Backup
                </button>
                <button
                  onClick={() => alert('Please select a backup file to restore')}
                  className="w-full bg-orange-600 hover:bg-orange-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Restore from Backup
                </button>
                <button
                  onClick={() => alert('Export settings initiated!')}
                  className="w-full bg-purple-600 hover:bg-purple-700 text-white py-3 px-4 rounded-lg font-medium transition-colors duration-200"
                >
                  Export Settings
                </button>
              </div>
            </div>

            <div className="settings-card bg-white rounded-xl shadow-lg border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">Backup Schedule</h3>
              <div className="space-y-4">
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Daily Backup</div>
                    <div className="text-sm text-gray-600">Every day at 2:00 AM</div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Weekly Full Backup</div>
                    <div className="text-sm text-gray-600">Every Sunday at 1:00 AM</div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                    Active
                  </span>
                </div>
                <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                  <div>
                    <div className="font-medium text-gray-900">Monthly Archive</div>
                    <div className="text-sm text-gray-600">First day of month at 12:00 AM</div>
                  </div>
                  <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800">
                    Inactive
                  </span>
                </div>
              </div>
            </div>
          </div>

          {/* Backup History */}
          <div className="bg-white rounded-xl shadow-lg border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h3 className="text-lg font-semibold text-gray-900">Backup History</h3>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">File Name</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Size</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Type</th>
                    <th className="text-left py-3 px-6 font-semibold text-gray-900">Created</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Status</th>
                    <th className="text-center py-3 px-6 font-semibold text-gray-900">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {backupRecords.map((backup) => (
                    <tr key={backup.id} className="border-b border-gray-100 hover:bg-gray-50">
                      <td className="py-4 px-6 font-medium text-gray-900">{backup.fileName}</td>
                      <td className="py-4 px-6 text-gray-600">{backup.size}</td>
                      <td className="py-4 px-6">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          backup.type === 'MANUAL' ? 'bg-blue-100 text-blue-800' : 'bg-green-100 text-green-800'
                        }`}>
                          {backup.type}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-gray-600">
                        {new Date(backup.createdAt).toLocaleDateString()} {new Date(backup.createdAt).toLocaleTimeString()}
                      </td>
                      <td className="py-4 px-6 text-center">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          backup.status === 'SUCCESS' ? 'bg-green-100 text-green-800' :
                          backup.status === 'FAILED' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {backup.status}
                        </span>
                      </td>
                      <td className="py-4 px-6 text-center">
                        <div className="flex items-center justify-center space-x-2">
                          <button className="text-blue-600 hover:text-blue-800 text-sm font-medium">
                            Download
                          </button>
                          <button className="text-green-600 hover:text-green-800 text-sm font-medium">
                            Restore
                          </button>
                          <button className="text-red-600 hover:text-red-800 text-sm font-medium">
                            Delete
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Add User Modal */}
      {showAddUser && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl p-6 w-full max-w-md mx-4">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">Add New User</h3>
            <form onSubmit={(e) => {
              e.preventDefault();
              if (userForm.password !== userForm.confirmPassword) {
                alert('Passwords do not match');
                return;
              }
              const newUser: User = {
                id: Date.now().toString(),
                firstName: userForm.firstName.trim(),
                lastName: userForm.lastName.trim(),
                email: userForm.email.trim(),
                role: userForm.role,
                isActive: true,
                createdAt: new Date().toISOString()
              };
              setUsers(prev => [...prev, newUser]);
              setUserForm({
                firstName: '',
                lastName: '',
                email: '',
                role: 'COUNTER_OPERATOR',
                password: '',
                confirmPassword: ''
              });
              setShowAddUser(false);
              alert('User added successfully!');
            }} className="space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">First Name *</label>
                  <input
                    type="text"
                    value={userForm.firstName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, firstName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Last Name *</label>
                  <input
                    type="text"
                    value={userForm.lastName}
                    onChange={(e) => setUserForm(prev => ({ ...prev, lastName: e.target.value }))}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                    required
                  />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
                <input
                  type="email"
                  value={userForm.email}
                  onChange={(e) => setUserForm(prev => ({ ...prev, email: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Role *</label>
                <select
                  value={userForm.role}
                  onChange={(e) => setUserForm(prev => ({ ...prev, role: e.target.value as User['role'] }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                >
                  <option value="COUNTER_OPERATOR">Counter Operator</option>
                  <option value="FRANCHISE_MANAGER">Franchise Manager</option>
                  <option value="MANAGER">Manager</option>
                  <option value="ADMIN">Admin</option>
                  <option value="SUPER_ADMIN">Super Admin</option>
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
                <input
                  type="password"
                  value={userForm.password}
                  onChange={(e) => setUserForm(prev => ({ ...prev, password: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Confirm Password *</label>
                <input
                  type="password"
                  value={userForm.confirmPassword}
                  onChange={(e) => setUserForm(prev => ({ ...prev, confirmPassword: e.target.value }))}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-green-500 focus:border-green-500"
                  required
                />
              </div>
              <div className="flex justify-end space-x-3 pt-4">
                <button
                  type="button"
                  onClick={() => setShowAddUser(false)}
                  className="px-4 py-2 text-gray-600 hover:text-gray-800"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-6 py-2 bg-green-600 hover:bg-green-700 text-white rounded-lg font-medium"
                >
                  Add User
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Settings;
