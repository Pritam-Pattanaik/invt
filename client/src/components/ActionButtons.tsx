import React from 'react';
import { PencilIcon, TrashIcon, EyeIcon } from '@heroicons/react/24/outline';

interface ActionButtonsProps {
  onView?: () => void;
  onEdit?: () => void;
  onDelete?: () => void;
  canView?: boolean;
  canEdit?: boolean;
  canDelete?: boolean;
  size?: 'sm' | 'md' | 'lg';
  variant?: 'default' | 'minimal';
}

const ActionButtons: React.FC<ActionButtonsProps> = ({
  onView,
  onEdit,
  onDelete,
  canView = true,
  canEdit = true,
  canDelete = true,
  size = 'sm',
  variant = 'default'
}) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-5 h-5',
    lg: 'w-6 h-6'
  };

  const buttonSizeClasses = {
    sm: 'p-1',
    md: 'p-2',
    lg: 'p-3'
  };

  const iconSize = sizeClasses[size];
  const buttonSize = buttonSizeClasses[size];

  if (variant === 'minimal') {
    return (
      <div className="flex items-center space-x-1">
        {canView && onView && (
          <button
            onClick={onView}
            className={`${buttonSize} text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition-colors`}
            title="View Details"
          >
            <EyeIcon className={iconSize} />
          </button>
        )}
        {canEdit && onEdit && (
          <button
            onClick={onEdit}
            className={`${buttonSize} text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition-colors`}
            title="Edit"
          >
            <PencilIcon className={iconSize} />
          </button>
        )}
        {canDelete && onDelete && (
          <button
            onClick={onDelete}
            className={`${buttonSize} text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition-colors`}
            title="Delete"
          >
            <TrashIcon className={iconSize} />
          </button>
        )}
      </div>
    );
  }

  return (
    <div className="flex items-center space-x-2">
      {canView && onView && (
        <button
          onClick={onView}
          className={`${buttonSize} bg-blue-100 text-blue-600 hover:bg-blue-200 rounded-lg transition-colors flex items-center justify-center`}
          title="View Details"
        >
          <EyeIcon className={iconSize} />
        </button>
      )}
      {canEdit && onEdit && (
        <button
          onClick={onEdit}
          className={`${buttonSize} bg-green-100 text-green-600 hover:bg-green-200 rounded-lg transition-colors flex items-center justify-center`}
          title="Edit"
        >
          <PencilIcon className={iconSize} />
        </button>
      )}
      {canDelete && onDelete && (
        <button
          onClick={onDelete}
          className={`${buttonSize} bg-red-100 text-red-600 hover:bg-red-200 rounded-lg transition-colors flex items-center justify-center`}
          title="Delete"
        >
          <TrashIcon className={iconSize} />
        </button>
      )}
    </div>
  );
};

export default ActionButtons;
