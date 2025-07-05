'use client'

import { useState } from 'react'
import { useAuth, withAuth } from '@/lib/auth'
import Link from 'next/link'
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon'
import BasicDetailsForm from '@/components/forms/BasicDetailsForm'
import VehicleSpecsForm from '@/components/forms/VehicleSpecsForm'
import ModificationsForm from '@/components/forms/ModificationsForm'
import ImagesForm from '@/components/forms/ImagesForm'
import PreviewForm from '@/components/forms/PreviewForm'
import AppLayout from '@/components/AppLayout'

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
    file: File
    preview: string
    caption?: string
    is_primary: boolean
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
  const [errors, setErrors] = useState<Record<string, string>>({})

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
    try {
      // This will be implemented when we add Supabase integration
      console.log('Submitting listing:', formData)
      // TODO: Submit to Supabase
      alert('Listing created successfully! (Demo)')
    } catch (error) {
      console.error('Error creating listing:', error)
      setErrors({ submit: 'Failed to create listing. Please try again.' })
    } finally {
      setIsSubmitting(false)
    }
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
              <h1 className="text-md-display-small font-black text-md-sys-on-surface">List Your Car</h1>
              <p className="text-md-body-large text-md-sys-on-surface-variant">Create a detailed listing for your project car</p>
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
          {renderCurrentStep()}
        </div>
      </div>
    </AppLayout>
  )
}

// Export the component wrapped with authentication
export default withAuth(SellPage) 