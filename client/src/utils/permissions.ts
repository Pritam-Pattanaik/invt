import type { User } from '../contexts/AuthContext';

// Permission types
export type Permission = 
  | 'VIEW_ALL'
  | 'EDIT_ALL'
  | 'DELETE_ALL'
  | 'MANAGE_USERS'
  | 'MANAGE_SETTINGS'
  | 'VIEW_SALES'
  | 'EDIT_SALES'
  | 'DELETE_SALES'
  | 'VIEW_INVENTORY'
  | 'EDIT_INVENTORY'
  | 'DELETE_INVENTORY'
  | 'VIEW_FINANCE'
  | 'EDIT_FINANCE'
  | 'DELETE_FINANCE'
  | 'VIEW_HR'
  | 'EDIT_HR'
  | 'DELETE_HR'
  | 'VIEW_REPORTS'
  | 'EXPORT_REPORTS'
  | 'MANAGE_COUNTERS'
  | 'MANAGE_FRANCHISES';

// Role-based permissions mapping
export const rolePermissions: Record<string, Permission[]> = {
  SUPER_ADMIN: [
    'VIEW_ALL',
    'EDIT_ALL',
    'DELETE_ALL',
    'MANAGE_USERS',
    'MANAGE_SETTINGS',
    'VIEW_SALES',
    'EDIT_SALES',
    'DELETE_SALES',
    'VIEW_INVENTORY',
    'EDIT_INVENTORY',
    'DELETE_INVENTORY',
    'VIEW_FINANCE',
    'EDIT_FINANCE',
    'DELETE_FINANCE',
    'VIEW_HR',
    'EDIT_HR',
    'DELETE_HR',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_COUNTERS',
    'MANAGE_FRANCHISES'
  ],
  ADMIN: [
    'VIEW_SALES',
    'EDIT_SALES',
    'VIEW_INVENTORY',
    'EDIT_INVENTORY',
    'VIEW_FINANCE',
    'EDIT_FINANCE',
    'VIEW_HR',
    'EDIT_HR',
    'VIEW_REPORTS',
    'EXPORT_REPORTS',
    'MANAGE_COUNTERS'
  ],
  MANAGER: [
    'VIEW_SALES',
    'EDIT_SALES',
    'VIEW_INVENTORY',
    'EDIT_INVENTORY',
    'VIEW_FINANCE',
    'VIEW_HR',
    'VIEW_REPORTS',
    'EXPORT_REPORTS'
  ],
  FRANCHISE_MANAGER: [
    'VIEW_SALES',
    'EDIT_SALES',
    'VIEW_INVENTORY',
    'VIEW_REPORTS',
    'MANAGE_COUNTERS'
  ],
  COUNTER_OPERATOR: [
    'VIEW_SALES',
    'VIEW_INVENTORY'
  ]
};

// Permission checker utility
export class PermissionChecker {
  private user: User | null;

  constructor(user: User | null) {
    this.user = user;
  }

  // Check if user has specific permission
  hasPermission(permission: Permission): boolean {
    if (!this.user) return false;
    
    const userPermissions = rolePermissions[this.user.role] || [];
    return userPermissions.includes(permission);
  }

  // Check if user has any of the specified permissions
  hasAnyPermission(permissions: Permission[]): boolean {
    return permissions.some(permission => this.hasPermission(permission));
  }

  // Check if user has all of the specified permissions
  hasAllPermissions(permissions: Permission[]): boolean {
    return permissions.every(permission => this.hasPermission(permission));
  }

  // SuperAdmin specific checks
  isSuperAdmin(): boolean {
    return this.user?.role === 'SUPER_ADMIN';
  }

  // Can view data
  canView(module: 'SALES' | 'INVENTORY' | 'FINANCE' | 'HR' | 'REPORTS'): boolean {
    if (this.isSuperAdmin()) return true;
    
    switch (module) {
      case 'SALES':
        return this.hasPermission('VIEW_SALES');
      case 'INVENTORY':
        return this.hasPermission('VIEW_INVENTORY');
      case 'FINANCE':
        return this.hasPermission('VIEW_FINANCE');
      case 'HR':
        return this.hasPermission('VIEW_HR');
      case 'REPORTS':
        return this.hasPermission('VIEW_REPORTS');
      default:
        return false;
    }
  }

  // Can edit data
  canEdit(module: 'SALES' | 'INVENTORY' | 'FINANCE' | 'HR' | 'ALL'): boolean {
    if (this.isSuperAdmin()) return true;
    
    switch (module) {
      case 'SALES':
        return this.hasPermission('EDIT_SALES');
      case 'INVENTORY':
        return this.hasPermission('EDIT_INVENTORY');
      case 'FINANCE':
        return this.hasPermission('EDIT_FINANCE');
      case 'HR':
        return this.hasPermission('EDIT_HR');
      case 'ALL':
        return this.hasPermission('EDIT_ALL');
      default:
        return false;
    }
  }

  // Can delete data
  canDelete(module: 'SALES' | 'INVENTORY' | 'FINANCE' | 'HR' | 'ALL'): boolean {
    if (this.isSuperAdmin()) return true;
    
    switch (module) {
      case 'SALES':
        return this.hasPermission('DELETE_SALES');
      case 'INVENTORY':
        return this.hasPermission('DELETE_INVENTORY');
      case 'FINANCE':
        return this.hasPermission('DELETE_FINANCE');
      case 'HR':
        return this.hasPermission('DELETE_HR');
      case 'ALL':
        return this.hasPermission('DELETE_ALL');
      default:
        return false;
    }
  }

  // Can manage users
  canManageUsers(): boolean {
    return this.hasPermission('MANAGE_USERS');
  }

  // Can manage settings
  canManageSettings(): boolean {
    return this.hasPermission('MANAGE_SETTINGS');
  }

  // Can export reports
  canExportReports(): boolean {
    return this.hasPermission('EXPORT_REPORTS');
  }

  // Can manage counters
  canManageCounters(): boolean {
    return this.hasPermission('MANAGE_COUNTERS');
  }

  // Can manage franchises
  canManageFranchises(): boolean {
    return this.hasPermission('MANAGE_FRANCHISES');
  }

  // Get user's role display name
  getRoleDisplayName(): string {
    if (!this.user) return 'Guest';
    
    switch (this.user.role) {
      case 'SUPER_ADMIN':
        return 'Super Administrator';
      case 'ADMIN':
        return 'Administrator';
      case 'MANAGER':
        return 'Manager';
      case 'FRANCHISE_MANAGER':
        return 'Franchise Manager';
      case 'COUNTER_OPERATOR':
        return 'Counter Operator';
      default:
        return this.user.role;
    }
  }

  // Get available actions for a module
  getAvailableActions(module: 'SALES' | 'INVENTORY' | 'FINANCE' | 'HR'): {
    canView: boolean;
    canEdit: boolean;
    canDelete: boolean;
  } {
    return {
      canView: this.canView(module),
      canEdit: this.canEdit(module),
      canDelete: this.canDelete(module)
    };
  }
}

// Hook for using permissions in components
export const usePermissions = (user: User | null) => {
  return new PermissionChecker(user);
};

// Permission checker utility for use in components
export const checkPermission = (
  user: User | null,
  permission: Permission | Permission[]
): boolean => {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const checker = new PermissionChecker(user);
  return checker.hasAnyPermission(permissions);
};
