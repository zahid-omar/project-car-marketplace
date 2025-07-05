'use client';

import { useState, useEffect, useRef } from 'react';
import { OfferWithDetails } from '@/types/offers';

interface CounterOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  originalOffer: OfferWithDetails;
  userRole: 'buyer' | 'seller'; // Whether the current user is buyer or seller of the original offer
  onSuccess?: (counterOffer: OfferWithDetails) => void;
}

export default function CounterOfferModal({ 
  isOpen, 
  onClose, 
  originalOffer, 
  userRole,
  onSuccess 
}: CounterOfferModalProps) {
  const [formData, setFormData] = useState({
    offerAmount: '',
    message: '',
    financingNeeded: false,
    inspectionContingency: true,
    cashOffer: false,
  });
  
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [isValid, setIsValid] = useState(false);

  // Accessibility refs and state
  const modalRef = useRef<HTMLDivElement>(null);
  const closeButtonRef = useRef<HTMLButtonElement>(null);
  const firstFocusableRef = useRef<HTMLInputElement>(null);
  const previouslyFocusedElement = useRef<HTMLElement | null>(null);
  const [statusMessage, setStatusMessage] = useState<string>('');

  const listingPrice = originalOffer.listing.price;
  const originalAmount = originalOffer.offer_amount;
  const counterpartyRole = userRole === 'seller' ? 'buyer' : 'seller';

  // Unique IDs for accessibility
  const modalTitleId = 'counter-offer-modal-title';
  const modalDescId = 'counter-offer-modal-desc';
  const originalOfferSummaryId = 'original-offer-summary';
  const counterAmountId = 'counter-amount';
  const counterMessageId = 'counter-message';
  const offerTermsId = 'offer-terms';
  const statusRegionId = 'status-region';
  const formStatusId = 'form-status';

  useEffect(() => {
    if (isOpen) {
      // Store the previously focused element
      previouslyFocusedElement.current = document.activeElement as HTMLElement;
      
      // Pre-populate with original offer terms but clear amount
      setFormData({
        offerAmount: '',
        message: '',
        financingNeeded: originalOffer.financing_needed,
        inspectionContingency: originalOffer.inspection_contingency,
        cashOffer: originalOffer.cash_offer,
      });
      setError(null);
      setStatusMessage('');

      // Focus the first focusable element after a brief delay
      setTimeout(() => {
        firstFocusableRef.current?.focus();
      }, 100);
    } else {
      // Restore focus when modal closes
      if (previouslyFocusedElement.current) {
        previouslyFocusedElement.current.focus();
      }
    }
  }, [isOpen, originalOffer]);

  useEffect(() => {
    const amount = parseFloat(formData.offerAmount);
    const wasValid = isValid;
    const newIsValid = !isNaN(amount) && 
      amount > 0 && 
      amount <= listingPrice * 2 &&
      amount !== originalAmount;
    
    setIsValid(newIsValid);

    // Announce validation status changes
    if (!wasValid && newIsValid) {
      setStatusMessage('Counter-offer amount is valid and ready to submit.');
    } else if (wasValid && !newIsValid && formData.offerAmount) {
      setStatusMessage('Please enter a valid counter-offer amount different from the original offer.');
    }
  }, [formData.offerAmount, listingPrice, originalAmount, isValid]);

  // Keyboard event handler for modal
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (!isOpen) return;

      if (event.key === 'Escape') {
        event.preventDefault();
        onClose();
      }

      // Focus trapping
      if (event.key === 'Tab') {
        const modal = modalRef.current;
        if (!modal) return;

        const focusableElements = modal.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        const firstElement = focusableElements[0] as HTMLElement;
        const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

        if (event.shiftKey) {
          if (document.activeElement === firstElement) {
            event.preventDefault();
            lastElement.focus();
          }
        } else {
          if (document.activeElement === lastElement) {
            event.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    document.addEventListener('keydown', handleKeyDown);
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isOpen, onClose]);

  const handleInputChange = (field: string, value: string | boolean) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    setError(null);
  };

  const calculatePercentage = (amount: number) => {
    return Math.round((amount / listingPrice) * 100);
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getOfferStatusDescription = (amount: number) => {
    const percentage = calculatePercentage(amount);
    if (percentage >= 95) return 'Excellent offer - very close to asking price';
    if (percentage >= 85) return 'Strong offer - likely to be well received';
    if (percentage >= 75) return 'Fair offer - reasonable starting point';
    if (percentage >= 60) return 'Low offer - may need justification';
    return 'Very low offer - consider including detailed reasoning';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!isValid) return;

    setLoading(true);
    setError(null);
    setStatusMessage('Submitting your counter-offer...');

    try {
      const amount = parseFloat(formData.offerAmount);
      
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          original_offer_id: originalOffer.id,
          offer_amount: amount,
          message: formData.message.trim() || undefined,
          cash_offer: formData.cashOffer,
          financing_needed: formData.financingNeeded,
          inspection_contingency: formData.inspectionContingency,
        }),
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit counter-offer');
      }

      const result = await response.json();
      setStatusMessage(`Counter-offer submitted successfully! The ${counterpartyRole} will be notified.`);
      
      // Brief delay before closing to allow status message to be announced
      setTimeout(() => {
        onSuccess?.(result.offer);
        onClose();
      }, 1500);

    } catch (err: any) {
      console.error('Counter-offer submission error:', err);
      setError(err.message || 'Failed to submit counter-offer');
      setStatusMessage('');
    } finally {
      setLoading(false);
    }
  };

  if (!isOpen) return null;

  const currentAmount = parseFloat(formData.offerAmount) || 0;
  const percentage = currentAmount > 0 ? calculatePercentage(currentAmount) : 0;
  const difference = currentAmount - originalAmount;
  const isHigher = difference > 0;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
      {/* Status region for screen reader announcements */}
      <div
        id={statusRegionId}
        role="status"
        aria-live="polite"
        aria-atomic="true"
        className="sr-only"
      >
        {statusMessage}
      </div>

      <div 
        ref={modalRef}
        role="dialog"
        aria-modal="true"
        aria-labelledby={modalTitleId}
        aria-describedby={modalDescId}
        className="bg-surface rounded-xl elevation-3 w-full max-w-2xl max-h-[90vh] overflow-y-auto"
      >
        {/* Header */}
        <header className="px-6 py-4 border-b border-outline-variant">
          <div className="flex items-center justify-between">
            <div>
              <h1 id={modalTitleId} className="text-headline-small font-semibold text-on-surface">
                Make Counter-Offer
              </h1>
              <p id={modalDescId} className="text-body-medium text-on-surface-variant">
                Responding to {formatPrice(originalAmount)} offer on {originalOffer.listing.title}
              </p>
            </div>
            <button
              ref={closeButtonRef}
              onClick={onClose}
              className="text-on-surface-variant hover:text-on-surface p-2 rounded-full hover:bg-surface-container transition-colors focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2"
              disabled={loading}
              aria-label="Close counter-offer dialog"
              title="Close dialog (Escape key)"
            >
              <span aria-hidden="true">✕</span>
            </button>
          </div>
        </header>

        {/* Content */}
        <main className="px-6 py-4">
          {/* Original Offer Summary */}
          <section 
            id={originalOfferSummaryId}
            className="bg-surface-container rounded-xl p-4 mb-6"
            aria-labelledby="original-offer-title"
          >
            <h2 id="original-offer-title" className="text-title-medium font-medium text-on-surface mb-3">
              Original Offer Details
            </h2>
            <div className="grid grid-cols-2 gap-4 text-body-medium">
              <div>
                <p className="text-on-surface-variant">Original Amount:</p>
                <p className="text-on-surface font-medium">{formatPrice(originalAmount)}</p>
              </div>
              <div>
                <p className="text-on-surface-variant">Asking Price:</p>
                <p className="text-on-surface font-medium">{formatPrice(listingPrice)}</p>
              </div>
            </div>
            <div className="mt-3 flex flex-wrap gap-2" role="list" aria-label="Original offer terms">
              {originalOffer.cash_offer && (
                <span 
                  role="listitem"
                  className="inline-flex items-center px-2 py-1 rounded-full bg-green-100 text-green-800 text-xs font-medium"
                  aria-label="Cash offer - no financing needed"
                >
                  <span aria-hidden="true">💰</span> Cash Offer
                </span>
              )}
              {originalOffer.financing_needed && (
                <span 
                  role="listitem"
                  className="inline-flex items-center px-2 py-1 rounded-full bg-blue-100 text-blue-800 text-xs font-medium"
                  aria-label="Financing needed - contingent on loan approval"
                >
                  <span aria-hidden="true">🏦</span> Financing Needed
                </span>
              )}
              {originalOffer.inspection_contingency && (
                <span 
                  role="listitem"
                  className="inline-flex items-center px-2 py-1 rounded-full bg-yellow-100 text-yellow-800 text-xs font-medium"
                  aria-label="Inspection contingency - subject to satisfactory inspection"
                >
                  <span aria-hidden="true">🔍</span> Inspection Required
                </span>
              )}
            </div>
          </section>

          <form onSubmit={handleSubmit} noValidate role="form" aria-labelledby={modalTitleId}>
            {/* Form status for screen readers */}
            <div
              id={formStatusId}
              role="status"
              aria-live="polite"
              aria-atomic="true"
              className="sr-only"
            >
              {error ? `Error: ${error}` : ''}
            </div>

            <fieldset className="space-y-6">
              <legend className="sr-only">Counter-offer form</legend>

              {/* Counter-Offer Amount */}
              <div>
                <label htmlFor={counterAmountId} className="block text-body-large font-medium text-on-surface mb-2">
                  Your Counter-Offer Amount *
                </label>
                <div className="relative">
                  <span 
                    className="absolute left-3 top-1/2 transform -translate-y-1/2 text-on-surface-variant text-body-large"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    ref={firstFocusableRef}
                    id={counterAmountId}
                    type="number"
                    min="1"
                    max={listingPrice * 2}
                    step="100"
                    value={formData.offerAmount}
                    onChange={(e) => handleInputChange('offerAmount', e.target.value)}
                    className="w-full pl-8 pr-4 py-3 border border-outline rounded-xl text-body-large bg-surface text-on-surface placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:outline-2 focus-visible:outline-primary"
                    placeholder="Enter your counter-offer amount"
                    disabled={loading}
                    required
                    aria-describedby={`${counterAmountId}-help ${counterAmountId}-feedback`}
                    aria-invalid={formData.offerAmount && !isValid ? 'true' : 'false'}
                  />
                </div>
                
                <div id={`${counterAmountId}-help`} className="mt-1 text-body-small text-on-surface-variant">
                  Enter an amount between $1 and {formatPrice(listingPrice * 2)}, different from the original offer of {formatPrice(originalAmount)}.
                </div>
                
                {currentAmount > 0 && (
                  <div id={`${counterAmountId}-feedback`} className="mt-2 space-y-1">
                    <p className="text-body-small text-on-surface-variant">
                      {percentage}% of asking price ({formatPrice(listingPrice)})
                    </p>
                    <p className={`text-body-small font-medium ${
                      isHigher ? 'text-green-600' : 'text-red-600'
                    }`}>
                      {isHigher ? '+' : ''}{formatPrice(difference)} from original offer
                    </p>
                    <p className="text-body-small text-on-surface-variant">
                      {getOfferStatusDescription(currentAmount)}
                    </p>
                  </div>
                )}
              </div>

              {/* Message */}
              <div>
                <label htmlFor={counterMessageId} className="block text-body-large font-medium text-on-surface mb-2">
                  Message to {counterpartyRole.charAt(0).toUpperCase() + counterpartyRole.slice(1)} (Optional)
                </label>
                <textarea
                  id={counterMessageId}
                  rows={4}
                  value={formData.message}
                  onChange={(e) => handleInputChange('message', e.target.value)}
                  className="w-full px-4 py-3 border border-outline rounded-xl text-body-large bg-surface text-on-surface placeholder-on-surface-variant focus:border-primary focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:outline-2 focus-visible:outline-primary resize-none"
                  placeholder="Explain your counter-offer reasoning..."
                  disabled={loading}
                  aria-describedby={`${counterMessageId}-help`}
                  maxLength={500}
                />
                <div id={`${counterMessageId}-help`} className="mt-1 text-body-small text-on-surface-variant">
                  Optional message explaining your counter-offer. {500 - formData.message.length} characters remaining.
                </div>
              </div>

              {/* Terms */}
              <fieldset>
                <legend id={offerTermsId} className="text-title-medium font-medium text-on-surface mb-4">
                  Offer Terms
                </legend>
                <div className="space-y-4" role="group" aria-labelledby={offerTermsId}>
                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.cashOffer}
                      onChange={(e) => handleInputChange('cashOffer', e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary border-outline rounded focus:ring-primary focus:ring-2 focus-visible:outline-2 focus-visible:outline-primary"
                      disabled={loading}
                      aria-describedby="cash-offer-desc"
                    />
                    <div>
                      <span className="text-body-large font-medium text-on-surface group-hover:text-primary">
                        Cash Offer
                      </span>
                      <p id="cash-offer-desc" className="text-body-medium text-on-surface-variant">
                        No financing contingency - funds available immediately
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.financingNeeded}
                      onChange={(e) => handleInputChange('financingNeeded', e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary border-outline rounded focus:ring-primary focus:ring-2 focus-visible:outline-2 focus-visible:outline-primary"
                      disabled={loading}
                      aria-describedby="financing-desc"
                    />
                    <div>
                      <span className="text-body-large font-medium text-on-surface group-hover:text-primary">
                        Financing Needed
                      </span>
                      <p id="financing-desc" className="text-body-medium text-on-surface-variant">
                        Purchase contingent on loan approval from financial institution
                      </p>
                    </div>
                  </label>

                  <label className="flex items-start space-x-3 cursor-pointer group">
                    <input
                      type="checkbox"
                      checked={formData.inspectionContingency}
                      onChange={(e) => handleInputChange('inspectionContingency', e.target.checked)}
                      className="mt-1 h-4 w-4 text-primary border-outline rounded focus:ring-primary focus:ring-2 focus-visible:outline-2 focus-visible:outline-primary"
                      disabled={loading}
                      aria-describedby="inspection-desc"
                    />
                    <div>
                      <span className="text-body-large font-medium text-on-surface group-hover:text-primary">
                        Inspection Contingency
                      </span>
                      <p id="inspection-desc" className="text-body-medium text-on-surface-variant">
                        Purchase subject to satisfactory professional vehicle inspection
                      </p>
                    </div>
                  </label>
                </div>
              </fieldset>
            </fieldset>

            {/* Error Display */}
            {error && (
              <div 
                role="alert"
                aria-live="assertive"
                className="bg-error-container border border-error/20 rounded-xl p-4 mt-6"
              >
                <h3 className="text-on-error-container text-body-large font-medium mb-2">
                  Submission Error
                </h3>
                <p className="text-on-error-container text-body-medium">{error}</p>
              </div>
            )}

            {/* Actions */}
            <footer className="flex justify-end space-x-3 pt-4 mt-6 border-t border-outline-variant">
              <button
                type="button"
                onClick={onClose}
                className="px-6 py-3 text-on-surface bg-surface-container hover:bg-surface-container-high rounded-xl transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 text-label-large font-medium"
                disabled={loading}
                aria-describedby="cancel-button-help"
              >
                Cancel
              </button>
              <span id="cancel-button-help" className="sr-only">
                Close dialog without submitting counter-offer
              </span>
              
              <button
                type="submit"
                disabled={!isValid || loading}
                className="px-6 py-3 bg-primary text-on-primary rounded-xl hover:bg-primary/90 transition-colors focus:outline-none focus:ring-2 focus:ring-primary/20 focus-visible:outline-2 focus-visible:outline-primary focus-visible:outline-offset-2 text-label-large font-medium disabled:opacity-60 disabled:cursor-not-allowed"
                aria-describedby="submit-button-help"
              >
                {loading ? 'Submitting...' : 'Submit Counter-Offer'}
              </button>
              <span id="submit-button-help" className="sr-only">
                {isValid 
                  ? `Submit counter-offer of ${formData.offerAmount ? formatPrice(currentAmount) : ''} to ${counterpartyRole}`
                  : 'Enter a valid counter-offer amount to enable submission'
                }
              </span>
            </footer>
          </form>
        </main>
      </div>
    </div>
  );
} 