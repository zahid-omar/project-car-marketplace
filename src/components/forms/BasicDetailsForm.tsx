'use client'

import { useState } from 'react'
import { ListingFormData } from '@/app/sell/page'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'
import { Button } from '@/components/ui'

interface BasicDetailsFormProps {
  data: ListingFormData
  updateData: (data: Partial<ListingFormData>) => void
  onNext: () => void
  errors: Record<string, string>
}

export default function BasicDetailsForm({ data, updateData, onNext }: BasicDetailsFormProps) {
  const [localData, setLocalData] = useState({
    title: data.title,
    make: data.make,
    model: data.model,
    year: data.year,
    price: data.price,
    location: data.location,
    description: data.description,
  })

  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})

  const handleInputChange = (field: string, value: string | number) => {
    setLocalData(prev => ({ ...prev, [field]: value }))
    // Clear validation error when user starts typing
    if (validationErrors[field]) {
      setValidationErrors(prev => ({ ...prev, [field]: '' }))
    }
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (!localData.title.trim()) {
      errors.title = 'Title is required'
    } else if (localData.title.length < 10) {
      errors.title = 'Title must be at least 10 characters'
    }

    if (!localData.make.trim()) {
      errors.make = 'Make is required'
    }

    if (!localData.model.trim()) {
      errors.model = 'Model is required'
    }

    if (!localData.year || localData.year < 1900 || localData.year > new Date().getFullYear() + 1) {
      errors.year = 'Please enter a valid year'
    }

    if (!localData.price || localData.price <= 0) {
      errors.price = 'Price must be greater than 0'
    }

    if (!localData.location.trim()) {
      errors.location = 'Location is required'
    }

    if (!localData.description.trim()) {
      errors.description = 'Description is required'
    } else if (localData.description.length < 50) {
      errors.description = 'Description must be at least 50 characters'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      updateData(localData)
      onNext()
    }
  }

  // Auto-generate title when make, model, year change
  const generateTitle = () => {
    if (localData.make && localData.model && localData.year) {
      const generatedTitle = `${localData.year} ${localData.make} ${localData.model}`
      setLocalData(prev => ({ ...prev, title: generatedTitle }))
    }
  }

  const getTitleCharacterCount = () => localData.title.length;
  const getDescriptionCharacterCount = () => localData.description.length;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="space-y-6" aria-labelledby="basic-details-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {hasValidationErrors ? 
          `Form has ${Object.keys(validationErrors).length} validation errors. Please review and correct the highlighted fields.` : 
          'Basic details form ready for input'}
      </div>

      {/* Header */}
      <header className="flex items-center gap-4 pb-6 border-b border-md-sys-outline-variant">
        <div className="p-3 bg-md-sys-primary-container rounded-2xl">
          <MaterialYouIcon name="car" className="w-6 h-6 text-md-sys-on-primary-container" />
        </div>
        <div>
          <h2 id="basic-details-heading" className="text-md-headline-small font-semibold text-md-sys-on-surface mb-1">
            Basic Details
          </h2>
          <p className="text-md-body-medium text-md-sys-on-surface-variant">
            Tell us about your car and set your asking price. All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </header>

      <form noValidate aria-labelledby="basic-details-heading">
        {/* Vehicle Information Section */}
        <fieldset className="space-y-6">
          <legend className="sr-only">Vehicle Information</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Make */}
            <div>
              <label 
                htmlFor="make" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Make *
              </label>
              <input
                type="text"
                id="make"
                name="make"
                value={localData.make}
                onChange={(e) => handleInputChange('make', e.target.value)}
                required
                aria-describedby="make-help make-error"
                aria-invalid={validationErrors.make ? 'true' : 'false'}
                className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                  validationErrors.make ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                }`}
                placeholder="e.g., Honda, Toyota, BMW"
              />
              <div id="make-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Enter the vehicle manufacturer or brand name
              </div>
              {validationErrors.make && (
                <div 
                  id="make-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.make}
                </div>
              )}
            </div>

            {/* Model */}
            <div>
              <label 
                htmlFor="model" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Model *
              </label>
              <input
                type="text"
                id="model"
                name="model"
                value={localData.model}
                onChange={(e) => handleInputChange('model', e.target.value)}
                required
                aria-describedby="model-help model-error"
                aria-invalid={validationErrors.model ? 'true' : 'false'}
                className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                  validationErrors.model ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                }`}
                placeholder="e.g., Civic, Supra, M3"
              />
              <div id="model-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Enter the specific model name or trim level
              </div>
              {validationErrors.model && (
                <div 
                  id="model-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.model}
                </div>
              )}
            </div>

            {/* Year */}
            <div>
              <label 
                htmlFor="year" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Year *
              </label>
              <input
                type="number"
                id="year"
                name="year"
                value={localData.year}
                onChange={(e) => handleInputChange('year', parseInt(e.target.value) || 0)}
                required
                min="1900"
                max={new Date().getFullYear() + 1}
                aria-describedby="year-help year-error"
                aria-invalid={validationErrors.year ? 'true' : 'false'}
                className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                  validationErrors.year ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                }`}
                placeholder="2020"
              />
              <div id="year-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Enter the model year (1900 to {new Date().getFullYear() + 1})
              </div>
              {validationErrors.year && (
                <div 
                  id="year-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.year}
                </div>
              )}
            </div>

            {/* Price */}
            <div>
              <label 
                htmlFor="price" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Asking Price ($) *
              </label>
              <div className="relative">
                <span 
                  className="absolute left-4 top-1/2 -translate-y-1/2 text-md-sys-on-surface-variant pointer-events-none"
                  aria-hidden="true"
                >
                  $
                </span>
                <input
                  type="number"
                  id="price"
                  name="price"
                  value={localData.price}
                  onChange={(e) => handleInputChange('price', parseFloat(e.target.value) || 0)}
                  required
                  min="0"
                  step="100"
                  aria-describedby="price-help price-error"
                  aria-invalid={validationErrors.price ? 'true' : 'false'}
                  className={`w-full pl-8 pr-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                    validationErrors.price ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                  }`}
                  placeholder="25000"
                />
              </div>
              <div id="price-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Enter your asking price in US dollars (minimum $1)
              </div>
              {validationErrors.price && (
                <div 
                  id="price-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.price}
                </div>
              )}
            </div>
          </div>
        </fieldset>

        {/* Listing Details Section */}
        <fieldset className="space-y-6 mt-8">
          <legend className="sr-only">Listing Details</legend>

          {/* Title */}
          <div>
            <div className="flex items-center justify-between mb-2">
              <label 
                htmlFor="title" 
                className="block text-md-label-large font-medium text-md-sys-on-surface"
              >
                Listing Title *
              </label>
              <button
                type="button"
                onClick={generateTitle}
                aria-describedby="auto-generate-help"
                className="flex items-center gap-2 text-md-label-medium text-md-sys-primary hover:bg-md-sys-primary-container px-3 py-1.5 rounded-xl transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
              >
                <MaterialYouIcon name="refresh" className="w-4 h-4" />
                Auto-generate
              </button>
              <div id="auto-generate-help" className="sr-only">
                Click to automatically generate a title using the make, model, and year you entered above
              </div>
            </div>
            <input
              type="text"
              id="title"
              name="title"
              value={localData.title}
              onChange={(e) => handleInputChange('title', e.target.value)}
              required
              maxLength={100}
              aria-describedby="title-help title-counter title-error"
              aria-invalid={validationErrors.title ? 'true' : 'false'}
              className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                validationErrors.title ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
              }`}
              placeholder="e.g., 1995 Mazda RX-7 - Turbo Build Project"
            />
            <div className="flex justify-between items-start mt-2">
              <div className="flex-1">
                {validationErrors.title ? (
                  <div 
                    id="title-error" 
                    role="alert" 
                    className="text-md-body-small text-md-sys-error"
                    aria-live="polite"
                  >
                    {validationErrors.title}
                  </div>
                ) : (
                  <div id="title-help" className="text-md-body-small text-md-sys-on-surface-variant">
                    This will be the main headline for your listing (minimum 10 characters)
                  </div>
                )}
              </div>
              <div 
                id="title-counter" 
                className="text-md-body-small text-md-sys-on-surface-variant ml-2"
                aria-live="polite"
                aria-label={`${getTitleCharacterCount()} of 100 characters used`}
              >
                {getTitleCharacterCount()}/100
              </div>
            </div>
          </div>

          {/* Location */}
          <div>
            <label 
              htmlFor="location" 
              className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
            >
              Location *
            </label>
            <input
              type="text"
              id="location"
              name="location"
              value={localData.location}
              onChange={(e) => handleInputChange('location', e.target.value)}
              required
              aria-describedby="location-help location-error"
              aria-invalid={validationErrors.location ? 'true' : 'false'}
              className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                validationErrors.location ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
              }`}
              placeholder="e.g., Atlanta, GA or 30309"
            />
            {validationErrors.location ? (
              <div 
                id="location-error" 
                role="alert" 
                className="mt-2 text-md-body-small text-md-sys-error"
                aria-live="polite"
              >
                {validationErrors.location}
              </div>
            ) : (
              <div id="location-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Enter city, state, or ZIP code where the vehicle is located
              </div>
            )}
          </div>

          {/* Description */}
          <div>
            <label 
              htmlFor="description" 
              className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
            >
              Description *
            </label>
            <textarea
              id="description"
              name="description"
              rows={6}
              value={localData.description}
              onChange={(e) => handleInputChange('description', e.target.value)}
              required
              maxLength={2000}
              aria-describedby="description-help description-counter description-error"
              aria-invalid={validationErrors.description ? 'true' : 'false'}
              className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 resize-vertical ${
                validationErrors.description ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
              }`}
              placeholder="Describe your car's condition, modifications, history, and what makes it special. Include any known issues or recent work done."
            />
            <div className="flex justify-between items-start mt-2">
              <div className="flex-1">
                {validationErrors.description ? (
                  <div 
                    id="description-error" 
                    role="alert" 
                    className="text-md-body-small text-md-sys-error"
                    aria-live="polite"
                  >
                    {validationErrors.description}
                  </div>
                ) : (
                  <div id="description-help" className="text-md-body-small text-md-sys-on-surface-variant">
                    Detailed description helps buyers understand your car better (minimum 50 characters)
                  </div>
                )}
              </div>
              <div 
                id="description-counter" 
                className="text-md-body-small text-md-sys-on-surface-variant ml-2"
                aria-live="polite"
                aria-label={`${getDescriptionCharacterCount()} of 2000 characters used`}
              >
                {getDescriptionCharacterCount()}/2000
              </div>
            </div>
          </div>
        </fieldset>

        {/* Navigation */}
        <div className="flex justify-end pt-6 border-t border-md-sys-outline-variant mt-8">
          <Button
            variant="filled"
            size="lg"
            onClick={handleNext}
            icon={<MaterialYouIcon name="arrow-right" className="w-5 h-5" />}
            iconPosition="right"
            className="shadow-md-elevation-1 hover:shadow-md-elevation-2"
          >
            Next: Vehicle Specs
          </Button>
        </div>
      </form>
    </section>
  )
} 