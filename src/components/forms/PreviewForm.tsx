'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ListingFormData } from '@/app/sell/page'
import { PencilIcon } from '@heroicons/react/24/outline'

interface PreviewFormProps {
  data: ListingFormData
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
  errors: Record<string, string>
  goToStep: (step: number) => void
}

export default function PreviewForm({ 
  data, 
  onPrev, 
  onSubmit, 
  isSubmitting, 
  errors, 
  goToStep 
}: PreviewFormProps) {
  const [termsAccepted, setTermsAccepted] = useState(false)
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
    }).format(amount)
  }

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-US').format(num)
  }

  const totalModificationCost = data.modifications.reduce((total, mod) => {
    return total + (mod.cost || 0)
  }, 0)

  const primaryImage = data.images.find(img => img.is_primary) || data.images[0]

  const handleSubmit = () => {
    if (termsAccepted) {
      onSubmit()
    }
  }

  return (
    <section className="space-y-6" aria-labelledby="preview-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {isSubmitting ? 'Creating your listing. Please wait...' : 
         errors.submit ? 'There was an error submitting your listing. Please check the details and try again.' :
         'Review your listing details before publishing'}
      </div>

      {/* Header */}
      <header>
        <h2 id="preview-heading" className="text-2xl font-bold text-gray-900 mb-2">
          Review Your Listing
        </h2>
        <p className="text-gray-600">
          Please review all information below before submitting your listing. You can edit any section by clicking the edit buttons.
        </p>
      </header>

      {/* Submission Errors */}
      {errors.submit && (
        <div 
          className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm"
          role="alert"
          aria-labelledby="submit-error-heading"
        >
          <h3 id="submit-error-heading" className="sr-only">Submission Error</h3>
          {errors.submit}
        </div>
      )}

      {/* Preview Card */}
      <article 
        className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-sm"
        aria-labelledby="listing-preview-heading"
      >
        <h3 id="listing-preview-heading" className="sr-only">
          Listing Preview
        </h3>
        
        {/* Primary Image */}
        {primaryImage && (
          <div className="aspect-video w-full bg-gray-100 relative">
            <Image
              src={primaryImage.preview}
              alt={`Primary image of ${data.title} - ${data.year} ${data.make} ${data.model}`}
              fill
              className="object-cover"
            />
          </div>
        )}

        <div className="p-6">
          {/* Title and Price */}
          <section aria-labelledby="basic-info-heading">
            <h4 id="basic-info-heading" className="sr-only">Basic Information</h4>
            <div className="flex justify-between items-start mb-4">
              <div>
                <h5 className="text-xl font-bold text-gray-900">{data.title}</h5>
                <p className="text-gray-600">{data.location}</p>
              </div>
              <div className="text-right">
                <p 
                  className="text-2xl font-bold text-green-600"
                  aria-label={`Asking price: ${formatCurrency(data.price)}`}
                >
                  {formatCurrency(data.price)}
                </p>
                <button
                  onClick={() => goToStep(1)}
                  className="text-sm text-automotive-accent hover:text-blue-600 flex items-center mt-1 focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                  aria-describedby="edit-basic-help"
                >
                  <PencilIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  Edit
                </button>
                <div id="edit-basic-help" className="sr-only">
                  Edit basic details including title, price, year, make, model, and description
                </div>
              </div>
            </div>
          </section>

          {/* Vehicle Details */}
          <section aria-labelledby="vehicle-details-heading">
            <h4 id="vehicle-details-heading" className="sr-only">Vehicle Details Summary</h4>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-gray-50 rounded-lg" role="list">
              <div role="listitem">
                <p className="text-sm text-gray-500">Year</p>
                <p className="font-medium" aria-label={`Year: ${data.year}`}>{data.year}</p>
              </div>
              <div role="listitem">
                <p className="text-sm text-gray-500">Make</p>
                <p className="font-medium" aria-label={`Make: ${data.make}`}>{data.make}</p>
              </div>
              <div role="listitem">
                <p className="text-sm text-gray-500">Model</p>
                <p className="font-medium" aria-label={`Model: ${data.model}`}>{data.model}</p>
              </div>
              <div role="listitem">
                <p className="text-sm text-gray-500">Mileage</p>
                <p 
                  className="font-medium" 
                  aria-label={`Mileage: ${data.mileage ? `${formatNumber(data.mileage)} miles` : 'Unknown'}`}
                >
                  {data.mileage ? formatNumber(data.mileage) : 'Unknown'}
                </p>
              </div>
            </div>
          </section>

          {/* Description */}
          <section aria-labelledby="description-heading">
            <div className="mb-6">
              <div className="flex justify-between items-center mb-2">
                <h4 id="description-heading" className="text-lg font-medium text-gray-900">
                  Description
                </h4>
                <button
                  onClick={() => goToStep(1)}
                  className="text-sm text-automotive-accent hover:text-blue-600 flex items-center focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                  aria-describedby="edit-description-help"
                >
                  <PencilIcon className="w-4 h-4 mr-1" aria-hidden="true" />
                  Edit
                </button>
                <div id="edit-description-help" className="sr-only">
                  Edit the description of your vehicle
                </div>
              </div>
              <p className="text-gray-700 whitespace-pre-wrap">{data.description}</p>
            </div>
          </section>
        </div>
      </article>

      {/* Vehicle Specifications */}
      <section 
        className="bg-white border border-gray-200 rounded-lg p-6"
        aria-labelledby="specs-section-heading"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="specs-section-heading" className="text-lg font-medium text-gray-900">
            Vehicle Specifications
          </h3>
          <button
            onClick={() => goToStep(2)}
            className="text-sm text-automotive-accent hover:text-blue-600 flex items-center focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
            aria-describedby="edit-specs-help"
          >
            <PencilIcon className="w-4 h-4 mr-1" aria-hidden="true" />
            Edit
          </button>
          <div id="edit-specs-help" className="sr-only">
            Edit vehicle specifications including engine, transmission, condition, and VIN
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
          <div role="listitem">
            <p className="text-sm text-gray-500">Engine</p>
            <p className="font-medium" aria-label={`Engine: ${data.engine}`}>{data.engine}</p>
          </div>
          <div role="listitem">
            <p className="text-sm text-gray-500">Transmission</p>
            <p className="font-medium" aria-label={`Transmission: ${data.transmission}`}>{data.transmission}</p>
          </div>
          <div role="listitem">
            <p className="text-sm text-gray-500">Condition</p>
            <p className="font-medium capitalize" aria-label={`Condition: ${data.condition}`}>{data.condition}</p>
          </div>
          {data.vin && (
            <div role="listitem">
              <p className="text-sm text-gray-500">VIN</p>
              <p className="font-medium font-mono text-sm" aria-label={`VIN: ${data.vin}`}>{data.vin}</p>
            </div>
          )}
        </div>
      </section>

      {/* Modifications */}
      {data.modifications.length > 0 && (
        <section 
          className="bg-white border border-gray-200 rounded-lg p-6"
          aria-labelledby="modifications-section-heading"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 id="modifications-section-heading" className="text-lg font-medium text-gray-900">
              Modifications ({data.modifications.length})
            </h3>
            <button
              onClick={() => goToStep(3)}
              className="text-sm text-automotive-accent hover:text-blue-600 flex items-center focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
              aria-describedby="edit-mods-help"
            >
              <PencilIcon className="w-4 h-4 mr-1" aria-hidden="true" />
              Edit
            </button>
            <div id="edit-mods-help" className="sr-only">
              Edit vehicle modifications including categories, descriptions, costs, and installation dates
            </div>
          </div>
          <div className="space-y-4" role="list" aria-label="Vehicle modifications">
            {data.modifications.map((mod, index) => (
              <div 
                key={mod.id} 
                className="border-l-4 border-automotive-accent pl-4"
                role="listitem"
                aria-labelledby={`mod-${index}-title`}
                aria-describedby={`mod-${index}-details`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 id={`mod-${index}-title`} className="font-medium text-gray-900 capitalize">
                      {mod.category}
                    </h4>
                    <p id={`mod-${index}-details`} className="text-gray-700 text-sm mt-1">
                      {mod.description}
                    </p>
                    {mod.date_installed && (
                      <p className="text-gray-500 text-xs mt-1" aria-label={`Installed: ${new Date(mod.date_installed).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}>
                        Installed: {new Date(mod.date_installed).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    )}
                  </div>
                  {mod.cost && (
                    <p 
                      className="text-sm font-medium text-gray-900"
                      aria-label={`Cost: ${formatCurrency(mod.cost)}`}
                    >
                      {formatCurrency(mod.cost)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {totalModificationCost > 0 && (
              <div className="border-t pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-gray-900">Total Modification Cost:</span>
                  <span 
                    className="text-lg font-bold text-green-600"
                    aria-label={`Total modification cost: ${formatCurrency(totalModificationCost)}`}
                  >
                    {formatCurrency(totalModificationCost)}
                  </span>
                </div>
              </div>
            )}
          </div>
        </section>
      )}

      {/* Images */}
      <section 
        className="bg-white border border-gray-200 rounded-lg p-6"
        aria-labelledby="images-section-heading"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="images-section-heading" className="text-lg font-medium text-gray-900">
            Photos ({data.images.length})
          </h3>
          <button
            onClick={() => goToStep(4)}
            className="text-sm text-automotive-accent hover:text-blue-600 flex items-center focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
            aria-describedby="edit-images-help"
          >
            <PencilIcon className="w-4 h-4 mr-1" aria-hidden="true" />
            Edit
          </button>
          <div id="edit-images-help" className="sr-only">
            Edit vehicle photos including adding, removing, and setting primary image
          </div>
        </div>
        {data.images.length > 0 ? (
          <div className="grid grid-cols-3 md:grid-cols-6 gap-2" role="list" aria-label="Vehicle photos">
            {data.images.map((image, index) => (
              <div 
                key={image.id} 
                className="relative aspect-square rounded border-2 border-gray-200 overflow-hidden"
                role="listitem"
                aria-labelledby={`image-${index}-label`}
              >
                <Image
                  src={image.preview}
                  alt={image.caption || `Vehicle photo ${index + 1}${image.is_primary ? ' (Primary)' : ''}`}
                  fill
                  className="object-cover"
                />
                {image.is_primary && (
                  <div 
                    className="absolute top-1 left-1 bg-yellow-500 text-white text-xs px-1 rounded"
                    role="status"
                    aria-label="Primary image badge"
                  >
                    Primary
                  </div>
                )}
                <div id={`image-${index}-label`} className="sr-only">
                  Photo {index + 1} of {data.images.length}{image.is_primary ? ' (Primary)' : ''}
                  {image.caption && `: ${image.caption}`}
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div 
            className="text-gray-500 text-center py-4"
            role="status"
            aria-label="No images uploaded"
          >
            No images uploaded
          </div>
        )}
      </section>

      {/* Summary Stats */}
      <section 
        className="bg-blue-50 border border-blue-200 rounded-lg p-6"
        aria-labelledby="summary-heading"
      >
        <h3 id="summary-heading" className="text-lg font-medium text-blue-900 mb-4">
          Listing Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center" role="list">
          <div role="listitem">
            <p 
              className="text-2xl font-bold text-blue-900"
              aria-label={`${data.images.length} photos uploaded`}
            >
              {data.images.length}
            </p>
            <p className="text-sm text-blue-700">Photos</p>
          </div>
          <div role="listitem">
            <p 
              className="text-2xl font-bold text-blue-900"
              aria-label={`${data.modifications.length} modifications listed`}
            >
              {data.modifications.length}
            </p>
            <p className="text-sm text-blue-700">Modifications</p>
          </div>
          <div role="listitem">
            <p 
              className="text-2xl font-bold text-blue-900"
              aria-label={`${data.description.length} characters in description`}
            >
              {data.description.length}
            </p>
            <p className="text-sm text-blue-700">Characters</p>
          </div>
          <div role="listitem">
            <p 
              className="text-2xl font-bold text-blue-900"
              aria-label={`Total modification value: ${totalModificationCost > 0 ? formatCurrency(totalModificationCost) : 'None'}`}
            >
              {totalModificationCost > 0 ? formatCurrency(totalModificationCost) : '$0'}
            </p>
            <p className="text-sm text-blue-700">Mod Value</p>
          </div>
        </div>
      </section>

      {/* Terms and Conditions */}
      <fieldset className="bg-gray-50 border border-gray-200 rounded-lg p-4">
        <legend className="sr-only">Terms and Conditions Acceptance</legend>
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-automotive-accent focus:ring-automotive-accent border-gray-300 rounded focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2"
            required
            aria-describedby="terms-description"
          />
          <label htmlFor="terms" className="ml-3 text-sm text-gray-700">
            I confirm that all information provided is accurate and I agree to the{' '}
            <a 
              href="/terms" 
              className="text-automotive-accent hover:text-blue-600 underline focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby="terms-link-desc"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a 
              href="/privacy" 
              className="text-automotive-accent hover:text-blue-600 underline focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby="privacy-link-desc"
            >
              Privacy Policy
            </a>
            .
          </label>
        </div>
        <div id="terms-description" className="sr-only mt-2">
          You must accept the terms and conditions to publish your listing
        </div>
        <div id="terms-link-desc" className="sr-only">
          Opens Terms of Service in a new tab
        </div>
        <div id="privacy-link-desc" className="sr-only">
          Opens Privacy Policy in a new tab
        </div>
      </fieldset>

      {/* Navigation */}
      <div className="flex justify-between pt-6 border-t">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          aria-describedby="prev-button-help"
          className="btn-secondary focus-visible:ring-2 focus-visible:ring-gray-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          Previous: Photos
        </button>
        <div id="prev-button-help" className="sr-only">
          Go back to the previous step to edit vehicle photos
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !termsAccepted}
          aria-describedby="submit-button-help"
          className={`btn-primary focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200 ${
            (isSubmitting || !termsAccepted) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <svg
                className="animate-spin -ml-1 mr-3 h-5 w-5 text-white"
                xmlns="http://www.w3.org/2000/svg"
                fill="none"
                viewBox="0 0 24 24"
                aria-hidden="true"
              >
                <circle
                  className="opacity-25"
                  cx="12"
                  cy="12"
                  r="10"
                  stroke="currentColor"
                  strokeWidth="4"
                ></circle>
                <path
                  className="opacity-75"
                  fill="currentColor"
                  d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                ></path>
              </svg>
              Creating Listing...
            </>
          ) : (
            'Publish Listing'
          )}
        </button>
        <div id="submit-button-help" className="sr-only">
          {!termsAccepted ? 
            'You must accept the terms and conditions before publishing your listing' :
            isSubmitting ? 
            'Your listing is being created. Please wait.' :
            'Publish your vehicle listing to make it visible to potential buyers'}
        </div>
      </div>
    </section>
  )
} 