'use client'

import { useState, useRef } from 'react'
import Image from 'next/image'
import { ListingFormData } from '@/app/sell/page'
import { PhotoIcon, XMarkIcon, StarIcon } from '@heroicons/react/24/outline'
import { StarIcon as StarIconSolid } from '@heroicons/react/24/solid'

interface ImagesFormProps {
  data: ListingFormData
  updateData: (data: Partial<ListingFormData>) => void
  onNext: () => void
  onPrev: () => void
  errors: Record<string, string>
}

export default function ImagesForm({ data, updateData, onNext, onPrev }: ImagesFormProps) {
  const [images, setImages] = useState(data.images)
  const [dragActive, setDragActive] = useState(false)
  const [validationErrors, setValidationErrors] = useState<Record<string, string>>({})
  const [uploadStatus, setUploadStatus] = useState<string>('')
  const fileInputRef = useRef<HTMLInputElement>(null)

  const MAX_IMAGES = 10
  const MAX_FILE_SIZE = 5 * 1024 * 1024 // 5MB
  const ACCEPTED_TYPES = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']

  const handleFiles = (files: FileList) => {
    const newImages: typeof images = []
    const errors: string[] = []

    setUploadStatus(`Processing ${files.length} file${files.length > 1 ? 's' : ''}...`)

    Array.from(files).forEach(file => {
      // Check file type
      if (!ACCEPTED_TYPES.includes(file.type)) {
        errors.push(`${file.name}: Only JPEG, PNG, and WebP images are allowed`)
        return
      }

      // Check file size
      if (file.size > MAX_FILE_SIZE) {
        errors.push(`${file.name}: File size must be less than 5MB`)
        return
      }

      // Check total image count
      if (images.length + newImages.length >= MAX_IMAGES) {
        errors.push(`Maximum of ${MAX_IMAGES} images allowed`)
        return
      }

      // Create preview
      const reader = new FileReader()
      reader.onload = (e) => {
        const newImage = {
          id: Date.now().toString() + Math.random().toString(36).substr(2, 9),
          file,
          preview: e.target?.result as string,
          caption: '',
          is_primary: images.length === 0 && newImages.length === 0 // First image is primary by default
        }
        newImages.push(newImage)
        
        if (newImages.length === Array.from(files).filter(f => 
          ACCEPTED_TYPES.includes(f.type) && f.size <= MAX_FILE_SIZE
        ).length) {
          setImages(prev => {
            const updated = [...prev, ...newImages]
            setUploadStatus(`Successfully uploaded ${newImages.length} image${newImages.length > 1 ? 's' : ''}. Total: ${updated.length} of ${MAX_IMAGES}`)
            return updated
          })
          // Clear upload status after a delay
          setTimeout(() => setUploadStatus(''), 3000)
        }
      }
      reader.readAsDataURL(file)
    })

    if (errors.length > 0) {
      setValidationErrors({ upload: errors.join('. ') })
      setUploadStatus('')
    } else {
      setValidationErrors({})
    }
  }

  const handleDrag = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    if (e.type === 'dragenter' || e.type === 'dragover') {
      setDragActive(true)
    } else if (e.type === 'dragleave') {
      setDragActive(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    e.stopPropagation()
    setDragActive(false)
    
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFiles(e.dataTransfer.files)
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFiles(e.target.files)
    }
  }

  const removeImage = (id: string) => {
    const imageToRemove = images.find(img => img.id === id)
    setImages(prev => {
      const newImages = prev.filter(img => img.id !== id)
      // If we removed the primary image, make the first remaining image primary
      if (newImages.length > 0 && !newImages.some(img => img.is_primary)) {
        newImages[0].is_primary = true
        setUploadStatus(`Removed image. Set ${newImages[0].file.name} as new primary image.`)
      } else {
        setUploadStatus(imageToRemove ? `Removed ${imageToRemove.file.name}` : 'Removed image')
      }
      setTimeout(() => setUploadStatus(''), 3000)
      return newImages
    })
  }

  const setPrimaryImage = (id: string) => {
    const selectedImage = images.find(img => img.id === id)
    setImages(prev =>
      prev.map(img => ({
        ...img,
        is_primary: img.id === id
      }))
    )
    if (selectedImage) {
      setUploadStatus(`Set ${selectedImage.file.name} as primary image`)
      setTimeout(() => setUploadStatus(''), 3000)
    }
  }

  const updateCaption = (id: string, caption: string) => {
    setImages(prev =>
      prev.map(img =>
        img.id === id ? { ...img, caption } : img
      )
    )
  }

  const validateForm = () => {
    const errors: Record<string, string> = {}

    if (images.length === 0) {
      errors.images = 'At least one image is required'
    }

    if (!images.some(img => img.is_primary)) {
      errors.primary = 'Please select a primary image'
    }

    setValidationErrors(errors)
    return Object.keys(errors).length === 0
  }

  const handleNext = () => {
    if (validateForm()) {
      updateData({ images })
      onNext()
    }
  }

  const handlePrev = () => {
    updateData({ images })
    onPrev()
  }

  const hasValidationErrors = Object.keys(validationErrors).length > 0;

  return (
    <section className="space-y-6" aria-labelledby="images-heading">
      {/* Form Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="true"
        className="sr-only"
      >
        {hasValidationErrors ? 
          `Form has ${Object.keys(validationErrors).length} validation errors. Please review and correct the issues.` : 
          'Images form ready for upload'}
      </div>

      {/* Upload Status Live Region */}
      <div 
        role="status" 
        aria-live="polite" 
        aria-atomic="false"
        className="sr-only"
      >
        {uploadStatus}
      </div>

      {/* Header */}
      <header>
        <h2 id="images-heading" className="text-2xl font-bold text-gray-900 mb-2">
          Photos
        </h2>
        <p className="text-gray-600">
          Upload high-quality photos of your vehicle. At least one image is required. The first image will be your primary photo that appears in listings.
        </p>
      </header>

      <form noValidate aria-labelledby="images-heading">
        {/* Upload Area */}
        <fieldset>
          <legend className="sr-only">Upload Vehicle Photos</legend>
          
          <div
            className={`relative border-2 border-dashed rounded-lg p-6 transition-all duration-200 ${
              dragActive
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-gray-400'
            }`}
            onDragEnter={handleDrag}
            onDragLeave={handleDrag}
            onDragOver={handleDrag}
            onDrop={handleDrop}
            role="region"
            aria-labelledby="upload-area-heading"
            aria-describedby="upload-instructions upload-requirements"
          >
            <div className="text-center">
              <PhotoIcon 
                className="mx-auto h-12 w-12 text-gray-400" 
                aria-hidden="true"
              />
              <div className="mt-4">
                <h3 id="upload-area-heading" className="sr-only">
                  Image Upload Area
                </h3>
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  aria-describedby="upload-instructions upload-requirements"
                  className="btn-primary focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                >
                  Choose Images
                </button>
                <p id="upload-instructions" className="mt-2 text-sm text-gray-600">
                  or drag and drop images here
                </p>
              </div>
              <p id="upload-requirements" className="text-xs text-gray-500 mt-2">
                PNG, JPG, WebP up to 5MB each. Maximum {MAX_IMAGES} images. Currently uploaded: {images.length} of {MAX_IMAGES}.
              </p>
            </div>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept={ACCEPTED_TYPES.join(',')}
              onChange={handleFileSelect}
              aria-describedby="upload-instructions upload-requirements"
              aria-label="Select images to upload"
              className="sr-only"
            />
          </div>
        </fieldset>

        {/* Validation Errors */}
        {hasValidationErrors && (
          <div 
            className="bg-red-50 border border-red-200 text-red-600 px-4 py-3 rounded-md text-sm"
            role="alert"
            aria-labelledby="error-heading"
          >
            <h3 id="error-heading" className="sr-only">Upload Errors</h3>
            {validationErrors.upload || validationErrors.images || validationErrors.primary}
          </div>
        )}

        {/* Image Grid */}
        {images.length > 0 && (
          <section aria-labelledby="uploaded-images-heading">
            <div className="space-y-4">
              <div className="flex justify-between items-center">
                <h3 id="uploaded-images-heading" className="text-lg font-medium text-gray-900">
                  Uploaded Images ({images.length}/{MAX_IMAGES})
                </h3>
                <p className="text-sm text-gray-500" id="primary-instruction">
                  Click the star to set primary image
                </p>
              </div>

              <div 
                className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 gap-4"
                role="list"
                aria-labelledby="uploaded-images-heading"
                aria-describedby="primary-instruction"
              >
                {images.map((image, index) => (
                  <div
                    key={image.id}
                    className={`relative group border-2 rounded-lg overflow-hidden transition-all duration-200 ${
                      image.is_primary ? 'border-blue-500 shadow-lg' : 'border-gray-200'
                    }`}
                    role="listitem"
                    aria-labelledby={`image-${index}-label`}
                    aria-describedby={`image-${index}-status`}
                  >
                    {/* Image */}
                    <div className="aspect-square relative">
                      <Image
                        src={image.preview}
                        alt={image.caption || `Vehicle photo ${index + 1}${image.is_primary ? ' (Primary)' : ''}`}
                        fill
                        className="object-cover"
                      />
                      
                      {/* Overlay Controls */}
                      <div className="absolute inset-0 bg-black bg-opacity-0 group-hover:bg-opacity-50 transition-all duration-200 flex items-center justify-center">
                        <div className="opacity-0 group-hover:opacity-100 transition-opacity duration-200 flex space-x-2">
                          {/* Primary Image Button */}
                          <button
                            type="button"
                            onClick={() => setPrimaryImage(image.id)}
                            aria-pressed={image.is_primary}
                            aria-describedby={`primary-button-${index}-desc`}
                            className={`p-2 rounded-full focus-visible:ring-2 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200 ${
                              image.is_primary
                                ? 'bg-yellow-500 text-white focus-visible:ring-yellow-500/50'
                                : 'bg-white text-gray-700 hover:bg-yellow-50 focus-visible:ring-blue-500/50'
                            }`}
                            title={image.is_primary ? 'Primary image' : 'Set as primary'}
                          >
                            {image.is_primary ? (
                              <StarIconSolid className="w-4 h-4" aria-hidden="true" />
                            ) : (
                              <StarIcon className="w-4 h-4" aria-hidden="true" />
                            )}
                            <span className="sr-only">
                              {image.is_primary ? 'Remove as primary image' : 'Set as primary image'}
                            </span>
                          </button>
                          <div id={`primary-button-${index}-desc`} className="sr-only">
                            {image.is_primary ? 
                              'This is currently the primary image that will appear first in listings' : 
                              'Click to make this the primary image that appears first in listings'
                            }
                          </div>
                          
                          {/* Remove Button */}
                          <button
                            type="button"
                            onClick={() => removeImage(image.id)}
                            aria-describedby={`remove-button-${index}-desc`}
                            className="p-2 bg-red-500 text-white rounded-full hover:bg-red-600 focus-visible:ring-2 focus-visible:ring-red-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
                            title="Remove image"
                          >
                            <XMarkIcon className="w-4 h-4" aria-hidden="true" />
                            <span className="sr-only">
                              Remove image {index + 1}
                            </span>
                          </button>
                          <div id={`remove-button-${index}-desc`} className="sr-only">
                            Remove this image from your listing. This action cannot be undone.
                          </div>
                        </div>
                      </div>

                      {/* Primary Badge */}
                      {image.is_primary && (
                        <div 
                          className="absolute top-2 left-2 bg-yellow-500 text-white text-xs px-2 py-1 rounded"
                          role="status"
                          aria-label="Primary image badge"
                        >
                          Primary
                        </div>
                      )}
                    </div>

                    {/* Image Label and Status */}
                    <div id={`image-${index}-label`} className="sr-only">
                      Image {index + 1}: {image.file.name}
                    </div>
                    <div id={`image-${index}-status`} className="sr-only">
                      {image.is_primary ? 'This is the primary image' : 'Regular image'}. 
                      Caption: {image.caption || 'No caption'}
                    </div>

                    {/* Caption Input */}
                    <div className="p-2 bg-white">
                      <label htmlFor={`caption-${index}`} className="sr-only">
                        Caption for image {index + 1}
                      </label>
                      <input
                        id={`caption-${index}`}
                        type="text"
                        placeholder="Add caption (optional)"
                        value={image.caption}
                        onChange={(e) => updateCaption(image.id, e.target.value)}
                        maxLength={100}
                        aria-describedby={`caption-${index}-help caption-${index}-counter`}
                        className="w-full text-xs border border-gray-200 rounded px-2 py-1 focus:outline-none focus-visible:ring-1 focus-visible:ring-blue-500 focus:border-blue-500 transition-all duration-200"
                      />
                      <div className="flex justify-between items-center mt-1">
                        <div id={`caption-${index}-help`} className="sr-only">
                          Optional descriptive text for this image
                        </div>
                        <div 
                          id={`caption-${index}-counter`} 
                          className="text-xs text-gray-400"
                          aria-live="polite"
                          aria-label={`${image.caption?.length || 0} of 100 characters used`}
                        >
                          {image.caption?.length || 0}/100
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </section>
        )}

        {/* Photo Tips */}
        <section 
          className="bg-gray-50 border border-gray-200 rounded-lg p-4"
          aria-labelledby="photo-tips-heading"
        >
          <h4 id="photo-tips-heading" className="text-sm font-medium text-gray-900 mb-2">
            Photo Tips:
          </h4>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-gray-600">
            <ul className="space-y-1" role="list" aria-labelledby="basic-tips-heading">
              <li role="listitem">• Take photos in good lighting</li>
              <li role="listitem">• Include exterior from all angles</li>
              <li role="listitem">• Show interior and dashboard</li>
              <li role="listitem">• Capture engine bay and modifications</li>
            </ul>
            <ul className="space-y-1" role="list" aria-labelledby="advanced-tips-heading">
              <li role="listitem">• Document any damage or wear</li>
              <li role="listitem">• Include close-ups of special features</li>
              <li role="listitem">• Show documentation if available</li>
              <li role="listitem">• Use landscape orientation when possible</li>
            </ul>
          </div>
          <div id="basic-tips-heading" className="sr-only">Basic Photography Tips</div>
          <div id="advanced-tips-heading" className="sr-only">Advanced Photography Tips</div>
        </section>

        {/* Navigation */}
        <div className="flex justify-between pt-6 border-t mt-8">
          <button
            type="button"
            onClick={handlePrev}
            aria-describedby="prev-button-help"
            className="btn-secondary focus-visible:ring-2 focus-visible:ring-gray-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
          >
            Previous: Modifications
          </button>
          <div id="prev-button-help" className="sr-only">
            Go back to the previous step to edit vehicle modifications
          </div>
          
          <button
            type="button"
            onClick={handleNext}
            aria-describedby="next-button-help"
            className="btn-primary focus-visible:ring-2 focus-visible:ring-blue-500/50 focus-visible:ring-offset-2 focus:outline-none transition-all duration-200"
          >
            Next: Preview & Submit
          </button>
          <div id="next-button-help" className="sr-only">
            Proceed to the final step to preview your listing and submit. At least one image is required to continue.
          </div>
        </div>
      </form>
    </section>
  )
} 