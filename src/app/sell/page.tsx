'use client'

import { useState, useEffect, Suspense } from 'react'
import { useAuth, withAuth } from '@/lib/auth'
import { useToast } from '@/components/AppLayout'
import { useSearchParams } from 'next/navigation'
import Link from 'next/link'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'
import BasicDetailsForm from '@/components/forms/BasicDetailsForm'
import VehicleSpecsForm from '@/components/forms/VehicleSpecsForm'
import ModificationsForm from '@/components/forms/ModificationsForm'
import ImagesForm from '@/components/forms/ImagesForm'
import PreviewForm from '@/components/forms/PreviewForm'
import AppLayout from '@/components/AppLayout'
import LoadingSpinner from '@/components/LoadingSpinner'

export type ListingFormData = {
  // Basic Details
  title: string
  make: string
  model: string
  year: number
  price: number
  location: string
  description: string
  
  // Vehicle Specs
  engine: string
  transmission: string
  mileage: number
  condition: 'excellent' | 'good' | 'fair' | 'poor' | 'project'
  vin?: string
  
  // Modifications
  modifications: Array<{
    id: string
    category: string
    description: string
    cost?: number
    date_installed?: string
  }>
  
  // Images
  images: Array<{
    id: string
    file: File | null
    preview: string
    caption?: string
    is_primary: boolean
    existingUrl?: string
  }>
}

const steps = [
  { id: 1, name: 'Basic Details', description: 'Car info and pricing', icon: 'car' },
  { id: 2, name: 'Vehicle Specs', description: 'Technical specifications', icon: 'settings' },
  { id: 3, name: 'Modifications', description: 'Custom work and upgrades', icon: 'edit' },
  { id: 4, name: 'Photos', description: 'Upload images', icon: 'camera' },
  { id: 5, name: 'Preview', description: 'Review and submit', icon: 'eye' },
]

