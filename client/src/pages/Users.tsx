import React from 'react';
import { UsersIcon } from '@heroicons/react/24/outline';

const Users: React.FC = () => {
  return (
    <div className="space-y-6">
      <div className="bg-white shadow rounded-lg">
        <div className="px-4 py-5 sm:p-6">
          <h3 className="text-lg leading-6 font-medium text-gray-900 mb-4">
            User Management
          </h3>
          <p className="text-sm text-gray-500 mb-4">
            Manage system users, roles, permissions, and access control across the ERP system.
          </p>
          <div className="bg-gray-50 rounded-lg p-8 text-center">
            <UsersIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">User Administration</h3>
            <p className="mt-1 text-sm text-gray-500">
              Complete user management with role-based access control for Super Admin, Admin, Manager, Franchise Manager, and Counter Operator roles.
            </p>
            <div className="mt-6 space-x-3">
              <button className="btn btn-primary btn-md">
                Add New User
              </button>
              <button className="btn btn-outline btn-md">
                View All Users
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default Users;
