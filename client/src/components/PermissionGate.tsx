import React from 'react';
import type { User } from '../contexts/AuthContext';
import type { Permission } from '../utils/permissions';
import { PermissionChecker } from '../utils/permissions';

interface PermissionGateProps {
  user: User | null;
  permission: Permission | Permission[];
  fallback?: React.ReactNode;
  children: React.ReactNode;
}

export const PermissionGate: React.FC<PermissionGateProps> = ({ 
  user, 
  permission, 
  fallback, 
  children 
}) => {
  const permissions = Array.isArray(permission) ? permission : [permission];
  const checker = new PermissionChecker(user);
  
  if (checker.hasAnyPermission(permissions)) {
    return <>{children}</>;
  }
  
  return <>{fallback || null}</>;
};

export default PermissionGate;
