'use client'

import { useState, useRef } from 'react'
import { ListingFormData } from '@/app/sell/page'
import { Plus, Trash2, Settings } from 'lucide-react'
import { Select, Button, Input, Textarea, SelectOption } from '@/components/ui'
import { cn } from '@/lib/utils'

// Define the specific modification categories as per task specification
export type ModificationCategory = 
  | 'engine' 
  | 'suspension' 
  | 'transmission' 
  | 'interior' 
  | 'body' 
  | 'exhaust' 
  | 'wheels/tires' 
  | 'electrical' 
  | 'brakes' 
  | 'other';

// Enhanced modification interface with typed category
export interface Modification {
  id: string;
  category: ModificationCategory | '';
  description: string;
  cost?: number;
  date_installed?: string;
}

interface ModificationsFormProps {
  data: ListingFormData
  updateData: (data: Partial<ListingFormData>) => void
  onNext: () => void
  onPrev: () => void
  errors: Record<string, string>
}

// Validation schema for modification categories
export const MODIFICATION_CATEGORIES: readonly ModificationCategory[] = [
  'engine',
  'suspension', 
  'transmission',
  'interior',
  'body',
  'exhaust',
  'wheels/tires',
  'electrical',
  'brakes',
  'other'
] as const;

export default function ModificationsForm({ data, updateData, onNext, onPrev }: ModificationsFormProps) {
  const [modifications, setModifications] = useState<Modification[]>(data.modifications as Modification[])
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [statusMessage, setStatusMessage] = useState<string>('')
  const lastAddedModRef = useRef<HTMLDivElement>(null)

  // Updated modification categories as specified in the task
  const modificationCategories: SelectOption[] = [
    { value: 'engine', label: 'Engine' },
    { value: 'suspension', label: 'Suspension' },
    { value: 'transmission', label: 'Transmission' },
    { value: 'interior', label: 'Interior' },
    { value: 'body', label: 'Body' },
    { value: 'exhaust', label: 'Exhaust' },
    { value: 'wheels/tires', label: 'Wheels/Tires' },
    { value: 'electrical', label: 'Electrical' },
    { value: 'brakes', label: 'Brakes' },
    { value: 'other', label: 'Other' }
  ]

  // Category validation helper
  const isValidCategory = (category: string): category is ModificationCategory => {
    return MODIFICATION_CATEGORIES.includes(category as ModificationCategory);
  }

  const addModification = () => {
    const newMod: Modification = {
      id: Date.now().toString(),
      category: '',
      description: '',
      cost: undefined,
      date_installed: ''
    }
    setModifications(prev => {
      const updated = [...prev, newMod]
      setStatusMessage(`Added modification ${updated.length}. Total modifications: ${updated.length}`)
      setTimeout(() => setStatusMessage(''), 3000)
      return updated
    })

    // Focus the new modification after a brief delay
    setTimeout(() => {
      if (lastAddedModRef.current) {
        const categorySelect = lastAddedModRef.current.querySelector('select, input')
        if (categorySelect && 'focus' in categorySelect) {
          (categorySelect as HTMLElement).focus()
        }
      }
    }, 100)
  }

  const updateModification = (id: string, field: keyof Modification, value: string | number | undefined) => {
    setModifications(prev =>
      prev.map(mod => {
        if (mod.id === id) {
          // Validate category if updating category field
          if (field === 'category' && typeof value === 'string') {
            if (value === '' || isValidCategory(value)) {
              return { ...mod, [field]: value as ModificationCategory | '' };
            }
            // If invalid category, don't update and show error
            setValidationErrors(prev => ({
              ...prev,
              [`mod_${id}_category`]: 'Please select a valid modification category'
            }));
            return mod;
          }
          return { ...mod, [field]: value };
        }
        return mod;
      })
    )
    
    // Clear validation error for this modification
    if (validationErrors[`mod_${id}_${field}`]) {
      setValidationErrors(prev => ({ ...prev, [`mod_${id}_${field}`]: '' }))
    }
  }

  const removeModification = (id: string) => {
    const modIndex = modifications.findIndex(mod => mod.id === id)
    const modNumber = modIndex + 1
    
    setModifications(prev => {
      const updated = prev.filter(mod => mod.id !== id)
      setStatusMessage(`Removed modification ${modNumber}. Total modifications: ${updated.length}`)
      setTimeout(() => setStatusMessage(''), 3000)
      return updated
    })
    
    // Clear any validation errors for this modification
    setValidationErrors(prev => {
      const newErrors = { ...prev }
      Object.keys(newErrors).forEach(key => {
        if (key.includes(`mod_${id}_`)) {
          delete newErrors[key]
        }
      })
      return newErrors
    })
  }

  const validateForm = (): boolean => {
    const errors: Record<string, string> = {}

    modifications.forEach(mod => {
      // Validate required fields
      if (mod.category && !mod.description.trim()) {
        errors[`mod_${mod.id}_description`] = 'Description is required when category is selected'
      }
      if (mod.description.trim() && !mod.category) {
        errors[`mod_${mod.id}_category`] = 'Category is required when description is provided'
      }
      
      // Validate category is from allowed list
      if (mod.category && !isValidCategory(mod.category)) {
        errors[`mod_${mod.id}_category`] = 'Please select a valid modification category'
      }
      
      // Validate cost
      if (mod.cost !== undefined && mod.cost < 0) {
        errors[`mod_${mod.id}_cost`] = 'Cost cannot be negative'
      }
      if (mod.cost !== undefined && mod.cost > 1000000) {
        errors[`mod_${mod.id}_cost`] = 'Cost seems unreasonably high. Please verify.'
      }
      
      // Validate description length
      if (mod.description.trim() && mod.description.length < 10) {
        errors[`mod_${mod.id}_description`] = 'Description should be at least 10 characters long'
      }
      
      // Validate date if provided
      if (mod.date_installed) {
        const installDate = new Date(mod.date_installed + '-01'); // Add day since input is month only
        const currentDate = new Date();
        if (installDate > currentDate) {
          errors[`mod_${mod.id}_date_installed`] = 'Installation date cannot be in the future'
        }
      }
    })

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    // Remove empty modifications before validation
    const validModifications = modifications.filter(mod => 
      mod.category && mod.description.trim()
    )
    
    setModifications(validModifications)
    
    if (validateForm()) {
      updateData({ modifications: validModifications })
      onNext()
    }
  }

  const handlePrev = () => {
    updateData({ modifications })
    onPrev()
  }

  const totalModificationCost = modifications.reduce((total, mod) => {
    return total + (mod.cost || 0)
  }, 0)

  const hasValidationErrors = Object.keys(validationErrors).length > 0

  return (
    <section className="space-y-6" aria-labelledby="modifications-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {hasValidationErrors ? 
          `Form has ${Object.keys(validationErrors).length} validation errors. Please review and correct the highlighted fields.` : 
          'Modifications form ready for input'}
      </div>

      {/* Modification Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
      >
        {statusMessage}
      </div>

      {/* Header */}
      <header>
        <h2 id="modifications-heading" className="text-display-small font-bold text-md-sys-on-surface mb-2">
          Modifications
        </h2>
        <p className="text-md-body-large text-md-sys-on-surface-variant">
          List any modifications, upgrades, or custom work done to your vehicle. This section is optional but helps buyers understand the vehicle's current state and value.
        </p>
      </header>

      <form noValidate aria-labelledby="modifications-heading">
        {/* Modifications List */}
        <fieldset>
          <legend className="sr-only">Vehicle Modifications List</legend>
          
          <div className="space-y-4">
            {modifications.length === 0 ? (
              <div 
                className="text-center py-12 surface-container rounded-xl border border-md-sys-outline-variant"
                role="region"
                aria-labelledby="no-mods-heading"
                aria-describedby="no-mods-description"
              >
                <div className="w-16 h-16 mx-auto mb-4 surface-container-high rounded-full flex items-center justify-center">
                  <Settings className="w-8 h-8 text-md-sys-on-surface-variant" aria-hidden="true" />
                </div>
                <h3 id="no-mods-heading" className="text-md-body-large text-md-sys-on-surface-variant mb-6">
                  No modifications added yet
                </h3>
                <p id="no-mods-description" className="sr-only">
                  You haven't added any vehicle modifications. Click the button below to add your first modification.
                </p>
                <Button 
                  onClick={addModification} 
                  variant="filled"
                  aria-describedby="add-first-mod-help"
                >
                  <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                  Add First Modification
                </Button>
                <div id="add-first-mod-help" className="sr-only">
                  Click to add your first vehicle modification with category, description, cost, and installation date
                </div>
              </div>
            ) : (
              <>
                <div 
                  role="list" 
                  aria-labelledby="modifications-list-heading"
                  aria-describedby="modifications-list-description"
                >
                  <h3 id="modifications-list-heading" className="sr-only">
                    Vehicle Modifications ({modifications.length} total)
                  </h3>
                  <div id="modifications-list-description" className="sr-only">
                    List of vehicle modifications with category, cost, installation date, and description. Each modification can be edited or removed.
                  </div>
                  
                  {modifications.map((mod, index) => (
                    <div 
                      key={mod.id} 
                      ref={index === modifications.length - 1 ? lastAddedModRef : null}
                      role="listitem"
                      aria-labelledby={`mod-${index}-heading`}
                      aria-describedby={`mod-${index}-summary`}
                      className={cn(
                        'surface-container rounded-xl border border-md-sys-outline-variant p-6',
                        'transition-all duration-md-short3 ease-md-standard',
                        'hover:border-md-sys-primary/30'
                      )}
                    >
                      <div className="flex justify-between items-start mb-6">
                        <h4 id={`mod-${index}-heading`} className="text-md-title-medium font-medium text-md-sys-on-surface">
                          Modification #{index + 1}
                        </h4>
                        <Button
                          onClick={() => removeModification(mod.id)}
                          variant="text"
                          size="sm"
                          className="text-md-sys-error hover:text-md-sys-error focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                          aria-describedby={`remove-mod-${index}-desc`}
                        >
                          <Trash2 className="w-5 h-5" aria-hidden="true" />
                          <span className="sr-only">Remove modification {index + 1}</span>
                        </Button>
                        <div id={`remove-mod-${index}-desc`} className="sr-only">
                          Remove this modification from your listing. This action cannot be undone.
                        </div>
                      </div>

                      <div id={`mod-${index}-summary`} className="sr-only">
                        Modification {index + 1}: {mod.category || 'No category selected'}, 
                        {mod.description || 'No description'}, 
                        {mod.cost ? `Cost: $${mod.cost}` : 'No cost specified'}, 
                        {mod.date_installed || 'No installation date'}
                      </div>

                      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        {/* Category - Using our new Material You Select component */}
                        <Select
                          id={`mod-category-${mod.id}`}
                          label="Category"
                          placeholder="Select modification category..."
                          value={mod.category}
                          onChange={(e) => updateModification(mod.id, 'category', e.target.value)}
                          options={modificationCategories}
                          required
                          error={validationErrors[`mod_${mod.id}_category`]}
                          helperText="Choose the type of modification"
                          leadingIcon={<Settings className="w-5 h-5" aria-hidden="true" />}
                          aria-describedby={`mod-category-${mod.id}-context`}
                        />
                        <div id={`mod-category-${mod.id}-context`} className="sr-only">
                          Select the main category that best describes this modification type for modification {index + 1}
                        </div>

                        {/* Cost */}
                        <Input
                          id={`mod-cost-${mod.id}`}
                          type="number"
                          label="Cost (Optional)"
                          value={mod.cost?.toString() || ''}
                          onChange={(e) => updateModification(mod.id, 'cost', parseFloat(e.target.value) || undefined)}
                          min="0"
                          max="1000000"
                          step="50"
                          placeholder="1500"
                          error={validationErrors[`mod_${mod.id}_cost`]}
                          helperText="Enter the total cost of this modification"
                          aria-describedby={`mod-cost-${mod.id}-context`}
                        />
                        <div id={`mod-cost-${mod.id}-context`} className="sr-only">
                          Optional: Enter the total cost in dollars for modification {index + 1}
                        </div>

                        {/* Date Installed */}
                        <Input
                          id={`mod-date-${mod.id}`}
                          type="month"
                          label="Date Installed (Optional)"
                          value={mod.date_installed}
                          onChange={(e) => updateModification(mod.id, 'date_installed', e.target.value)}
                          error={validationErrors[`mod_${mod.id}_date_installed`]}
                          helperText="When was this modification completed?"
                          max={new Date().toISOString().slice(0, 7)} // Prevent future dates
                          aria-describedby={`mod-date-${mod.id}-context`}
                        />
                        <div id={`mod-date-${mod.id}-context`} className="sr-only">
                          Optional: Select the month and year when modification {index + 1} was installed. Cannot be in the future.
                        </div>
                      </div>

                      {/* Description */}
                      <div className="mt-6">
                        <Textarea
                          id={`mod-description-${mod.id}`}
                          label="Description"
                          value={mod.description}
                          onChange={(e) => updateModification(mod.id, 'description', e.target.value)}
                          placeholder="Describe the modification, parts used, installation details, etc."
                          minLength={10}
                          maxLength={500}
                          required
                          error={validationErrors[`mod_${mod.id}_description`]}
                          helperText="Be specific about parts, brands, and installation details (min. 10 characters)"
                          rows={3}
                          aria-describedby={`mod-description-${mod.id}-context mod-description-${mod.id}-counter`}
                        />
                        <div id={`mod-description-${mod.id}-context`} className="sr-only">
                          Detailed description for modification {index + 1}. Include specific parts, brands, installation details, and any relevant information.
                        </div>
                        <div 
                          id={`mod-description-${mod.id}-counter`} 
                          className="sr-only"
                          aria-live="polite"
                        >
                          {mod.description.length} of 500 characters used
                        </div>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Add Another Modification Button */}
                <div className="text-center">
                  <Button 
                    onClick={addModification} 
                    variant="outlined"
                    aria-describedby="add-another-mod-help"
                    className="focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                  >
                    <Plus className="w-5 h-5 mr-2" aria-hidden="true" />
                    Add Another Modification
                  </Button>
                  <div id="add-another-mod-help" className="sr-only">
                    Add another vehicle modification to your listing. You currently have {modifications.length} modification{modifications.length !== 1 ? 's' : ''}.
                  </div>
                </div>

                {/* Summary */}
                {modifications.length > 0 && totalModificationCost > 0 && (
                  <section 
                    className="bg-md-sys-primary-container/30 border border-md-sys-primary/20 rounded-xl p-6"
                    aria-labelledby="cost-summary-heading"
                    role="region"
                  >
                    <div className="flex justify-between items-center">
                      <span id="cost-summary-heading" className="text-md-body-medium font-medium text-md-sys-on-surface">
                        Total Modification Cost:
                      </span>
                      <span 
                        className="text-md-headline-small font-bold text-md-sys-primary"
                        aria-describedby="total-cost-description"
                      >
                        ${totalModificationCost.toLocaleString()}
                      </span>
                    </div>
                    <div id="total-cost-description" className="sr-only">
                      Combined cost of all modifications with specified costs: {totalModificationCost} dollars
                    </div>
                  </section>
                )}
              </>
            )}
          </div>
        </fieldset>

        {/* Help Text */}
        <section 
          className="surface-container-low rounded-xl border border-md-sys-outline-variant p-6"
          aria-labelledby="tips-heading"
        >
          <h4 id="tips-heading" className="text-md-title-small font-medium text-md-sys-on-surface mb-4">
            Tips for listing modifications:
          </h4>
          <ul className="text-md-body-medium text-md-sys-on-surface-variant space-y-2" role="list">
            <li className="flex items-start gap-2" role="listitem">
              <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full mt-2 flex-shrink-0" aria-hidden="true"></span>
              Include brand names and part numbers when possible
            </li>
            <li className="flex items-start gap-2" role="listitem">
              <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full mt-2 flex-shrink-0" aria-hidden="true"></span>
              Mention if work was done professionally vs. DIY
            </li>
            <li className="flex items-start gap-2" role="listitem">
              <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full mt-2 flex-shrink-0" aria-hidden="true"></span>
              Note if you have receipts or documentation
            </li>
            <li className="flex items-start gap-2" role="listitem">
              <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full mt-2 flex-shrink-0" aria-hidden="true"></span>
              Be honest about any issues or incomplete work
            </li>
            <li className="flex items-start gap-2" role="listitem">
              <span className="w-1.5 h-1.5 bg-md-sys-primary rounded-full mt-2 flex-shrink-0" aria-hidden="true"></span>
              List performance gains if measured (dyno numbers, etc.)
            </li>
          </ul>
        </section>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t border-md-sys-outline-variant mt-8">
          <Button 
            onClick={handlePrev} 
            variant="outlined"
            aria-describedby="prev-button-help"
            className="focus-visible:ring-2 focus-visible:ring-gray-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
          >
            Previous: Vehicle Specs
          </Button>
          <div id="prev-button-help" className="sr-only">
            Go back to the previous step to edit vehicle specifications
          </div>
          
          <Button 
            onClick={handleNext} 
            variant="filled"
            aria-describedby="next-button-help"
            className="focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
          >
            Next: Photos
          </Button>
          <div id="next-button-help" className="sr-only">
            Proceed to the next step to upload vehicle photos. All modifications will be validated before continuing.
          </div>
        </div>
      </form>
    </section>
  )
} 