'use client';

import { useState, useEffect, useRef } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface MakeOfferModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  listingPrice: number;
  sellerName: string;
}

export default function MakeOfferModal({ 
  isOpen, 
  onClose, 
  listingId, 
  listingTitle, 
  listingPrice,
  sellerName 
}: MakeOfferModalProps) {
  const [formData, setFormData] = useState({
    offerAmount: '',
    message: `Hi! I'd like to make an offer on your ${listingTitle}. Please let me know if this works for you.`,
    financingNeeded: false,
    inspectionContingency: true,
    cashOffer: false
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Accessibility refs and state
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);

  const supabase = createClientComponentClient();

  // Focus management and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Focus management for the modal
    const focusModal = () => {
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    };

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
      } else if (e.key === 'Tab') {
        // Focus trapping
        const focusableElements = dialogRef.current?.querySelectorAll(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        
        if (focusableElements && focusableElements.length > 0) {
          const firstElement = focusableElements[0] as HTMLElement;
          const lastElement = focusableElements[focusableElements.length - 1] as HTMLElement;

          if (e.shiftKey && document.activeElement === firstElement) {
            e.preventDefault();
            lastElement.focus();
          } else if (!e.shiftKey && document.activeElement === lastElement) {
            e.preventDefault();
            firstElement.focus();
          }
        }
      }
    };

    // Set focus after modal opens
    setTimeout(focusModal, 100);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  const getOfferPercentage = () => {
    const offerAmount = parseInt(formData.offerAmount.replace(/[^0-9]/g, ''));
    if (!offerAmount || !listingPrice) return 0;
    return Math.round((offerAmount / listingPrice) * 100);
  };

  const getMessageCharacterCount = () => {
    return formData.message.length;
  };

  const getOfferStatusDescription = () => {
    const percentage = getOfferPercentage();
    if (percentage >= 95) return 'Excellent offer - very close to asking price';
    if (percentage >= 90) return 'Strong offer - competitive price';
    if (percentage >= 80) return 'Fair offer - reasonable negotiation range';
    if (percentage >= 70) return 'Low offer - significant discount requested';
    if (percentage > 0) return 'Very low offer - seller may not accept';
    return '';
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    const offerAmount = parseInt(formData.offerAmount.replace(/[^0-9]/g, ''));
    
    // Validation
    if (!offerAmount || offerAmount <= 0) {
      setError('Please enter a valid offer amount.');
      setLoading(false);
      return;
    }

    if (offerAmount > listingPrice * 1.2) {
      setError('Offer amount seems unusually high. Please check your amount.');
      setLoading(false);
      return;
    }

    try {
      // Submit offer to the API
      const response = await fetch('/api/offers', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          listing_id: listingId,
          offer_amount: offerAmount,
          message: formData.message,
          cash_offer: formData.cashOffer,
          financing_needed: formData.financingNeeded,
          inspection_contingency: formData.inspectionContingency,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Failed to submit offer');
      }
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          offerAmount: '',
          message: `Hi! I'd like to make an offer on your ${listingTitle}. Please let me know if this works for you.`,
          financingNeeded: false,
          inspectionContingency: true,
          cashOffer: false
        });
      }, 3000);
      
    } catch (err: any) {
      console.error('Error submitting offer:', err);
      setError(err.message || 'Failed to submit offer. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleOfferAmountChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value.replace(/[^0-9]/g, '');
    const formattedValue = value ? parseInt(value).toLocaleString() : '';
    setFormData(prev => ({
      ...prev,
      offerAmount: formattedValue
    }));
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value, type } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    }));
  };

  if (!isOpen) return null;

  const offerPercentage = getOfferPercentage();
  const characterCount = getMessageCharacterCount();
  const offerStatusDesc = getOfferStatusDescription();

  return (
    <div 
      className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50"
      role="presentation"
      onClick={(e) => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div 
        ref={dialogRef}
        className="bg-md-sys-surface-container-high rounded-3xl max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-md-elevation-3"
        role="dialog"
        aria-modal="true"
        aria-labelledby="offer-modal-title"
        aria-describedby="offer-modal-description"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <header className="flex items-center justify-between p-6 border-b border-md-sys-outline-variant">
          <h1 
            id="offer-modal-title" 
            className="text-md-title-large font-semibold text-md-sys-on-surface"
          >
            Make an Offer
          </h1>
          <button
            ref={firstFocusableRef}
            onClick={onClose}
            className="text-md-sys-on-surface-variant hover:text-md-sys-on-surface transition-colors duration-200 focus:outline-none focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus-visible:ring-offset-2 rounded-full p-2"
            aria-label="Close make offer dialog"
            title="Close (Escape)"
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </header>

        {/* Content */}
        <main className="p-6">
          <div 
            id="offer-modal-description" 
            className="sr-only"
          >
            Make an offer form for the {listingTitle} listing priced at {formatPrice(listingPrice)}. Submit your offer amount and terms to {sellerName}. All form fields are clearly labeled with descriptions and validation feedback.
          </div>
          
          {success ? (
            <div 
              className="text-center py-8"
              role="status"
              aria-live="polite"
              aria-labelledby="offer-success-heading"
            >
              <div 
                className="w-16 h-16 bg-md-sys-secondary-container rounded-full flex items-center justify-center mx-auto mb-4"
                aria-hidden="true"
              >
                <svg className="w-8 h-8 text-md-sys-on-secondary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                </svg>
              </div>
              <h2 id="offer-success-heading" className="text-md-title-large font-semibold text-md-sys-on-surface mb-2">
                Offer Submitted Successfully!
              </h2>
              <p className="text-md-body-medium text-md-sys-on-surface-variant">
                Your offer has been sent to {sellerName}. You'll be notified when they respond.
              </p>
              <div className="sr-only" aria-live="assertive">
                Success: Your offer for {listingTitle} has been submitted to {sellerName}. This dialog will close automatically in a few seconds.
              </div>
            </div>
          ) : (
            <form 
              onSubmit={handleSubmit} 
              className="space-y-6"
              noValidate
              aria-labelledby="offer-form-heading"
            >
              {/* Form Status Live Region */}
              <div 
                id="form-status" 
                role="status" 
                aria-live="polite" 
                aria-atomic="true"
                className="sr-only"
              >
                {loading ? 'Submitting your offer to the seller...' : 
                 error ? `Error submitting offer: ${error}` : 
                 'Offer form ready for submission'}
              </div>

              <h2 id="offer-form-heading" className="sr-only">
                Make an Offer Form for {listingTitle} priced at {formatPrice(listingPrice)}
              </h2>

              {/* Listing Info */}
              <section 
                className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-4"
                aria-labelledby="listing-info-heading"
              >
                <h3 id="listing-info-heading" className="sr-only">Listing Information</h3>
                <p className="text-md-body-medium text-md-sys-on-surface mb-2">
                  <span className="font-medium">Listing:</span> {listingTitle}
                </p>
                <p className="text-md-body-medium text-md-sys-on-surface">
                  <span className="font-medium">Asking Price:</span> {formatPrice(listingPrice)}
                </p>
                <div className="sr-only">
                  You are making an offer on {listingTitle} which is listed for {formatPrice(listingPrice)} by seller {sellerName}.
                </div>
              </section>

              {/* Offer Amount */}
              <div>
                <label 
                  htmlFor="offer-amount" 
                  className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                >
                  Your Offer Amount *
                </label>
                <div className="relative">
                  <span 
                    className="absolute left-4 top-1/2 -translate-y-1/2 text-md-sys-on-surface-variant pointer-events-none"
                    aria-hidden="true"
                  >
                    $
                  </span>
                  <input
                    type="text"
                    id="offer-amount"
                    name="offerAmount"
                    value={formData.offerAmount}
                    onChange={handleOfferAmountChange}
                    required
                    aria-describedby="offer-amount-desc offer-amount-feedback offer-amount-help"
                    aria-invalid={error && error.includes('offer amount') ? 'true' : 'false'}
                    className="w-full pl-10 pr-4 py-4 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus:outline-none transition-all duration-200 text-lg font-medium"
                    placeholder="Enter your offer amount"
                  />
                </div>
                <div id="offer-amount-desc" className="text-xs text-md-sys-on-surface-variant mt-1">
                  Required: Enter your offer amount in dollars (numbers only, formatting will be applied automatically)
                </div>
                <div id="offer-amount-help" className="sr-only">
                  Type numbers only for your offer amount. The dollar sign and formatting will be added automatically. 
                  This field is required to submit your offer.
                </div>
                {formData.offerAmount && (
                  <div 
                    id="offer-amount-feedback" 
                    className="mt-3 p-3 bg-md-sys-surface-container border border-md-sys-outline-variant rounded-lg"
                    role="status"
                    aria-live="polite"
                  >
                    <div className="flex items-center justify-between text-xs">
                      <span 
                        className={`font-medium ${
                          offerPercentage >= 90 ? 'text-md-sys-primary' : 
                          offerPercentage >= 80 ? 'text-md-sys-tertiary' : 
                          'text-md-sys-error'
                        }`}
                        aria-label={`Your offer is ${offerPercentage} percent of the asking price`}
                      >
                        {offerPercentage}% of asking price
                      </span>
                      <span 
                        className="text-md-sys-on-surface-variant"
                        aria-label={`Price difference: ${formatPrice(listingPrice - parseInt(formData.offerAmount.replace(/[^0-9]/g, '') || '0'))}`}
                      >
                        Difference: {formatPrice(listingPrice - parseInt(formData.offerAmount.replace(/[^0-9]/g, '') || '0'))}
                      </span>
                    </div>
                    {offerStatusDesc && (
                      <div className="mt-2 text-xs text-md-sys-on-surface">
                        {offerStatusDesc}
                      </div>
                    )}
                    <div className="sr-only">
                      Your offer of ${formData.offerAmount} represents {offerPercentage}% of the {formatPrice(listingPrice)} asking price, 
                      with a difference of {formatPrice(listingPrice - parseInt(formData.offerAmount.replace(/[^0-9]/g, '') || '0'))}. 
                      {offerStatusDesc}
                    </div>
                  </div>
                )}
              </div>

              {/* Offer Terms */}
              <fieldset>
                <legend className="text-md-body-medium font-medium text-md-sys-on-surface mb-3">
                  Offer Terms and Conditions
                </legend>
                <div 
                  className="space-y-3"
                  role="group"
                  aria-labelledby="offer-terms-desc"
                >
                  <div id="offer-terms-desc" className="sr-only">
                    Select the terms and conditions that apply to your offer. You can choose multiple options.
                  </div>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="cashOffer"
                      checked={formData.cashOffer}
                      onChange={handleInputChange}
                      aria-describedby="cash-offer-desc"
                      className="w-4 h-4 text-md-sys-primary border-md-sys-outline rounded focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus-visible:ring-offset-1 mt-0.5"
                    />
                    <span className="ml-2 text-md-body-medium text-md-sys-on-surface">
                      This is a cash offer (no financing needed)
                    </span>
                    <div id="cash-offer-desc" className="sr-only">
                      Check this if you will pay cash and do not need financing or a loan to complete the purchase.
                    </div>
                  </label>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="financingNeeded"
                      checked={formData.financingNeeded}
                      onChange={handleInputChange}
                      aria-describedby="financing-desc"
                      className="w-4 h-4 text-md-sys-primary border-md-sys-outline rounded focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus-visible:ring-offset-1 mt-0.5"
                    />
                    <span className="ml-2 text-md-body-medium text-md-sys-on-surface">
                      Financing required (subject to loan approval)
                    </span>
                    <div id="financing-desc" className="sr-only">
                      Check this if you need financing or a loan to complete the purchase. Your offer will be contingent on loan approval.
                    </div>
                  </label>
                  
                  <label className="flex items-start">
                    <input
                      type="checkbox"
                      name="inspectionContingency"
                      checked={formData.inspectionContingency}
                      onChange={handleInputChange}
                      aria-describedby="inspection-desc"
                      className="w-4 h-4 text-md-sys-primary border-md-sys-outline rounded focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus-visible:ring-offset-1 mt-0.5"
                    />
                    <span className="ml-2 text-md-body-medium text-md-sys-on-surface">
                      Subject to satisfactory inspection
                    </span>
                    <div id="inspection-desc" className="sr-only">
                      Check this if your offer is contingent on a satisfactory vehicle inspection. You can withdraw your offer if inspection reveals significant issues.
                    </div>
                  </label>
                </div>
              </fieldset>

              {/* Message */}
              <div>
                <label 
                  htmlFor="message" 
                  className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                >
                  Message to Seller
                </label>
                <textarea
                  id="message"
                  name="message"
                  value={formData.message}
                  onChange={handleInputChange}
                  rows={3}
                  maxLength={500}
                  aria-describedby="message-desc message-counter"
                  className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus-visible:ring-2 focus-visible:ring-md-sys-primary/20 focus:border-md-sys-primary focus:outline-none transition-all duration-200 text-md-body-medium resize-vertical"
                  placeholder="Add any additional details about your offer..."
                />
                <div className="flex justify-between items-center mt-1">
                  <div id="message-desc" className="text-xs text-md-sys-on-surface-variant">
                    Optional: Add a personal message or additional details about your offer
                  </div>
                  <div 
                    id="message-counter" 
                    className="text-xs text-md-sys-on-surface-variant"
                    aria-live="polite"
                    aria-label={`${characterCount} of 500 characters used`}
                  >
                    {characterCount}/500
                  </div>
                </div>
              </div>

              {/* Disclaimer */}
              <div 
                className="bg-md-sys-tertiary-container border border-md-sys-outline-variant rounded-xl p-4"
                role="note"
                aria-labelledby="disclaimer-heading"
              >
                <h4 id="disclaimer-heading" className="sr-only">Important Notice</h4>
                <p className="text-xs text-md-sys-on-tertiary-container">
                  <strong>Note:</strong> This offer is not legally binding until both parties agree to terms and conditions. 
                  The seller may accept, reject, or counter your offer.
                </p>
              </div>

              {/* Error Display */}
              {error && (
                <div 
                  className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-4"
                  role="alert"
                  aria-labelledby="error-heading"
                >
                  <h4 id="error-heading" className="sr-only">Error</h4>
                  <p className="text-md-body-medium text-md-sys-on-error-container">{error}</p>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-3 pt-4">
                <button
                  type="button"
                  onClick={onClose}
                  className="flex-1 px-6 py-3 border border-md-sys-outline text-md-sys-on-surface rounded-xl hover:bg-md-sys-surface-container-high transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-large font-medium"
                  aria-label="Cancel making an offer and close dialog"
                >
                  Cancel
                </button>
                <button
                  ref={lastFocusableRef}
                  type="submit"
                  disabled={loading}
                  aria-describedby="submit-button-desc"
                  className="flex-1 bg-md-sys-primary text-md-sys-on-primary py-3 px-6 rounded-xl hover:bg-md-sys-primary/90 transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary disabled:opacity-60 disabled:cursor-not-allowed text-md-label-large font-medium"
                >
                  {loading ? 'Submitting...' : 'Submit Offer'}
                </button>
                <div id="submit-button-desc" className="sr-only">
                  {loading ? 'Please wait while your offer is being submitted to the seller.' : 
                   'Submit your offer to the seller. Make sure all information is correct before submitting.'}
                </div>
              </div>
            </form>
          )}
        </main>
      </div>
    </div>
  );
} 