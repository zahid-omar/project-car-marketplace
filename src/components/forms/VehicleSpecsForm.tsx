'use client'

import { useState } from 'react'
import { ListingFormData } from '@/app/sell/page'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'

interface VehicleSpecsFormProps {
  data: ListingFormData
  updateData: (data: Partial<ListingFormData>) => void
  onNext: () => void
  onPrev: () => void
  errors: Record<string, string>
}

export default function VehicleSpecsForm({ data, updateData, onNext, onPrev }: VehicleSpecsFormProps) {
  const [localData, setLocalData] = useState({
    engine: data.engine,
    transmission: data.transmission,
    mileage: data.mileage,
    condition: data.condition,
    vin: data.vin,
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

    if (!localData.engine.trim()) {
      errors.engine = 'Engine information is required'
    }

    if (!localData.transmission.trim()) {
      errors.transmission = 'Transmission information is required'
    }

    if (localData.mileage < 0) {
      errors.mileage = 'Mileage cannot be negative'
    }

    if (!localData.condition) {
      errors.condition = 'Condition is required'
    }

    // VIN validation (optional but if provided, should be valid format)
    if (localData.vin && localData.vin.length > 0) {
      if (localData.vin.length !== 17) {
        errors.vin = 'VIN must be exactly 17 characters'
      } else if (!/^[A-HJ-NPR-Z0-9]+$/i.test(localData.vin)) {
        errors.vin = 'VIN contains invalid characters'
      }
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

  const handlePrev = () => {
    updateData(localData)
    onPrev()
  }

  const conditionOptions = [
    { value: 'excellent', label: 'Excellent', description: 'Like new, no visible wear' },
    { value: 'good', label: 'Good', description: 'Minor wear, well maintained' },
    { value: 'fair', label: 'Fair', description: 'Some wear, needs minor work' },
    { value: 'poor', label: 'Poor', description: 'Significant wear, needs major work' },
    { value: 'project', label: 'Project', description: 'Not running, restoration needed' },
  ]

  const commonEngines = [
    '1.6L I4',
    '2.0L I4',
    '2.4L I4',
    '3.0L V6',
    '3.5L V6',
    '4.0L V6',
    '5.0L V8',
    '6.2L V8',
    'Electric',
    'Hybrid',
    'Other'
  ]

  const commonTransmissions = [
    'Manual 5-speed',
    'Manual 6-speed',
    'Automatic 4-speed',
    'Automatic 6-speed',
    'Automatic 8-speed',
    'CVT',
    'DCT',
    'Other'
  ]

  const getVinCharacterCount = () => (localData.vin || '').length;
  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="space-y-6" aria-labelledby="vehicle-specs-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {hasValidationErrors ? 
          `Form has ${Object.keys(validationErrors).length} validation errors. Please review and correct the highlighted fields.` : 
          'Vehicle specifications form ready for input'}
      </div>

      {/* Header */}
      <header className="flex items-center gap-4 pb-6 border-b border-md-sys-outline-variant">
        <div className="p-3 bg-md-sys-primary-container rounded-2xl">
          <MaterialYouIcon name="settings" className="w-6 h-6 text-md-sys-on-primary-container" />
        </div>
        <div>
          <h2 id="vehicle-specs-heading" className="text-md-headline-small font-semibold text-md-sys-on-surface mb-1">
            Vehicle Specifications
          </h2>
          <p className="text-md-body-medium text-md-sys-on-surface-variant">
            Provide technical details about your vehicle. All fields marked with an asterisk (*) are required.
          </p>
        </div>
      </header>

      <form noValidate aria-labelledby="vehicle-specs-heading">
        {/* Technical Specifications Section */}
        <fieldset className="space-y-6">
          <legend className="sr-only">Technical Specifications</legend>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Engine */}
            <div>
              <label 
                htmlFor="engine" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Engine *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="engine"
                  name="engine"
                  value={localData.engine}
                  onChange={(e) => handleInputChange('engine', e.target.value)}
                  required
                  aria-describedby="engine-help engine-error"
                  aria-invalid={validationErrors.engine ? 'true' : 'false'}
                  className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                    validationErrors.engine ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                  }`}
                  placeholder="e.g., 2.0L Turbo I4, 5.0L V8, LS3 Swap"
                  list="engine-options"
                  aria-expanded="false"
                  role="combobox"
                  aria-autocomplete="list"
                />
                <datalist id="engine-options" role="listbox">
                  {commonEngines.map(engine => (
                    <option key={engine} value={engine} />
                  ))}
                </datalist>
              </div>
              <div id="engine-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Include displacement, configuration, and any modifications. Start typing to see suggestions.
              </div>
              {validationErrors.engine && (
                <div 
                  id="engine-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.engine}
                </div>
              )}
            </div>

            {/* Transmission */}
            <div>
              <label 
                htmlFor="transmission" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Transmission *
              </label>
              <div className="space-y-2">
                <input
                  type="text"
                  id="transmission"
                  name="transmission"
                  value={localData.transmission}
                  onChange={(e) => handleInputChange('transmission', e.target.value)}
                  required
                  aria-describedby="transmission-help transmission-error"
                  aria-invalid={validationErrors.transmission ? 'true' : 'false'}
                  className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                    validationErrors.transmission ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                  }`}
                  placeholder="e.g., Manual 6-speed, Automatic CVT"
                  list="transmission-options"
                  aria-expanded="false"
                  role="combobox"
                  aria-autocomplete="list"
                />
                <datalist id="transmission-options" role="listbox">
                  {commonTransmissions.map(transmission => (
                    <option key={transmission} value={transmission} />
                  ))}
                </datalist>
              </div>
              <div id="transmission-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Type and number of gears. Start typing to see suggestions.
              </div>
              {validationErrors.transmission && (
                <div 
                  id="transmission-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.transmission}
                </div>
              )}
            </div>

            {/* Mileage */}
            <div>
              <label 
                htmlFor="mileage" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                Mileage
              </label>
              <input
                type="number"
                id="mileage"
                name="mileage"
                value={localData.mileage}
                onChange={(e) => handleInputChange('mileage', parseInt(e.target.value) || 0)}
                min="0"
                step="1000"
                aria-describedby="mileage-help mileage-error"
                aria-invalid={validationErrors.mileage ? 'true' : 'false'}
                className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                  validationErrors.mileage ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                }`}
                placeholder="85000"
              />
              <div id="mileage-help" className="mt-2 text-md-body-small text-md-sys-on-surface-variant">
                Total miles on odometer (leave 0 if unknown or not applicable)
              </div>
              {validationErrors.mileage && (
                <div 
                  id="mileage-error" 
                  role="alert" 
                  className="mt-2 text-md-body-small text-md-sys-error"
                  aria-live="polite"
                >
                  {validationErrors.mileage}
                </div>
              )}
            </div>

            {/* VIN */}
            <div>
              <label 
                htmlFor="vin" 
                className="block text-md-label-large font-medium text-md-sys-on-surface mb-2"
              >
                VIN (Optional)
              </label>
              <input
                type="text"
                id="vin"
                name="vin"
                value={localData.vin || ''}
                onChange={(e) => handleInputChange('vin', e.target.value.toUpperCase())}
                maxLength={17}
                aria-describedby="vin-help vin-counter vin-error"
                aria-invalid={validationErrors.vin ? 'true' : 'false'}
                className={`w-full px-4 py-3 border rounded-xl bg-md-sys-surface text-md-sys-on-surface focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 ${
                  validationErrors.vin ? 'border-md-sys-error bg-md-sys-error-container/10' : 'border-md-sys-outline-variant hover:border-md-sys-outline focus:border-md-sys-primary'
                }`}
                placeholder="1HGCM82633A123456"
              />
              <div className="flex justify-between items-start mt-2">
                <div className="flex-1">
                  {validationErrors.vin ? (
                    <div 
                      id="vin-error" 
                      role="alert" 
                      className="text-md-body-small text-md-sys-error"
                      aria-live="polite"
                    >
                      {validationErrors.vin}
                    </div>
                  ) : (
                    <div id="vin-help" className="text-md-body-small text-md-sys-on-surface-variant">
                      17-character Vehicle Identification Number (letters and numbers only)
                    </div>
                  )}
                </div>
                <div 
                  id="vin-counter" 
                  className="text-md-body-small text-md-sys-on-surface-variant ml-2"
                  aria-live="polite"
                  aria-label={`${getVinCharacterCount()} of 17 characters entered`}
                >
                  {getVinCharacterCount()}/17
                </div>
              </div>
            </div>
          </div>
        </fieldset>

        {/* Vehicle Condition Section */}
        <fieldset className="mt-8">
          <legend className="block text-md-label-large font-medium text-md-sys-on-surface mb-3">
            Overall Condition *
          </legend>
          <div 
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4"
            role="radiogroup"
            aria-labelledby="condition-legend"
            aria-describedby="condition-help condition-error"
            aria-required="true"
          >
            <div id="condition-legend" className="sr-only">
              Select the overall condition of your vehicle
            </div>
            <div id="condition-help" className="sr-only">
              Choose the option that best describes your vehicle's current condition. This helps buyers understand what to expect.
            </div>
            {conditionOptions.map((option) => (
              <label
                key={option.value}
                className={`relative flex flex-col p-4 border rounded-xl cursor-pointer hover:bg-md-sys-surface-container/50 focus-within:ring-2 focus-within:ring-md-sys-primary/20 focus-within:ring-offset-1 transition-all duration-200 ${
                  localData.condition === option.value
                    ? 'border-md-sys-primary bg-md-sys-primary-container/20'
                    : 'border-md-sys-outline-variant'
                }`}
              >
                <input
                  type="radio"
                  name="condition"
                  value={option.value}
                  checked={localData.condition === option.value}
                  onChange={(e) => handleInputChange('condition', e.target.value)}
                  aria-describedby={`condition-${option.value}-desc`}
                  className="sr-only"
                />
                <span className="text-md-body-large font-medium text-md-sys-on-surface">{option.label}</span>
                <span 
                  id={`condition-${option.value}-desc`}
                  className="text-md-body-small text-md-sys-on-surface-variant mt-1"
                >
                  {option.description}
                </span>
                {localData.condition === option.value && (
                  <div 
                    className="absolute top-3 right-3"
                    aria-hidden="true"
                  >
                    <div className="h-3 w-3 bg-md-sys-primary rounded-full"></div>
                  </div>
                )}
                <div className="sr-only">
                  {localData.condition === option.value ? 'Selected: ' : 'Not selected: '}
                  {option.label} - {option.description}
                </div>
              </label>
            ))}
          </div>
          {validationErrors.condition && (
            <div 
              id="condition-error" 
              role="alert" 
              className="mt-2 text-md-body-small text-md-sys-error"
              aria-live="polite"
            >
              {validationErrors.condition}
            </div>
          )}
        </fieldset>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-md-sys-outline-variant mt-8">
          <button
            type="button"
            onClick={handlePrev}
            aria-describedby="prev-button-help"
            className="px-6 py-3 bg-md-sys-surface-container text-md-sys-on-surface rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
          >
            Previous: Basic Details
          </button>
          <div id="prev-button-help" className="sr-only">
            Go back to the previous step to edit basic vehicle details
          </div>
          
          <button
            type="button"
            onClick={handleNext}
            aria-describedby="next-button-help"
            className="px-6 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary-container hover:text-md-sys-on-primary-container focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
          >
            Next: Modifications
          </button>
          <div id="next-button-help" className="sr-only">
            Proceed to the next step to enter vehicle modifications. All required fields must be completed before continuing.
          </div>
        </div>
      </form>
    </section>
  )
} 