function SellPage() {
  const { } = useAuth()
  const { showSuccess, showError } = useToast()
  const searchParams = useSearchParams()
  const editingId = searchParams.get('edit')
  const isEditing = Boolean(editingId)
  
  const [currentStep, setCurrentStep] = useState(1)
  const [formData, setFormData] = useState<ListingFormData>({
    title: '',
    make: '',
    model: '',
    year: new Date().getFullYear(),
    price: 0,
    location: '',
    description: '',
    engine: '',
    transmission: '',
    mileage: 0,
    condition: 'good',
    vin: '',
    modifications: [],
    images: []
  })

  const [isSubmitting, setIsSubmitting] = useState(false)
  const [isLoading, setIsLoading] = useState(false)
  const [errors, setErrors] = useState<Record<string, string>>({})

  // Load existing listing data when editing
  useEffect(() => {
    if (isEditing && editingId) {
      loadExistingListing(editingId)
    }
  }, [isEditing, editingId])

  const loadExistingListing = async (listingId: string) => {
    try {
      setIsLoading(true)
      setErrors({})
      
      const response = await fetch(`/api/listings/${listingId}`)
      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to load listing')
      }
      
      const result = await response.json()
      const listing = result.listing
      
      // Transform the listing data to match our form structure
      const transformedData: ListingFormData = {
        title: listing.title || '',
        make: listing.make || '',
        model: listing.model || '',
        year: listing.year || new Date().getFullYear(),
        price: listing.price || 0,
        location: listing.location || '',
        description: listing.description || '',
        engine: listing.engine || '',
        transmission: listing.transmission || '',
        mileage: listing.mileage || 0,
        condition: listing.condition || 'good',
        vin: listing.vin || '',
        modifications: listing.modifications?.map((mod: any) => ({
          id: mod.id || Math.random().toString(36).substr(2, 9),
          category: mod.category || '',
          description: mod.description || '',
          cost: mod.cost || 0,
          date_installed: mod.date_installed || ''
        })) || [],
        images: listing.listing_images?.map((img: any, index: number) => ({
          id: img.id || Math.random().toString(36).substr(2, 9),
          file: null, // We'll handle existing images differently
          preview: img.image_url,
          caption: img.caption || '',
          is_primary: img.is_primary || index === 0,
          existingUrl: img.image_url // Mark as existing image
        })) || []
      }
      
      setFormData(transformedData)
      
    } catch (error) {
      console.error('Error loading listing:', error)
      showError(
        'Failed to Load Listing',
        error instanceof Error ? error.message : 'Unable to load listing data for editing.',
        { duration: 6000 }
      )
      // Optionally redirect back to dashboard on error
      setTimeout(() => {
        window.location.href = '/dashboard'
      }, 3000)
    } finally {
      setIsLoading(false)
    }
  }

  const updateFormData = (stepData: Partial<ListingFormData>) => {
    setFormData(prev => ({ ...prev, ...stepData }))
  }

  const nextStep = () => {
    if (currentStep < steps.length) {
      setCurrentStep(currentStep + 1)
    }
  }

  const prevStep = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1)
    }
  }

  const goToStep = (step: number) => {
    setCurrentStep(step)
  }

  const handleSubmit = async () => {
    setIsSubmitting(true)
    setErrors({})
    
    try {
      // First, upload images to Supabase Storage if any exist
      const uploadedImages = formData.images.length > 0 ? await uploadImages() : []
      
      // Prepare the listing data
      const listingData = {
        title: formData.title,
        make: formData.make,
        model: formData.model,
        year: formData.year,
        price: formData.price,
        location: formData.location,
        description: formData.description,
        engine: formData.engine,
        transmission: formData.transmission,
        mileage: formData.mileage,
        condition: formData.condition,
        modifications: formData.modifications.map(mod => ({
          id: mod.id,
          category: mod.category,
          description: mod.description,
          cost: mod.cost,
          date_installed: mod.date_installed
        })),
        images: uploadedImages
      }

      // Submit to API - use PUT for editing, POST for creating
      const url = isEditing ? `/api/listings/${editingId}` : '/api/listings'
      const method = isEditing ? 'PUT' : 'POST'
      
      const response = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(listingData),
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || `Failed to ${isEditing ? 'update' : 'create'} listing`)
      }

      const result = await response.json()
      
      // Success - show success toast and redirect to the listing
      showSuccess(
        isEditing ? 'Listing Updated Successfully!' : 'Listing Created Successfully!',
        `Your ${formData.make} ${formData.model} has been ${isEditing ? 'updated' : 'listed for sale'}. You'll be redirected to your listing shortly.`,
        { duration: 4000 }
      )
      
      // Redirect to the dashboard or the specific listing page after a brief delay
      setTimeout(() => {
        const redirectUrl = result.listing?.id 
          ? `/listings/${result.listing.id}` 
          : isEditing 
            ? `/listings/${editingId}`
            : '/dashboard'
        window.location.href = redirectUrl
      }, 1000)
      
    } catch (error) {
      console.error(`Error ${isEditing ? 'updating' : 'creating'} listing:`, error)
      
      // Show error toast instead of alert
      showError(
        isEditing ? 'Failed to Update Listing' : 'Failed to Create Listing',
        error instanceof Error ? error.message : 'An unexpected error occurred. Please try again.',
        { duration: 6000 }
      )
      
      setErrors({ 
        submit: error instanceof Error ? error.message : `Failed to ${isEditing ? 'update' : 'create'} listing. Please try again.` 
      })
    } finally {
      setIsSubmitting(false)
    }
  }

  const uploadImages = async () => {
    const uploadedImages = []
    
    for (const image of formData.images) {
      try {
        // If it's an existing image (has existingUrl), just include it as-is
        if (image.existingUrl) {
          uploadedImages.push({
            image_url: image.existingUrl,
            caption: image.caption || '',
            is_primary: image.is_primary
          })
          continue
        }
        
        // For new images, upload them
        if (image.file) {
          const imageFormData = new FormData()
          imageFormData.append('file', image.file)
          imageFormData.append('caption', image.caption || '')
          imageFormData.append('is_primary', image.is_primary.toString())
          
          const response = await fetch('/api/listings/upload-image', {
            method: 'POST',
            body: imageFormData,
          })
          
          if (!response.ok) {
            const errorData = await response.json()
            throw new Error(errorData.error || 'Failed to upload image')
          }
          
          const result = await response.json()
          uploadedImages.push(result)
        }
      } catch (error) {
        console.error('Error uploading image:', error)
        throw new Error('Failed to upload images')
      }
    }
    
    return uploadedImages
  }

  const renderCurrentStep = () => {
    switch (currentStep) {
      case 1:
        return (
          <BasicDetailsForm
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            errors={errors}
          />
        )
      case 2:
        return (
          <VehicleSpecsForm
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            errors={errors}
          />
        )
      case 3:
        return (
          <ModificationsForm
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            errors={errors}
          />
        )
      case 4:
        return (
          <ImagesForm
            data={formData}
            updateData={updateFormData}
            onNext={nextStep}
            onPrev={prevStep}
            errors={errors}
          />
        )
      case 5:
        return (
          <PreviewForm
            data={formData}
            onPrev={prevStep}
            onSubmit={handleSubmit}
            isSubmitting={isSubmitting}
            errors={errors}
            goToStep={goToStep}
            isEditing={isEditing}
          />
        )
      default:
        return null
    }
  }

  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      {/* Header Section */}
      <div className="bg-md-sys-surface-container-low border-b border-md-sys-outline-variant">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <div className="flex items-center gap-4 mb-6">
            <div className="p-3 bg-md-sys-primary-container rounded-2xl">
              <MaterialYouIcon name="car" className="w-8 h-8 text-md-sys-on-primary-container" />
            </div>
            <div>
              <h1 className="text-md-display-small font-black text-md-sys-on-surface">
                {isEditing ? 'Edit Your Listing' : 'List Your Car'}
              </h1>
              <p className="text-md-body-large text-md-sys-on-surface-variant">
                {isEditing ? 'Update your car listing details' : 'Create a detailed listing for your project car'}
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Progress Steps */}
        <div className="mb-8">
          <div className="bg-md-sys-surface-container rounded-3xl p-6 shadow-md-elevation-1">
            <div className="mb-4">
              <h2 className="text-md-title-large font-semibold text-md-sys-on-surface mb-2">
                Step {currentStep} of {steps.length}
              </h2>
              <div className="w-full bg-md-sys-surface-variant rounded-full h-2">
                <div 
                  className="bg-md-sys-primary rounded-full h-2 transition-all duration-500 ease-md-standard"
                  style={{ width: `${(currentStep / steps.length) * 100}%` }}
                ></div>
              </div>
            </div>
            
            <nav aria-label="Progress">
              <ol className="grid grid-cols-5 gap-4">
                {steps.map((step, stepIdx) => (
                  <li key={step.id} className="relative">
                    <button
                      type="button"
                      onClick={() => goToStep(step.id)}
                      className={`relative flex flex-col items-center p-3 rounded-2xl transition-all duration-200 w-full ${
                        step.id <= currentStep 
                          ? 'cursor-pointer bg-md-sys-primary-container/50 hover:bg-md-sys-primary-container' 
                          : 'cursor-not-allowed bg-md-sys-surface-variant/30'
                      }`}
                      disabled={step.id > currentStep}
                    >
                      <div
                        className={`h-12 w-12 rounded-2xl flex items-center justify-center mb-2 transition-all duration-200 ${
                          step.id < currentStep
                            ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md-elevation-2'
                            : step.id === currentStep
                            ? 'bg-md-sys-primary text-md-sys-on-primary shadow-md-elevation-1'
                            : 'bg-md-sys-surface-variant text-md-sys-on-surface-variant'
                        }`}
                      >
                        {step.id < currentStep ? (
                          <MaterialYouIcon name="check" className="w-6 h-6" />
                        ) : (
                          <MaterialYouIcon name={step.icon as any} className="w-6 h-6" />
                        )}
                      </div>
                      <span className={`text-md-label-medium font-semibold text-center leading-tight ${
                        step.id <= currentStep ? 'text-md-sys-on-surface' : 'text-md-sys-on-surface-variant'
                      }`}>
                        {step.name}
                      </span>
                      <span className={`text-md-label-small text-center leading-tight mt-1 ${
                        step.id <= currentStep ? 'text-md-sys-on-surface-variant' : 'text-md-sys-on-surface-variant/60'
                      }`}>
                        {step.description}
                      </span>
                    </button>
                  </li>
                ))}
              </ol>
            </nav>
          </div>
        </div>

        {/* Form Content */}
        <div className="bg-md-sys-surface-container rounded-3xl shadow-md-elevation-1 p-6 md:p-8">
          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-center">
                <div className="w-12 h-12 border-4 border-md-sys-primary border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
                <p className="text-md-body-large text-md-sys-on-surface-variant">
                  Loading listing data...
                </p>
              </div>
            </div>
          ) : (
            renderCurrentStep()
          )}
        </div>
      </div>
    </AppLayout>
  )
}

// Loading component for Suspense fallback
function SellPageFallback() {
  return (
    <AppLayout showNavigation={true} className="bg-md-sys-surface">
      <div className="min-h-screen flex items-center justify-center py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl w-full">
          <div className="text-center">
            <div className="w-20 h-20 bg-md-sys-primary-container rounded-3xl flex items-center justify-center mx-auto mb-6 shadow-md-elevation-2">
              <LoadingSpinner />
            </div>
            <h1 className="text-md-display-small font-bold text-md-sys-on-surface mb-3">
              Loading Sell Page...
            </h1>
          </div>
        </div>
      </div>
    </AppLayout>
  )
}

// Wrapper component with Suspense
function SellPageWithSuspense() {
  return (
    <Suspense fallback={<SellPageFallback />}>
      <SellPage />
    </Suspense>
  )
}

// Export the component wrapped with authentication and suspense
export default withAuth(SellPageWithSuspense)