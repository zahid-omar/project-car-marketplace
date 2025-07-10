'use client'

import { useState } from 'react';
import { MaterialYouIcon, MaterialYouIconName } from '@/components/ui/MaterialYouIcon';

interface Modification {
  id?: string;
  name: string;
  description: string;
  category: string;
  cost?: number;
  date_installed?: string;
}

interface ModificationCardProps {
  modification: Modification;
  onClick: () => void;
}

export function ModificationCard({ modification, onClick }: ModificationCardProps) {
  const getCategoryIcon = (category: string): MaterialYouIconName => {
    switch (category.toLowerCase()) {
      case 'engine':
        return 'engine';
      case 'suspension':
        return 'speedometer';
      case 'transmission':
        return 'settings';
      case 'interior':
        return 'home';
      case 'body':
        return 'car';
      case 'exhaust':
        return 'arrow-path';
      case 'wheels/tires':
        return 'globe-alt';
      case 'electrical':
        return 'wifi';
      case 'brakes':
        return 'no-symbol';
      default:
        return 'engine';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'engine':
        return 'bg-md-sys-error-container text-md-sys-on-error-container';
      case 'suspension':
        return 'bg-md-sys-tertiary-container text-md-sys-on-tertiary-container';
      case 'transmission':
        return 'bg-md-sys-secondary-container text-md-sys-on-secondary-container';
      case 'interior':
        return 'bg-md-sys-primary-container text-md-sys-on-primary-container';
      case 'body':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'exhaust':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'wheels/tires':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'electrical':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'brakes':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-md-sys-surface-container text-md-sys-on-surface';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <button
      onClick={onClick}
      className="w-full bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-4 hover:bg-md-sys-surface-container-high hover:border-md-sys-outline hover:shadow-md-elevation-1 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-left group"
    >
      <div className="flex items-start gap-3">
        {/* Category Icon */}
        <div className={`p-2 rounded-lg ${getCategoryColor(modification.category)} flex-shrink-0`}>
          <MaterialYouIcon name={getCategoryIcon(modification.category)} className="w-5 h-5" />
        </div>

        {/* Content */}
        <div className="flex-1 min-w-0">
          <div className="flex items-start justify-between gap-2 mb-2">
            <h4 className="font-semibold text-md-sys-on-surface text-md-body-large group-hover:text-md-sys-primary transition-colors truncate">
              {modification.name}
            </h4>
            <MaterialYouIcon 
              name="chevron-right" 
              className="w-5 h-5 text-md-sys-on-surface-variant group-hover:text-md-sys-primary transition-colors flex-shrink-0" 
            />
          </div>

          {/* Category Badge */}
          <div className="flex items-center gap-2 mb-2">
            <span className={`text-md-label-small px-2 py-1 rounded-full ${getCategoryColor(modification.category)}`}>
              {modification.category}
            </span>
            {modification.cost && (
              <span className="text-md-label-small text-md-sys-primary font-medium">
                {formatCurrency(modification.cost)}
              </span>
            )}
          </div>

          {/* Description Preview */}
          <p className="text-md-sys-on-surface-variant text-md-body-medium line-clamp-2">
            {modification.description}
          </p>

          {/* Installation Date */}
          {modification.date_installed && (
            <div className="flex items-center gap-1 mt-2 text-md-sys-on-surface-variant text-md-label-small">
              <MaterialYouIcon name="schedule" className="w-4 h-4" />
              <span>Installed {new Date(modification.date_installed).toLocaleDateString()}</span>
            </div>
          )}
        </div>
      </div>
    </button>
  );
}

interface ModificationDetailModalProps {
  modification: Modification | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ModificationDetailModal({ modification, isOpen, onClose }: ModificationDetailModalProps) {
  if (!isOpen || !modification) return null;

  const getCategoryIcon = (category: string): MaterialYouIconName => {
    switch (category.toLowerCase()) {
      case 'engine':
        return 'engine';
      case 'suspension':
        return 'speedometer';
      case 'transmission':
        return 'settings';
      case 'interior':
        return 'home';
      case 'body':
        return 'car';
      case 'exhaust':
        return 'arrow-path';
      case 'wheels/tires':
        return 'globe-alt';
      case 'electrical':
        return 'wifi';
      case 'brakes':
        return 'no-symbol';
      default:
        return 'engine';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category.toLowerCase()) {
      case 'engine':
        return 'bg-md-sys-error-container text-md-sys-on-error-container';
      case 'suspension':
        return 'bg-md-sys-tertiary-container text-md-sys-on-tertiary-container';
      case 'transmission':
        return 'bg-md-sys-secondary-container text-md-sys-on-secondary-container';
      case 'interior':
        return 'bg-md-sys-primary-container text-md-sys-on-primary-container';
      case 'body':
        return 'bg-purple-100 text-purple-800 dark:bg-purple-900 dark:text-purple-200';
      case 'exhaust':
        return 'bg-orange-100 text-orange-800 dark:bg-orange-900 dark:text-orange-200';
      case 'wheels/tires':
        return 'bg-green-100 text-green-800 dark:bg-green-900 dark:text-green-200';
      case 'electrical':
        return 'bg-yellow-100 text-yellow-800 dark:bg-yellow-900 dark:text-yellow-200';
      case 'brakes':
        return 'bg-red-100 text-red-800 dark:bg-red-900 dark:text-red-200';
      default:
        return 'bg-md-sys-surface-container text-md-sys-on-surface';
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  return (
    <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-3 w-full max-w-lg max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-md-sys-outline-variant">
          <div className="flex items-center gap-3">
            <div className={`p-2 rounded-lg ${getCategoryColor(modification.category)}`}>
              <MaterialYouIcon name={getCategoryIcon(modification.category)} className="w-6 h-6" />
            </div>
            <div>
              <h2 className="text-md-title-large font-semibold text-md-sys-on-surface">
                {modification.name}
              </h2>
              <span className={`text-md-label-medium px-3 py-1 rounded-full ${getCategoryColor(modification.category)}`}>
                {modification.category}
              </span>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-2 hover:bg-md-sys-surface-container-high rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            <MaterialYouIcon name="close" className="w-6 h-6 text-md-sys-on-surface-variant" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          {/* Cost and Date */}
          <div className="grid grid-cols-2 gap-4">
            {modification.cost && (
              <div className="bg-md-sys-surface-container-low rounded-xl p-4">
                <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                  Cost
                </div>
                <div className="text-md-sys-on-surface font-semibold text-md-title-medium">
                  {formatCurrency(modification.cost)}
                </div>
              </div>
            )}
            {modification.date_installed && (
              <div className="bg-md-sys-surface-container-low rounded-xl p-4">
                <div className="text-md-sys-primary font-semibold text-md-label-small uppercase tracking-wide mb-1">
                  Installed
                </div>
                <div className="text-md-sys-on-surface font-semibold text-md-title-medium">
                  {new Date(modification.date_installed).toLocaleDateString()}
                </div>
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <h3 className="text-md-title-medium font-semibold text-md-sys-on-surface mb-3">
              Description
            </h3>
            <div className="text-md-sys-on-surface-variant text-md-body-large whitespace-pre-line">
              {modification.description}
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="p-6 border-t border-md-sys-outline-variant">
          <button
            onClick={onClose}
            className="w-full bg-md-sys-primary text-md-sys-on-primary py-3 px-6 rounded-xl font-medium hover:bg-md-sys-primary/90 transition-colors text-md-label-large focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
