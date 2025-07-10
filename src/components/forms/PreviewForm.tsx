'use client'

import { useState } from 'react'
import Image from 'next/image'
import { ListingFormData } from '@/app/sell/page'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'

interface PreviewFormProps {
  data: ListingFormData
  onPrev: () => void
  onSubmit: () => void
  isSubmitting: boolean
  errors: Record<string, string>
  goToStep: (step: number) => void
  isEditing?: boolean
}

export default function PreviewForm({ 
  data, 
  onPrev, 
  onSubmit, 
  isSubmitting, 
  errors, 
  goToStep,
  isEditing = false
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
      <header className="flex items-center gap-4 pb-6 border-b border-md-sys-outline-variant">
        <div className="p-3 bg-md-sys-primary-container rounded-2xl">
          <MaterialYouIcon name="eye" className="w-6 h-6 text-md-sys-on-primary-container" />
        </div>
        <div>
          <h2 id="preview-heading" className="text-md-headline-small font-semibold text-md-sys-on-surface mb-1">
            Review Your Listing
          </h2>
          <p className="text-md-body-medium text-md-sys-on-surface-variant">
            Please review all information below before submitting your listing. You can edit any section by clicking the edit buttons.
          </p>
        </div>
      </header>

      {/* Submission Errors */}
      {errors.submit && (
        <div 
          className="bg-md-sys-error-container/10 border border-md-sys-error text-md-sys-error px-4 py-3 rounded-xl text-md-body-small"
          role="alert"
          aria-labelledby="submit-error-heading"
        >
          <h3 id="submit-error-heading" className="sr-only">Submission Error</h3>
          {errors.submit}
        </div>
      )}

      {/* Preview Card */}
      <article 
        className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl overflow-hidden shadow-md-elevation-1"
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
                <h5 className="text-md-title-large font-semibold text-md-sys-on-surface">{data.title}</h5>
                <p className="text-md-body-medium text-md-sys-on-surface-variant">{data.location}</p>
              </div>
              <div className="text-right">
                <p 
                  className="text-md-headline-medium font-bold text-md-sys-primary"
                  aria-label={`Asking price: ${formatCurrency(data.price)}`}
                >
                  {formatCurrency(data.price)}
                </p>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="text-md-label-medium text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container flex items-center mt-1 px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
                  aria-describedby="edit-basic-help"
                >
                  <MaterialYouIcon name="edit" className="w-4 h-4 mr-1" aria-hidden={true} />
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
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6 p-4 bg-md-sys-surface-container rounded-xl" role="list">
              <div role="listitem">
                <p className="text-md-body-small text-md-sys-on-surface-variant">Year</p>
                <p className="font-medium text-md-sys-on-surface" aria-label={`Year: ${data.year}`}>{data.year}</p>
              </div>
              <div role="listitem">
                <p className="text-md-body-small text-md-sys-on-surface-variant">Make</p>
                <p className="font-medium text-md-sys-on-surface" aria-label={`Make: ${data.make}`}>{data.make}</p>
              </div>
              <div role="listitem">
                <p className="text-md-body-small text-md-sys-on-surface-variant">Model</p>
                <p className="font-medium text-md-sys-on-surface" aria-label={`Model: ${data.model}`}>{data.model}</p>
              </div>
              <div role="listitem">
                <p className="text-md-body-small text-md-sys-on-surface-variant">Mileage</p>
                <p 
                  className="font-medium text-md-sys-on-surface" 
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
                <h4 id="description-heading" className="text-md-title-medium font-medium text-md-sys-on-surface">
                  Description
                </h4>
                <button
                  type="button"
                  onClick={() => goToStep(1)}
                  className="text-md-label-medium text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container flex items-center px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
                  aria-describedby="edit-description-help"
                >
                  <MaterialYouIcon name="edit" className="w-4 h-4 mr-1" aria-hidden={true} />
                  Edit
                </button>
                <div id="edit-description-help" className="sr-only">
                  Edit the description of your vehicle
                </div>
              </div>
              <p className="text-md-body-medium text-md-sys-on-surface whitespace-pre-wrap">{data.description}</p>
            </div>
          </section>
        </div>
      </article>

      {/* Vehicle Specifications */}
      <section 
        className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-6"
        aria-labelledby="specs-section-heading"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="specs-section-heading" className="text-md-title-medium font-medium text-md-sys-on-surface">
            Vehicle Specifications
          </h3>
          <button
            onClick={() => goToStep(2)}
            className="text-md-label-medium text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container flex items-center px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
            aria-describedby="edit-specs-help"
          >
            <MaterialYouIcon name="edit" className="w-4 h-4 mr-1" aria-hidden={true} />
            Edit
          </button>
          <div id="edit-specs-help" className="sr-only">
            Edit vehicle specifications including engine, transmission, condition, and VIN
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4" role="list">
          <div role="listitem">
            <p className="text-md-body-small text-md-sys-on-surface-variant">Engine</p>
            <p className="font-medium text-md-sys-on-surface" aria-label={`Engine: ${data.engine}`}>{data.engine}</p>
          </div>
          <div role="listitem">
            <p className="text-md-body-small text-md-sys-on-surface-variant">Transmission</p>
            <p className="font-medium text-md-sys-on-surface" aria-label={`Transmission: ${data.transmission}`}>{data.transmission}</p>
          </div>
          <div role="listitem">
            <p className="text-md-body-small text-md-sys-on-surface-variant">Condition</p>
            <p className="font-medium text-md-sys-on-surface capitalize" aria-label={`Condition: ${data.condition}`}>{data.condition}</p>
          </div>
          {data.vin && (
            <div role="listitem">
              <p className="text-md-body-small text-md-sys-on-surface-variant">VIN</p>
              <p className="font-medium text-md-sys-on-surface font-mono text-sm" aria-label={`VIN: ${data.vin}`}>{data.vin}</p>
            </div>
          )}
        </div>
      </section>

      {/* Modifications */}
      {data.modifications.length > 0 && (
        <section 
          className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-6"
          aria-labelledby="modifications-section-heading"
        >
          <div className="flex justify-between items-center mb-4">
            <h3 id="modifications-section-heading" className="text-md-title-medium font-medium text-md-sys-on-surface">
              Modifications ({data.modifications.length})
            </h3>
            <button
              onClick={() => goToStep(3)}
              className="text-md-label-medium text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container flex items-center px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
              aria-describedby="edit-mods-help"
            >
              <MaterialYouIcon name="edit" className="w-4 h-4 mr-1" aria-hidden={true} />
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
                className="border-l-4 border-md-sys-primary pl-4"
                role="listitem"
                aria-labelledby={`mod-${index}-title`}
                aria-describedby={`mod-${index}-details`}
              >
                <div className="flex justify-between items-start">
                  <div>
                    <h4 id={`mod-${index}-title`} className="font-medium text-md-sys-on-surface capitalize">
                      {mod.category}
                    </h4>
                    <p id={`mod-${index}-details`} className="text-md-sys-on-surface-variant text-md-body-small mt-1">
                      {mod.description}
                    </p>
                    {mod.date_installed && (
                      <p className="text-md-sys-on-surface-variant text-md-body-small mt-1" aria-label={`Installed: ${new Date(mod.date_installed).toLocaleDateString('en-US', { year: 'numeric', month: 'long' })}`}>
                        Installed: {new Date(mod.date_installed).toLocaleDateString('en-US', { 
                          year: 'numeric', 
                          month: 'long' 
                        })}
                      </p>
                    )}
                  </div>
                  {mod.cost && (
                    <p 
                      className="text-md-body-small font-medium text-md-sys-on-surface"
                      aria-label={`Cost: ${formatCurrency(mod.cost)}`}
                    >
                      {formatCurrency(mod.cost)}
                    </p>
                  )}
                </div>
              </div>
            ))}
            {totalModificationCost > 0 && (
              <div className="border-t border-md-sys-outline-variant pt-4">
                <div className="flex justify-between items-center">
                  <span className="font-medium text-md-sys-on-surface">Total Modification Cost:</span>
                  <span 
                    className="text-md-title-small font-semibold text-md-sys-primary"
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
        className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-6"
        aria-labelledby="images-section-heading"
      >
        <div className="flex justify-between items-center mb-4">
          <h3 id="images-section-heading" className="text-md-title-medium font-medium text-md-sys-on-surface">
            Photos ({data.images.length})
          </h3>
          <button
            onClick={() => goToStep(4)}
            className="text-md-label-medium text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container flex items-center px-3 py-1.5 rounded-lg focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200"
            aria-describedby="edit-images-help"
          >
            <MaterialYouIcon name="edit" className="w-4 h-4 mr-1" aria-hidden={true} />
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
                className="relative aspect-square rounded-xl border-2 border-md-sys-outline-variant overflow-hidden"
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
                    className="absolute top-1 left-1 bg-md-sys-primary text-md-sys-on-primary text-md-label-small px-2 py-1 rounded-md"
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
            className="text-md-sys-on-surface-variant text-center py-8 bg-md-sys-surface-container rounded-xl"
            role="status"
            aria-label="No images uploaded"
          >
            <MaterialYouIcon name="photo" className="w-12 h-12 mx-auto mb-2 text-md-sys-on-surface-variant" />
            <p className="text-md-body-medium">No images uploaded</p>
          </div>
        )}
      </section>

      {/* Summary Stats */}
      <section 
        className="bg-md-sys-primary-container border border-md-sys-outline-variant rounded-xl p-6"
        aria-labelledby="summary-heading"
      >
        <h3 id="summary-heading" className="text-md-title-medium font-medium text-md-sys-on-primary-container mb-4">
          Listing Summary
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center" role="list">
          <div role="listitem">
            <p 
              className="text-md-display-small font-bold text-md-sys-on-primary-container"
              aria-label={`${data.images.length} photos uploaded`}
            >
              {data.images.length}
            </p>
            <p className="text-md-body-small text-md-sys-on-primary-container">Photos</p>
          </div>
          <div role="listitem">
            <p 
              className="text-md-display-small font-bold text-md-sys-on-primary-container"
              aria-label={`${data.modifications.length} modifications listed`}
            >
              {data.modifications.length}
            </p>
            <p className="text-md-body-small text-md-sys-on-primary-container">Modifications</p>
          </div>
          <div role="listitem">
            <p 
              className="text-md-display-small font-bold text-md-sys-on-primary-container"
              aria-label={`${data.description.length} characters in description`}
            >
              {data.description.length}
            </p>
            <p className="text-md-body-small text-md-sys-on-primary-container">Characters</p>
          </div>
          <div role="listitem">
            <p 
              className="text-md-display-small font-bold text-md-sys-on-primary-container"
              aria-label={`Total modification value: ${totalModificationCost > 0 ? formatCurrency(totalModificationCost) : 'None'}`}
            >
              {totalModificationCost > 0 ? formatCurrency(totalModificationCost) : '$0'}
            </p>
            <p className="text-md-body-small text-md-sys-on-primary-container">Mod Value</p>
          </div>
        </div>
      </section>

      {/* Terms and Conditions */}
      <fieldset className="bg-md-sys-surface-container border border-md-sys-outline-variant rounded-xl p-4">
        <legend className="sr-only">Terms and Conditions Acceptance</legend>
        <div className="flex items-start">
          <input
            type="checkbox"
            id="terms"
            checked={termsAccepted}
            onChange={(e) => setTermsAccepted(e.target.checked)}
            className="mt-1 h-4 w-4 text-md-sys-primary focus:ring-md-sys-primary border-md-sys-outline-variant rounded focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
            required
            aria-describedby="terms-description"
          />
          <label htmlFor="terms" className="ml-3 text-md-body-small text-md-sys-on-surface">
            I confirm that all information provided is accurate and I agree to the{' '}
            <a 
              href="/terms" 
              className="text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container underline px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
              target="_blank"
              rel="noopener noreferrer"
              aria-describedby="terms-link-desc"
            >
              Terms of Service
            </a>{' '}
            and{' '}
            <a 
              href="/privacy" 
              className="text-md-sys-primary hover:text-md-sys-on-primary-container hover:bg-md-sys-primary-container underline px-1 py-0.5 rounded focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20"
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
      <div className="flex justify-between pt-6 border-t border-md-sys-outline-variant">
        <button
          onClick={onPrev}
          disabled={isSubmitting}
          aria-describedby="prev-button-help"
          className="px-6 py-3 bg-md-sys-surface-container text-md-sys-on-surface rounded-xl border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed font-medium flex items-center"
        >
          <MaterialYouIcon name="arrow-left" className="w-5 h-5 mr-2" aria-hidden={true} />
          Previous: Photos
        </button>
        <div id="prev-button-help" className="sr-only">
          Go back to the previous step to edit vehicle photos
        </div>
        
        <button
          onClick={handleSubmit}
          disabled={isSubmitting || !termsAccepted}
          aria-describedby="submit-button-help"
          className={`px-8 py-3 bg-md-sys-primary text-md-sys-on-primary rounded-xl hover:bg-md-sys-primary-container hover:text-md-sys-on-primary-container focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 transition-all duration-200 font-medium ${
            (isSubmitting || !termsAccepted) ? 'opacity-50 cursor-not-allowed' : ''
          }`}
        >
          {isSubmitting ? (
            <>
              <MaterialYouIcon name="refresh" className="animate-spin -ml-1 mr-3 h-5 w-5" aria-hidden={true} />
              {isEditing ? 'Updating Listing...' : 'Creating Listing...'}
            </>
          ) : (
            <>
              <MaterialYouIcon name="paper-airplane" className="w-5 h-5 mr-2" aria-hidden={true} />
              {isEditing ? 'Update Listing' : 'Publish Listing'}
            </>
          )}
        </button>
        <div id="submit-button-help" className="sr-only">
          {!termsAccepted ? 
            'You must accept the terms and conditions before publishing your listing' :
            isSubmitting ? 
            `Your listing is being ${isEditing ? 'updated' : 'created'}. Please wait.` :
            `${isEditing ? 'Update' : 'Publish'} your vehicle listing to make it visible to potential buyers`}
        </div>
      </div>
    </section>
  )
} 