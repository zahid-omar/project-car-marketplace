'use client'

import { useState, useRef, useCallback } from 'react'
import Image from 'next/image'
import { CameraIcon, TrashIcon, CheckIcon, XMarkIcon } from '@heroicons/react/24/outline'

interface ProfilePictureUploadProps {
  currentImageUrl?: string | null
  onImageUpdate: (imageUrl: string | null) => void
  className?: string
}

export default function ProfilePictureUpload({ 
  currentImageUrl, 
  onImageUpdate, 
  className = '' 
}: ProfilePictureUploadProps) {
  const [isUploading, setIsUploading] = useState(false)
  const [previewUrl, setPreviewUrl] = useState<string | null>(null)
  const [selectedFile, setSelectedFile] = useState<File | null>(null)
  const [uploadProgress, setUploadProgress] = useState(0)
  const [error, setError] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileSelect = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0]
    if (!file) return

    // Validate file type
    const allowedTypes = ['image/jpeg', 'image/jpg', 'image/png', 'image/webp']
    if (!allowedTypes.includes(file.type)) {
      setError('Invalid file type. Only JPEG, PNG, and WebP images are allowed.')
      return
    }

    // Validate file size (5MB max)
    const maxSize = 5 * 1024 * 1024 // 5MB
    if (file.size > maxSize) {
      setError('File too large. Maximum size is 5MB.')
      return
    }

    setError(null)
    setSelectedFile(file)

    // Create preview URL
    const reader = new FileReader()
    reader.onload = (e) => {
      setPreviewUrl(e.target?.result as string)
    }
    reader.readAsDataURL(file)
  }, [])

  const handleUpload = async () => {
    if (!selectedFile) return

    setIsUploading(true)
    setUploadProgress(0)
    setError(null)

    try {
      const formData = new FormData()
      formData.append('file', selectedFile)

      // Simulate upload progress
      const progressInterval = setInterval(() => {
        setUploadProgress(prev => Math.min(prev + 10, 90))
      }, 100)

      const response = await fetch('/api/profile/avatar', {
        method: 'POST',
        body: formData,
      })

      clearInterval(progressInterval)
      setUploadProgress(100)

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Upload failed')
      }

      const data = await response.json()
      
      // Update the parent component
      onImageUpdate(data.imageUrl)
      
      // Clear preview and selected file
      setPreviewUrl(null)
      setSelectedFile(null)
      
      // Reset file input
      if (fileInputRef.current) {
        fileInputRef.current.value = ''
      }

    } catch (error) {
      console.error('Upload error:', error)
      setError(error instanceof Error ? error.message : 'Upload failed')
    } finally {
      setIsUploading(false)
      setUploadProgress(0)
    }
  }

  const handleRemoveImage = async () => {
    if (!currentImageUrl) return

    setIsUploading(true)
    setError(null)

    try {
      const response = await fetch('/api/profile/avatar', {
        method: 'DELETE',
      })

      if (!response.ok) {
        const errorData = await response.json()
        throw new Error(errorData.error || 'Failed to remove image')
      }

      onImageUpdate(null)
    } catch (error) {
      console.error('Remove error:', error)
      setError(error instanceof Error ? error.message : 'Failed to remove image')
    } finally {
      setIsUploading(false)
    }
  }

  const handleCancel = () => {
    setPreviewUrl(null)
    setSelectedFile(null)
    setError(null)
    if (fileInputRef.current) {
      fileInputRef.current.value = ''
    }
  }

  const displayImageUrl = previewUrl || currentImageUrl

  return (
    <div className={`flex flex-col items-center space-y-4 ${className}`}>
      {/* Image Display */}
      <div className="relative">
        <div className="w-32 h-32 rounded-full overflow-hidden bg-md-sys-surface-container border-4 border-md-sys-surface shadow-md-elevation-2">
          {displayImageUrl ? (
            <Image
              src={displayImageUrl}
              alt="Profile"
              width={128}
              height={128}
              className="w-full h-full object-cover"
              unoptimized={previewUrl ? true : false}
            />
          ) : (
            <div className="w-full h-full flex flex-col items-center justify-center bg-md-sys-surface-container-high">
              <CameraIcon className="w-8 h-8 text-md-sys-on-surface-variant mb-2" />
              <div className="text-center px-3">
                <p className="text-xs italic text-md-sys-on-surface-variant leading-tight">
                  (Max: 5MB - JPEG, PNG, WebP)
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Upload Progress Overlay */}
        {isUploading && uploadProgress > 0 && (
          <div className="absolute inset-0 rounded-full bg-black bg-opacity-50 flex items-center justify-center">
            <div className="text-white text-md-label-medium font-medium">
              {uploadProgress}%
            </div>
          </div>
        )}
      </div>

      {/* Action Buttons */}
      <div className="flex flex-col items-center space-y-3">
        {previewUrl && selectedFile ? (
          // Preview mode buttons
          <div className="flex space-x-2">
            <button
              onClick={handleUpload}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-md-sys-primary text-md-sys-on-primary rounded-lg hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-medium font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <CheckIcon className="w-3.5 h-3.5" />
              <span>{isUploading ? 'Uploading...' : 'Upload'}</span>
            </button>
            <button
              onClick={handleCancel}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-md-sys-surface-container text-md-sys-on-surface rounded-lg border border-md-sys-outline-variant hover:bg-md-sys-surface-container-high transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 text-md-label-medium font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <XMarkIcon className="w-3.5 h-3.5" />
              <span>Cancel</span>
            </button>
          </div>
        ) : (
          // Normal mode buttons
          <div className="flex space-x-2">
            <button
              onClick={() => fileInputRef.current?.click()}
              disabled={isUploading}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-md-sys-primary text-md-sys-on-primary rounded-lg hover:bg-md-sys-primary/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-primary/20 focus-visible:ring-2 focus-visible:ring-md-sys-primary text-md-label-medium font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
            >
              <CameraIcon className="w-3.5 h-3.5" />
              <span>Change</span>
            </button>
            
            {currentImageUrl && (
              <button
                onClick={handleRemoveImage}
                disabled={isUploading}
                className="flex items-center gap-1.5 px-3 py-1.5 bg-md-sys-error text-md-sys-on-error rounded-lg hover:bg-md-sys-error/90 transition-all duration-200 hover:scale-105 focus:outline-none focus:ring-2 focus:ring-md-sys-error/20 focus-visible:ring-2 focus-visible:ring-md-sys-error text-md-label-medium font-medium shadow-md-elevation-1 hover:shadow-md-elevation-2 disabled:opacity-60 disabled:cursor-not-allowed disabled:hover:scale-100"
              >
                <TrashIcon className="w-3.5 h-3.5" />
                <span>Remove</span>
              </button>
            )}
          </div>
        )}

        {/* Upload Progress Bar */}
        {isUploading && uploadProgress > 0 && (
          <div className="w-48 bg-md-sys-surface-container-high rounded-full h-2 shadow-md-elevation-1">
            <div 
              className="bg-md-sys-primary h-2 rounded-full transition-all duration-300"
              style={{ width: `${uploadProgress}%` }}
            />
          </div>
        )}

        {/* Error Message */}
        {error && (
          <div className="bg-md-sys-error-container border border-md-sys-error/20 rounded-xl p-4 max-w-xs">
            <p className="text-md-sys-on-error-container text-md-body-small text-center">{error}</p>
          </div>
        )}

        {/* File Info */}
        {selectedFile && (
          <div className="bg-md-sys-surface-container-low rounded-xl px-4 py-2 border border-md-sys-outline-variant/30">
            <p className="text-md-sys-on-surface-variant text-md-body-small text-center">
              {selectedFile.name} ({(selectedFile.size / 1024 / 1024).toFixed(1)} MB)
            </p>
          </div>
        )}
      </div>

      {/* Hidden File Input */}
      <input
        ref={fileInputRef}
        type="file"
        accept="image/jpeg,image/jpg,image/png,image/webp"
        onChange={handleFileSelect}
        className="hidden"
      />
    </div>
  )
} 