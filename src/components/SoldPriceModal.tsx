'use client';

import { useState, useEffect } from 'react';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';

interface SoldPriceModalProps {
  isOpen: boolean;
  onClose: () => void;
  onConfirm: (soldPrice?: number) => void;
  listingTitle: string;
  originalPrice: number;
  loading?: boolean;
}

export default function SoldPriceModal({
  isOpen,
  onClose,
  onConfirm,
  listingTitle,
  originalPrice,
  loading = false
}: SoldPriceModalProps) {
  const [mounted, setMounted] = useState(false);
  const [soldPrice, setSoldPrice] = useState<string>('');
  const [error, setError] = useState<string>('');

  useEffect(() => {
    setMounted(true);
  }, []);

  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = 'hidden';
      // Reset state when modal opens
      setSoldPrice('');
      setError('');
    } else {
      document.body.style.overflow = 'unset';
    }

    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [isOpen]);

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Escape') {
      onClose();
    }
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (soldPrice.trim() === '') {
      // Allow empty price (optional)
      onConfirm();
      return;
    }

    const priceNumber = parseFloat(soldPrice);
    if (isNaN(priceNumber) || priceNumber < 0) {
      setError('Please enter a valid price');
      return;
    }

    setError('');
    onConfirm(priceNumber);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const handlePriceChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    // Allow empty string or valid number format
    if (value === '' || /^\d*\.?\d*$/.test(value)) {
      setSoldPrice(value);
      setError('');
    }
  };

  if (!mounted || !isOpen) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
      onKeyDown={handleKeyDown}
      tabIndex={-1}
    >
      <div
        className="relative bg-md-sys-surface-container-high rounded-3xl shadow-md-elevation-3 w-full max-w-md mx-auto border border-md-sys-outline-variant"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
        aria-modal="true"
        aria-labelledby="modal-title"
        aria-describedby="modal-description"
      >
        <form onSubmit={handleSubmit}>
          {/* Header */}
          <div className="p-6 pb-4">
            <div className="flex items-start space-x-4">
              <div className="p-3 rounded-full bg-green-100 flex-shrink-0">
                <MaterialYouIcon 
                  name="currency-dollar" 
                  className="w-6 h-6 text-green-600"
                  aria-hidden={true}
                />
              </div>
              <div className="flex-1 min-w-0">
                <h3 
                  id="modal-title"
                  className="text-md-title-large font-semibold text-md-sys-on-surface mb-2"
                >
                  Mark as Sold
                </h3>
                <p 
                  id="modal-description"
                  className="text-md-body-medium text-md-sys-on-surface-variant"
                >
                  You're marking "{listingTitle}" as sold. Enter the final sale price (optional).
                </p>
              </div>
            </div>
          </div>

          {/* Content */}
          <div className="px-6 pb-4">
            <div className="space-y-4">
              {/* Original Price Display */}
              <div className="bg-md-sys-surface-container rounded-xl p-4 border border-md-sys-outline-variant">
                <div className="flex justify-between items-center">
                  <span className="text-md-body-medium text-md-sys-on-surface-variant">
                    Original Listed Price:
                  </span>
                  <span className="text-md-title-medium font-semibold text-md-sys-on-surface">
                    {formatPrice(originalPrice)}
                  </span>
                </div>
              </div>

              {/* Sold Price Input */}
              <div>
                <label 
                  htmlFor="sold-price"
                  className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
                >
                  Final Sale Price (Optional)
                </label>
                <div className="relative">
                  <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                    <span className="text-md-body-medium text-md-sys-on-surface-variant">$</span>
                  </div>
                  <input
                    id="sold-price"
                    type="text"
                    value={soldPrice}
                    onChange={handlePriceChange}
                    placeholder="Enter sold price"
                    className={`block w-full pl-8 pr-3 py-3 rounded-xl border text-md-body-medium bg-md-sys-surface text-md-sys-on-surface placeholder-md-sys-on-surface-variant/60 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                      error 
                        ? 'border-md-sys-error focus:border-md-sys-error' 
                        : 'border-md-sys-outline focus:border-md-sys-primary'
                    }`}
                    disabled={loading}
                  />
                </div>
                {error && (
                  <p className="mt-2 text-md-body-small text-md-sys-error flex items-center">
                    <MaterialYouIcon name="exclamation-triangle" className="w-4 h-4 mr-1" />
                    {error}
                  </p>
                )}
                <p className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                  Leave empty if you prefer not to share the sale price.
                </p>
              </div>
            </div>
          </div>

          {/* Actions */}
          <div className="p-6 pt-4 border-t border-md-sys-outline-variant">
            <div className="flex justify-end space-x-3">
              <button
                type="button"
                onClick={onClose}
                disabled={loading}
                className="px-6 py-3 rounded-xl border border-md-sys-outline-variant bg-md-sys-surface-container text-md-sys-on-surface hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-large font-medium shadow-md-elevation-1 disabled:opacity-60 disabled:cursor-not-allowed"
              >
                Cancel
              </button>
              <button
                type="submit"
                disabled={loading}
                className="px-6 py-3 rounded-xl bg-green-600 hover:bg-green-600/90 text-white transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-green-600/20 text-md-label-large font-medium shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed flex items-center space-x-2"
              >
                {loading ? (
                  <>
                    <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Marking as Sold...</span>
                  </>
                ) : (
                  <>
                    <MaterialYouIcon name="check" className="w-4 h-4" />
                    <span>Mark as Sold</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
}
