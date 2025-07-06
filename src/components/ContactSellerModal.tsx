'use client';

import { useState, useEffect, useRef, useId } from 'react';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';

interface ContactSellerModalProps {
  isOpen: boolean;
  onClose: () => void;
  listingId: string;
  listingTitle: string;
  sellerName: string;
}

interface FormErrors {
  name?: string;
  email?: string;
  message?: string;
}

export default function ContactSellerModal({ 
  isOpen, 
  onClose, 
  listingId, 
  listingTitle, 
  sellerName 
}: ContactSellerModalProps) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    phone: '',
    message: `Hi! I'm interested in your ${listingTitle}. Is it still available?`
  });
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [formErrors, setFormErrors] = useState<FormErrors>({});
  const [hasAttemptedSubmit, setHasAttemptedSubmit] = useState(false);

  // Accessibility refs and IDs
  const dialogRef = useRef<HTMLDivElement>(null);
  const firstFocusableRef = useRef<HTMLButtonElement>(null);
  const lastFocusableRef = useRef<HTMLButtonElement>(null);
  const previousActiveElement = useRef<HTMLElement | null>(null);
  const nameFieldRef = useRef<HTMLInputElement>(null);
  
  // Generate unique IDs for this instance
  const dialogId = useId();
  const titleId = useId();
  const descriptionId = useId();
  const formStatusId = useId();
  const errorSummaryId = useId();

  const supabase = createClientComponentClient();

  // Form validation
  const validateForm = (): FormErrors => {
    const errors: FormErrors = {};
    
    if (!formData.name.trim()) {
      errors.name = 'Name is required';
    } else if (formData.name.trim().length < 2) {
      errors.name = 'Name must be at least 2 characters';
    }
    
    if (!formData.email.trim()) {
      errors.email = 'Email address is required';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
      errors.email = 'Please enter a valid email address';
    }
    
    if (!formData.message.trim()) {
      errors.message = 'Message is required';
    } else if (formData.message.trim().length < 10) {
      errors.message = 'Message must be at least 10 characters';
    }
    
    return errors;
  };

  // Real-time validation
  useEffect(() => {
    if (hasAttemptedSubmit) {
      const errors = validateForm();
      setFormErrors(errors);
    }
  }, [formData, hasAttemptedSubmit]);

  // Focus management and keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    // Store previously focused element
    previousActiveElement.current = document.activeElement as HTMLElement;

    // Handle keyboard events
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        onClose();
        return;
      }
      
      if (e.key === 'Tab') {
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

    // Focus management function
    const setInitialFocus = () => {
      // Focus the close button initially
      if (firstFocusableRef.current) {
        firstFocusableRef.current.focus();
      }
    };

    // Set focus after modal opens with slight delay for screen readers
    const focusTimeout = setTimeout(setInitialFocus, 150);

    // Add event listeners
    document.addEventListener('keydown', handleKeyDown);

    // Cleanup function
    return () => {
      clearTimeout(focusTimeout);
      document.removeEventListener('keydown', handleKeyDown);
      // Restore focus to previously focused element
      if (previousActiveElement.current) {
        previousActiveElement.current.focus();
      }
    };
  }, [isOpen, onClose]);

  // Announce modal opening to screen readers
  useEffect(() => {
    if (isOpen) {
      const announcement = document.createElement('div');
      announcement.setAttribute('aria-live', 'assertive');
      announcement.setAttribute('aria-atomic', 'true');
      announcement.className = 'sr-only';
      announcement.textContent = `Contact seller dialog opened for ${listingTitle}. Use Tab to navigate, Escape to close.`;
      document.body.appendChild(announcement);
      
      const cleanup = setTimeout(() => {
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      }, 2000);
      
      return () => {
        clearTimeout(cleanup);
        if (document.body.contains(announcement)) {
          document.body.removeChild(announcement);
        }
      };
    }
  }, [isOpen, listingTitle]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setHasAttemptedSubmit(true);
    setError(null);

    const errors = validateForm();
    setFormErrors(errors);

    if (Object.keys(errors).length > 0) {
      // Focus first field with error
      const firstErrorField = Object.keys(errors)[0];
      if (firstErrorField === 'name' && nameFieldRef.current) {
        nameFieldRef.current.focus();
      }
      return;
    }

    setLoading(true);

    try {
      // Here you would typically send the inquiry to your backend
      // For now, we'll simulate the API call
      await new Promise(resolve => setTimeout(resolve, 1000));
      
      // In a real implementation, you would:
      // 1. Save the inquiry to your database
      // 2. Send email notification to the seller
      // 3. Optionally create a conversation thread
      
      setSuccess(true);
      
      // Reset form after successful submission
      setTimeout(() => {
        onClose();
        setSuccess(false);
        setFormData({
          name: '',
          email: '',
          phone: '',
          message: `Hi! I'm interested in your ${listingTitle}. Is it still available?`
        });
        setFormErrors({});
        setHasAttemptedSubmit(false);
      }, 3000);
      
    } catch (err) {
      console.error('Error sending inquiry:', err);
      setError('Failed to send inquiry. Please check your connection and try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear specific field error when user starts typing
    if (formErrors[name as keyof FormErrors]) {
      setFormErrors(prev => ({
        ...prev,
        [name]: undefined
      }));
    }
  };

  const getMessageCharacterCount = () => formData.message.length;
  const hasErrors = Object.keys(formErrors).length > 0;

  if (!isOpen) return null;

  return (
    <>
      {/* Modal Backdrop */}
      <div 
        className="fixed inset-0 bg-black/50 flex items-center justify-center p-4 z-50 transition-opacity duration-md-medium2 ease-md-standard"
        role="presentation"
        onClick={(e) => {
          if (e.target === e.currentTarget) onClose();
        }}
        aria-hidden="true"
      >
        {/* Modal Dialog */}
        <div 
          ref={dialogRef}
          id={dialogId}
          className="bg-md-sys-surface-container-high rounded-3xl max-w-md w-full max-h-[90vh] overflow-y-auto shadow-md-elevation-3 transform transition-all duration-md-medium3 ease-md-emphasized"
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby={descriptionId}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <header className="flex items-center justify-between p-6 border-b border-md-sys-outline-variant">
            <h1 
              id={titleId}
              className="text-md-title-large font-semibold text-md-sys-on-surface"
            >
              Contact {sellerName}
            </h1>
            <button
              ref={firstFocusableRef}
              onClick={onClose}
              className="inline-flex items-center justify-center w-10 h-10 rounded-full text-md-sys-on-surface-variant hover:text-md-sys-on-surface hover:bg-md-sys-on-surface/[0.08] focus:bg-md-sys-on-surface/[0.12] focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard"
              aria-label={`Close contact form dialog for ${listingTitle}`}
              title="Close dialog (Escape key)"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </header>

          {/* Content */}
          <main className="p-6">
            {/* Modal Description for Screen Readers */}
            <div 
              id={descriptionId}
              className="sr-only"
            >
              Contact form to send a message to {sellerName} about the {listingTitle} listing. 
              This form includes fields for your name, email, optional phone number, and message. 
              All fields have validation and will provide feedback. Use Tab to navigate between fields.
            </div>
            
            {/* Global Form Status Live Region */}
            <div 
              id={formStatusId}
              role="status" 
              aria-live="polite" 
              aria-atomic="true"
              className="sr-only"
            >
              {loading ? 'Sending your message to the seller, please wait...' : 
               error ? `Error sending message: ${error}` : 
               success ? `Message sent successfully to ${sellerName}` :
               hasErrors ? `Form has ${Object.keys(formErrors).length} error${Object.keys(formErrors).length !== 1 ? 's' : ''} that need to be corrected` :
               'Contact form ready for submission'}
            </div>
            
            {success ? (
              /* Success State */
              <div 
                className="text-center py-8"
                role="status"
                aria-live="polite"
                aria-labelledby="success-heading"
              >
                <div 
                  className="w-16 h-16 bg-md-sys-secondary-container rounded-full flex items-center justify-center mx-auto mb-4"
                  aria-hidden="true"
                >
                  <svg className="w-8 h-8 text-md-sys-on-secondary-container" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
                  </svg>
                </div>
                <h2 id="success-heading" className="text-md-title-large font-semibold text-md-sys-on-surface mb-2">
                  Message Sent Successfully!
                </h2>
                <p className="text-md-body-medium text-md-sys-on-surface-variant">
                  Your inquiry has been sent to {sellerName}. They will contact you soon.
                </p>
                <div className="sr-only" aria-live="assertive">
                  Success: Your message to {sellerName} about {listingTitle} has been sent successfully. 
                  This dialog will close automatically in a few seconds.
                </div>
              </div>
            ) : (
              /* Contact Form */
              <form 
                onSubmit={handleSubmit} 
                className="space-y-6"
                noValidate
                aria-labelledby="contact-form-heading"
                aria-describedby={hasErrors ? errorSummaryId : undefined}
              >
                <h2 id="contact-form-heading" className="sr-only">
                  Contact Form for {listingTitle} - Send message to {sellerName}
                </h2>

                {/* Error Summary for Screen Readers */}
                {hasErrors && (
                  <div 
                    id={errorSummaryId}
                    role="alert"
                    className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-4 mb-6"
                    aria-labelledby="error-summary-heading"
                  >
                    <h3 id="error-summary-heading" className="text-md-body-medium font-semibold text-md-sys-on-error-container mb-2">
                      Please correct the following errors:
                    </h3>
                    <ul className="text-md-body-small text-md-sys-on-error-container space-y-1">
                      {Object.entries(formErrors).map(([field, errorMsg]) => (
                        <li key={field}>
                          <strong className="capitalize">{field}:</strong> {errorMsg}
                        </li>
                      ))}
                    </ul>
                  </div>
                )}

                {/* Listing Information */}
                <section 
                  className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-4"
                  aria-labelledby="listing-info-heading"
                >
                  <h3 id="listing-info-heading" className="sr-only">Listing Information</h3>
                  <p className="text-md-body-medium text-md-sys-on-surface">
                    <span className="font-medium">Listing:</span> {listingTitle}
                  </p>
                  <div className="sr-only">
                    You are contacting {sellerName} about their listing: {listingTitle}.
                  </div>
                </section>

                {/* Name Field */}
                <div>
                  <label 
                    htmlFor="contact-name" 
                    className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                  >
                    Your Name *
                  </label>
                  <input
                    ref={nameFieldRef}
                    type="text"
                    id="contact-name"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    required
                    aria-describedby="name-desc name-error"
                    aria-invalid={formErrors.name ? 'true' : 'false'}
                    className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none transition-all duration-md-short2 ease-md-standard text-md-body-medium ${
                      formErrors.name 
                        ? 'border-md-sys-error focus:border-md-sys-error focus:ring-2 focus:ring-md-sys-error/20' 
                        : 'border-md-sys-outline focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20'
                    }`}
                    placeholder="Enter your full name"
                  />
                  <div id="name-desc" className="text-xs text-md-sys-on-surface-variant mt-1">
                    Required: Your full name so the seller can identify you
                  </div>
                  {formErrors.name && (
                    <div 
                      id="name-error" 
                      role="alert" 
                      className="text-xs text-md-sys-error mt-1 flex items-center gap-1"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {formErrors.name}
                    </div>
                  )}
                </div>

                {/* Email Field */}
                <div>
                  <label 
                    htmlFor="contact-email" 
                    className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                  >
                    Email Address *
                  </label>
                  <input
                    type="email"
                    id="contact-email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    required
                    aria-describedby="email-desc email-error"
                    aria-invalid={formErrors.email ? 'true' : 'false'}
                    className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none transition-all duration-md-short2 ease-md-standard text-md-body-medium ${
                      formErrors.email 
                        ? 'border-md-sys-error focus:border-md-sys-error focus:ring-2 focus:ring-md-sys-error/20' 
                        : 'border-md-sys-outline focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20'
                    }`}
                    placeholder="your.email@example.com"
                  />
                  <div id="email-desc" className="text-xs text-md-sys-on-surface-variant mt-1">
                    Required: Valid email address for the seller to respond to you
                  </div>
                  {formErrors.email && (
                    <div 
                      id="email-error" 
                      role="alert" 
                      className="text-xs text-md-sys-error mt-1 flex items-center gap-1"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {formErrors.email}
                    </div>
                  )}
                </div>

                {/* Phone Field */}
                <div>
                  <label 
                    htmlFor="contact-phone" 
                    className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                  >
                    Phone Number <span className="text-md-sys-on-surface-variant">(Optional)</span>
                  </label>
                  <input
                    type="tel"
                    id="contact-phone"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    aria-describedby="phone-desc"
                    className="w-full px-4 py-3 border border-md-sys-outline rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20 focus:outline-none transition-all duration-md-short2 ease-md-standard text-md-body-medium"
                    placeholder="(555) 123-4567"
                  />
                  <div id="phone-desc" className="text-xs text-md-sys-on-surface-variant mt-1">
                    Optional: Phone number for direct contact preference
                  </div>
                </div>

                {/* Message Field */}
                <div>
                  <label 
                    htmlFor="contact-message" 
                    className="block text-md-body-medium font-medium text-md-sys-on-surface mb-2"
                  >
                    Message *
                  </label>
                  <textarea
                    id="contact-message"
                    name="message"
                    value={formData.message}
                    onChange={handleInputChange}
                    required
                    rows={4}
                    maxLength={1000}
                    aria-describedby="message-desc message-count message-error"
                    aria-invalid={formErrors.message ? 'true' : 'false'}
                    className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none transition-all duration-md-short2 ease-md-standard text-md-body-medium resize-vertical ${
                      formErrors.message 
                        ? 'border-md-sys-error focus:border-md-sys-error focus:ring-2 focus:ring-md-sys-error/20' 
                        : 'border-md-sys-outline focus:border-md-sys-primary focus:ring-2 focus:ring-md-sys-primary/20'
                    }`}
                    placeholder="Tell the seller what you're interested in..."
                  />
                  <div className="flex justify-between items-start mt-1">
                    <div id="message-desc" className="text-xs text-md-sys-on-surface-variant">
                      Required: Your message to the seller about this listing
                    </div>
                    <div 
                      id="message-count" 
                      className="text-xs text-md-sys-on-surface-variant" 
                      aria-live="polite"
                      aria-label={`${getMessageCharacterCount()} of 1000 characters used`}
                    >
                      {getMessageCharacterCount()}/1000
                    </div>
                  </div>
                  {formErrors.message && (
                    <div 
                      id="message-error" 
                      role="alert" 
                      className="text-xs text-md-sys-error mt-1 flex items-center gap-1"
                      aria-live="polite"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01" />
                      </svg>
                      {formErrors.message}
                    </div>
                  )}
                </div>

                {/* Privacy Notice */}
                <div 
                  className="bg-md-sys-tertiary-container border border-md-sys-outline-variant rounded-xl p-4"
                  role="note"
                  aria-labelledby="privacy-heading"
                >
                  <h4 id="privacy-heading" className="sr-only">Privacy Notice</h4>
                  <p className="text-xs text-md-sys-on-tertiary-container">
                    <strong>Privacy:</strong> Your contact information will only be shared with {sellerName} for this inquiry. We do not store or share your information with third parties.
                  </p>
                </div>

                {/* Global Error Display */}
                {error && (
                  <div 
                    role="alert" 
                    className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-4"
                    aria-labelledby="global-error-heading"
                  >
                    <div className="flex items-start gap-3">
                      <svg className="w-5 h-5 text-md-sys-on-error-container mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.5 0L4.346 15.5c-.77.833.192 2.5 1.732 2.5z" />
                      </svg>
                      <div>
                        <h4 id="global-error-heading" className="text-md-body-medium font-medium text-md-sys-on-error-container">
                          Unable to Send Message
                        </h4>
                        <p className="text-md-body-medium text-md-sys-on-error-container">{error}</p>
                      </div>
                    </div>
                  </div>
                )}

                {/* Action Buttons */}
                <footer className="flex flex-col sm:flex-row gap-3 pt-4">
                  <button
                    type="button"
                    onClick={onClose}
                    className="flex-1 px-6 py-3 border border-md-sys-outline text-md-sys-on-surface rounded-xl hover:bg-md-sys-surface-container-high focus:bg-md-sys-surface-container-high focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 transition-all duration-md-short2 ease-md-standard text-md-label-large font-medium"
                    aria-label="Cancel sending message and close dialog"
                  >
                    Cancel
                  </button>
                  <button
                    ref={lastFocusableRef}
                    type="submit"
                    disabled={loading}
                    aria-describedby="submit-button-desc"
                    className="flex-1 bg-md-sys-primary text-md-sys-on-primary py-3 px-6 rounded-xl hover:bg-md-sys-primary/90 focus:bg-md-sys-primary/90 focus:outline-none focus:ring-2 focus:ring-md-sys-primary focus:ring-offset-2 disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-md-short2 ease-md-standard text-md-label-large font-medium"
                  >
                    {loading ? (
                      <span className="flex items-center justify-center gap-2">
                        <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                        </svg>
                        Sending...
                      </span>
                    ) : (
                      'Send Message'
                    )}
                  </button>
                  <div id="submit-button-desc" className="sr-only">
                    {loading ? 'Please wait while we send your message to the seller.' : 
                     hasErrors ? 'Please correct the form errors before submitting.' :
                     'Click to send your message to the seller. Make sure all required information is filled out correctly.'}
                  </div>
                </footer>
              </form>
            )}
          </main>
        </div>
      </div>
    </>
  );
} 