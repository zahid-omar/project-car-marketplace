'use client'

import { useState } from 'react';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
import { ModificationCard, ModificationDetailModal } from '@/components/ModificationCard';

interface Modification {
  id?: string;
  name: string;
  description: string;
  category: string;
  cost?: number;
  date_installed?: string;
}

interface ModificationsSectionProps {
  modifications: Modification[];
  className?: string;
}

export default function ModificationsSection({ modifications, className = '' }: ModificationsSectionProps) {
  const [selectedModification, setSelectedModification] = useState<Modification | null>(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const handleModificationClick = (modification: Modification) => {
    setSelectedModification(modification);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedModification(null);
  };

  const getTotalCost = () => {
    return modifications.reduce((total, mod) => total + (mod.cost || 0), 0);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount);
  };

  const getCategoryCount = () => {
    const categories = new Set(modifications.map(mod => mod.category));
    return categories.size;
  };

  if (!modifications || modifications.length === 0) {
    return (
      <div className={`bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6 ${className}`}>
        <div className="flex items-center gap-3 mb-6">
          <div className="p-3 bg-md-sys-primary-container rounded-2xl">
            <MaterialYouIcon name="engine" className="w-6 h-6 text-md-sys-on-primary-container" />
          </div>
          <div>
            <h2 className="text-md-title-large font-semibold text-md-sys-on-surface">
              Modifications
            </h2>
            <p className="text-md-body-medium text-md-sys-on-surface-variant">
              No modifications listed for this vehicle
            </p>
          </div>
        </div>

        <div className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-8 text-center">
          <MaterialYouIcon name="engine" className="w-12 h-12 text-md-sys-on-surface-variant mx-auto mb-3" />
          <p className="text-md-sys-on-surface-variant text-md-body-large">
            This vehicle is currently listed without any modifications.
          </p>
        </div>
      </div>
    );
  }

  return (
    <>
      <div className={`bg-md-sys-surface-container-low rounded-3xl shadow-md-elevation-1 p-6 ${className}`}>
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-3">
            <div className="p-3 bg-md-sys-primary-container rounded-2xl">
              <MaterialYouIcon name="engine" className="w-6 h-6 text-md-sys-on-primary-container" />
            </div>
            <div>
              <h2 className="text-md-title-large font-semibold text-md-sys-on-surface">
                Modifications
              </h2>
              <p className="text-md-body-medium text-md-sys-on-surface-variant">
                {modifications.length} modification{modifications.length !== 1 ? 's' : ''} across {getCategoryCount()} categor{getCategoryCount() !== 1 ? 'ies' : 'y'}
              </p>
            </div>
          </div>

          {/* Summary Stats */}
          <div className="text-right">
            <div className="text-md-title-medium font-semibold text-md-sys-primary">
              {formatCurrency(getTotalCost())}
            </div>
            <div className="text-md-label-medium text-md-sys-on-surface-variant">
              Total Investment
            </div>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-6">
          <div className="bg-md-sys-surface-container rounded-xl p-4 text-center">
            <div className="text-md-title-medium font-semibold text-md-sys-on-surface">
              {modifications.length}
            </div>
            <div className="text-md-label-medium text-md-sys-on-surface-variant">
              Total Mods
            </div>
          </div>
          <div className="bg-md-sys-surface-container rounded-xl p-4 text-center">
            <div className="text-md-title-medium font-semibold text-md-sys-on-surface">
              {getCategoryCount()}
            </div>
            <div className="text-md-label-medium text-md-sys-on-surface-variant">
              Categories
            </div>
          </div>
          <div className="bg-md-sys-surface-container rounded-xl p-4 text-center col-span-2 md:col-span-1">
            <div className="text-md-title-medium font-semibold text-md-sys-primary">
              {formatCurrency(getTotalCost())}
            </div>
            <div className="text-md-label-medium text-md-sys-on-surface-variant">
              Investment
            </div>
          </div>
        </div>

        {/* Modifications Grid */}
        <div className="space-y-3">
          <div className="flex items-center gap-2 mb-4">
            <MaterialYouIcon name="information-circle" className="w-4 h-4 text-md-sys-on-surface-variant" />
            <span className="text-md-body-small text-md-sys-on-surface-variant">
              Click on any modification to view detailed information
            </span>
          </div>
          
          {modifications.map((modification, index) => (
            <ModificationCard
              key={modification.id || index}
              modification={modification}
              onClick={() => handleModificationClick(modification)}
            />
          ))}
        </div>

        {/* View All Link (if many modifications) */}
        {modifications.length > 6 && (
          <div className="mt-6 pt-6 border-t border-md-sys-outline-variant">
            <div className="text-center">
              <span className="text-md-body-medium text-md-sys-on-surface-variant">
                Showing {Math.min(6, modifications.length)} of {modifications.length} modifications
              </span>
            </div>
          </div>
        )}
      </div>

      {/* Detail Modal */}
      <ModificationDetailModal
        modification={selectedModification}
        isOpen={isModalOpen}
        onClose={handleCloseModal}
      />
    </>
  );
}
