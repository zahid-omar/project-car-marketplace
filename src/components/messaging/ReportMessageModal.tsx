'use client';

import React, { useState } from 'react';
import { MessageWithProfiles, REPORT_REASONS, ReportFormData } from '@/types/messages';
import { X, Flag, AlertTriangle, Send } from 'lucide-react';
import LoadingSpinner from '@/components/LoadingSpinner';

interface ReportMessageModalProps {
  message: MessageWithProfiles;
  isOpen: boolean;
  onClose: () => void;
  onReportSubmitted?: () => void;
}

export default function ReportMessageModal({
  message,
  isOpen,
  onClose,
  onReportSubmitted
}: ReportMessageModalProps) {
  const [formData, setFormData] = useState<ReportFormData>({
    reason: 'spam',
    description: ''
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (submitting) return;

    setSubmitting(true);
    setError(null);

    try {
      const response = await fetch('/api/reports', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          message_id: message.id,
          reason: formData.reason,
          description: formData.description.trim() || undefined
        })
      });

      if (!response.ok) {
        const errorData = await response.json();
        throw new Error(errorData.error || 'Failed to submit report');
      }

      setSuccess(true);
      
      // Auto-close after success
      setTimeout(() => {
        onClose();
        onReportSubmitted?.();
        
        // Reset form state
        setFormData({ reason: 'spam', description: '' });
        setSuccess(false);
      }, 2000);

    } catch (error) {
      console.error('Error submitting report:', error);
      setError(error instanceof Error ? error.message : 'Failed to submit report');
    } finally {
      setSubmitting(false);
    }
  };

  const handleClose = () => {
    if (submitting) return;
    setFormData({ reason: 'spam', description: '' });
    setError(null);
    setSuccess(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white rounded-lg max-w-md w-full max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200">
          <div className="flex items-center space-x-3">
            <Flag className="h-5 w-5 text-red-600" />
            <h3 className="text-lg font-semibold text-gray-900">Report Message</h3>
          </div>
          <button
            onClick={handleClose}
            disabled={submitting}
            className="text-gray-400 hover:text-gray-600 transition-colors p-1 rounded"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Success State */}
        {success && (
          <div className="p-6 text-center">
            <div className="mx-auto flex items-center justify-center h-12 w-12 rounded-full bg-green-100 mb-4">
              <svg className="h-6 w-6 text-green-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h4 className="text-lg font-medium text-gray-900 mb-2">Report Submitted</h4>
            <p className="text-sm text-gray-600">
              Thank you for helping keep our community safe. We'll review this report and take appropriate action.
            </p>
          </div>
        )}

        {/* Form */}
        {!success && (
          <>
            {/* Message Preview */}
            <div className="p-6 border-b border-gray-200 bg-gray-50">
              <h4 className="text-sm font-medium text-gray-700 mb-2">Reporting this message:</h4>
              <div className="bg-white border border-gray-200 rounded-lg p-3">
                <div className="flex items-center space-x-2 mb-2">
                  <span className="text-sm font-medium text-gray-900">
                    {message.sender.display_name}
                  </span>
                  <span className="text-xs text-gray-500">
                    {new Date(message.created_at).toLocaleDateString()}
                  </span>
                </div>
                <p className="text-sm text-gray-700 break-words">
                  {message.message_text.length > 150 
                    ? `${message.message_text.slice(0, 150)}...`
                    : message.message_text
                  }
                </p>
              </div>
            </div>

            {/* Form Content */}
            <form onSubmit={handleSubmit} className="p-6">
              {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                  <div className="flex items-center">
                    <AlertTriangle className="h-4 w-4 text-red-600 mr-2" />
                    <span className="text-sm text-red-700">{error}</span>
                  </div>
                </div>
              )}

              {/* Reason Selection */}
              <div className="mb-6">
                <label className="block text-sm font-medium text-gray-700 mb-3">
                  Why are you reporting this message?
                </label>
                <div className="space-y-3">
                  {Object.entries(REPORT_REASONS).map(([key, reason]) => (
                    <label key={key} className="flex items-start space-x-3 cursor-pointer">
                      <input
                        type="radio"
                        name="reason"
                        value={key}
                        checked={formData.reason === key}
                        onChange={(e) => setFormData(prev => ({ ...prev, reason: e.target.value as any }))}
                        className="mt-1 h-4 w-4 text-red-600 focus:ring-red-500 border-gray-300"
                      />
                      <div className="flex-1">
                        <div className="text-sm font-medium text-gray-900">
                          {reason.label}
                        </div>
                        <div className="text-xs text-gray-500">
                          {reason.description}
                        </div>
                      </div>
                    </label>
                  ))}
                </div>
              </div>

              {/* Additional Details */}
              <div className="mb-6">
                <label htmlFor="description" className="block text-sm font-medium text-gray-700 mb-2">
                  Additional details (optional)
                </label>
                <textarea
                  id="description"
                  value={formData.description}
                  onChange={(e) => setFormData(prev => ({ ...prev, description: e.target.value }))}
                  placeholder="Provide any additional context that might help us review this report..."
                  rows={4}
                  maxLength={500}
                  className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500 focus:border-red-500 resize-none"
                />
                <div className="mt-1 text-xs text-gray-500 text-right">
                  {formData.description.length}/500
                </div>
              </div>

              {/* Warning */}
              <div className="mb-6 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="flex items-start">
                  <AlertTriangle className="h-4 w-4 text-yellow-600 mr-2 mt-0.5 flex-shrink-0" />
                  <div className="text-xs text-yellow-800">
                    <p className="font-medium mb-1">Please note:</p>
                    <ul className="space-y-1">
                      <li>• False reports may result in penalties to your account</li>
                      <li>• Reports are reviewed by our moderation team</li>
                      <li>• You'll be notified if action is taken</li>
                    </ul>
                  </div>
                </div>
              </div>

              {/* Actions */}
              <div className="flex space-x-3">
                <button
                  type="button"
                  onClick={handleClose}
                  disabled={submitting}
                  className="flex-1 px-4 py-2 border border-gray-300 rounded-lg text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submitting}
                  className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg text-sm font-medium hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-red-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center"
                >
                  {submitting ? (
                    <LoadingSpinner />
                  ) : (
                    <>
                      <Flag className="h-4 w-4 mr-2" />
                      Submit Report
                    </>
                  )}
                </button>
              </div>
            </form>
          </>
        )}
      </div>
    </div>
  );
} 