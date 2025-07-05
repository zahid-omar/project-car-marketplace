'use client';

import React, { useState, useEffect } from 'react';
import { X, Search, Send, Car, User } from 'lucide-react';
import { DEFAULT_MESSAGE_TEMPLATES, MessageTemplate } from '@/types/messages';

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  user_id: string;
  status: string;
}

interface Profile {
  id: string;
  display_name: string;
  profile_image_url?: string;
  email: string;
}

interface ListingWithSeller extends Listing {
  seller: Profile;
}

interface NewMessageModalProps {
  onClose: () => void;
  onSendMessage: (messageData: any) => Promise<any>;
}

export default function NewMessageModal({ onClose, onSendMessage }: NewMessageModalProps) {
  const [step, setStep] = useState<'listing' | 'compose'>('listing');
  const [selectedListing, setSelectedListing] = useState<ListingWithSeller | null>(null);
  const [listings, setListings] = useState<ListingWithSeller[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  
  // Message composition
  const [messageText, setMessageText] = useState('');
  const [selectedTemplate, setSelectedTemplate] = useState<MessageTemplate | null>(null);
  const [sending, setSending] = useState(false);

  // Fetch listings
  const fetchListings = async () => {
    try {
      setLoading(true);
      const response = await fetch('/api/listings/public?limit=50');
      
      if (!response.ok) {
        throw new Error('Failed to fetch listings');
      }
      
      const data = await response.json();
      setListings(data.listings || []);
    } catch (err) {
      console.error('Error fetching listings:', err);
      setError('Failed to load listings');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (step === 'listing') {
      fetchListings();
    }
  }, [step]);

  // Filter listings based on search
  const filteredListings = listings.filter(listing => 
    `${listing.year} ${listing.make} ${listing.model} ${listing.title}`
      .toLowerCase()
      .includes(searchQuery.toLowerCase())
  );

  const handleListingSelect = (listing: ListingWithSeller) => {
    setSelectedListing(listing);
    setStep('compose');
  };

  const handleTemplateSelect = (template: MessageTemplate) => {
    setSelectedTemplate(template);
    // Replace variables in template
    let content = template.content;
    if (selectedListing) {
      content = content.replace('{listing_title}', `${selectedListing.year} ${selectedListing.make} ${selectedListing.model}`);
      content = content.replace('{price}', formatPrice(selectedListing.price));
    }
    setMessageText(content);
  };

  const handleSendMessage = async () => {
    if (!selectedListing || !messageText.trim()) return;

    setSending(true);
    try {
      await onSendMessage({
        listing_id: selectedListing.id,
        recipient_id: selectedListing.user_id,
        message_text: messageText.trim(),
        message_type: selectedTemplate?.type || 'text'
      });
      onClose();
    } catch (error) {
      console.error('Error sending message:', error);
      setError('Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-y-auto">
      <div className="flex items-center justify-center min-h-screen pt-4 px-4 pb-20 text-center sm:block sm:p-0">
        {/* Background overlay */}
        <div className="fixed inset-0 bg-gray-500 bg-opacity-75 transition-opacity" onClick={onClose}></div>

        {/* Modal */}
        <div className="inline-block align-bottom bg-white rounded-lg px-4 pt-5 pb-4 text-left overflow-hidden shadow-xl transform transition-all sm:my-8 sm:align-middle sm:max-w-2xl sm:w-full sm:p-6">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-lg leading-6 font-medium text-gray-900">
              {step === 'listing' ? 'Select Listing' : 'Compose Message'}
            </h3>
            <button
              onClick={onClose}
              className="bg-white rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <X className="h-6 w-6" />
            </button>
          </div>

          {error && (
            <div className="mb-4 bg-red-50 border border-red-200 rounded-md p-4">
              <p className="text-sm text-red-700">{error}</p>
            </div>
          )}

          {step === 'listing' ? (
            <ListingSelection
              listings={filteredListings}
              searchQuery={searchQuery}
              onSearchChange={setSearchQuery}
              onListingSelect={handleListingSelect}
              loading={loading}
            />
          ) : (
            <MessageComposition
              listing={selectedListing!}
              messageText={messageText}
              onMessageChange={setMessageText}
              onTemplateSelect={handleTemplateSelect}
              onSend={handleSendMessage}
              onBack={() => setStep('listing')}
              sending={sending}
            />
          )}
        </div>
      </div>
    </div>
  );
}

interface ListingSelectionProps {
  listings: ListingWithSeller[];
  searchQuery: string;
  onSearchChange: (query: string) => void;
  onListingSelect: (listing: ListingWithSeller) => void;
  loading: boolean;
}

function ListingSelection({ listings, searchQuery, onSearchChange, onListingSelect, loading }: ListingSelectionProps) {
  return (
    <div>
      {/* Search */}
      <div className="mb-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
          <input
            type="text"
            placeholder="Search listings..."
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
          />
        </div>
      </div>

      {/* Listings */}
      <div className="max-h-96 overflow-y-auto">
        {loading ? (
          <div className="text-center py-8">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
          </div>
        ) : listings.length === 0 ? (
          <div className="text-center py-8">
            <Car className="mx-auto h-12 w-12 text-gray-400 mb-4" />
            <p className="text-gray-600">No listings found</p>
          </div>
        ) : (
          <div className="space-y-2">
            {listings.map((listing) => (
              <ListingItem
                key={listing.id}
                listing={listing}
                onClick={() => onListingSelect(listing)}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
}

interface ListingItemProps {
  listing: ListingWithSeller;
  onClick: () => void;
}

function ListingItem({ listing, onClick }: ListingItemProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div
      onClick={onClick}
      className="p-3 border border-gray-200 rounded-lg hover:border-blue-300 hover:bg-blue-50 cursor-pointer transition-colors"
    >
      <div className="flex items-center justify-between">
        <div className="flex-1">
          <h4 className="text-sm font-medium text-gray-900">
            {listing.year} {listing.make} {listing.model}
          </h4>
          <p className="text-sm text-gray-600 mt-1">{listing.title}</p>
          <div className="flex items-center mt-2 text-sm text-gray-500">
            <User className="h-4 w-4 mr-1" />
            <span>{listing.seller?.display_name || 'Unknown Seller'}</span>
          </div>
        </div>
        <div className="text-right">
          <p className="text-lg font-semibold text-gray-900">
            {formatPrice(listing.price)}
          </p>
        </div>
      </div>
    </div>
  );
}

interface MessageCompositionProps {
  listing: ListingWithSeller;
  messageText: string;
  onMessageChange: (text: string) => void;
  onTemplateSelect: (template: MessageTemplate) => void;
  onSend: () => void;
  onBack: () => void;
  sending: boolean;
}

function MessageComposition({ 
  listing, 
  messageText, 
  onMessageChange, 
  onTemplateSelect, 
  onSend, 
  onBack, 
  sending 
}: MessageCompositionProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(price);
  };

  return (
    <div>
      {/* Selected Listing */}
      <div className="mb-6 p-4 bg-gray-50 rounded-lg">
        <div className="flex items-center justify-between">
          <div>
            <h4 className="text-sm font-medium text-gray-900">
              {listing.year} {listing.make} {listing.model}
            </h4>
            <p className="text-sm text-gray-600">{listing.title}</p>
            <div className="flex items-center mt-2 text-sm text-gray-500">
              <User className="h-4 w-4 mr-1" />
              <span>To: {listing.seller?.display_name || 'Unknown Seller'}</span>
            </div>
          </div>
          <div className="text-right">
            <p className="text-lg font-semibold text-gray-900">
              {formatPrice(listing.price)}
            </p>
            <button
              onClick={onBack}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Change listing
            </button>
          </div>
        </div>
      </div>

      {/* Message Templates */}
      <div className="mb-4">
        <p className="text-sm font-medium text-gray-700 mb-2">Quick templates:</p>
        <div className="flex flex-wrap gap-2">
          {DEFAULT_MESSAGE_TEMPLATES.map((template) => (
            <button
              key={template.id}
              onClick={() => onTemplateSelect(template)}
              className="px-3 py-1 text-xs border border-gray-300 rounded-full hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {template.title}
            </button>
          ))}
        </div>
      </div>

      {/* Message Input */}
      <div className="mb-6">
        <label className="block text-sm font-medium text-gray-700 mb-2">
          Message
        </label>
        <textarea
          value={messageText}
          onChange={(e) => onMessageChange(e.target.value)}
          placeholder="Type your message..."
          rows={4}
          className="block w-full border border-gray-300 rounded-md px-3 py-2 text-sm focus:ring-blue-500 focus:border-blue-500"
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end space-x-3">
        <button
          onClick={onBack}
          className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Back
        </button>
        <button
          onClick={onSend}
          disabled={!messageText.trim() || sending}
          className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md shadow-sm text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <Send className="h-4 w-4 mr-2" />
          {sending ? 'Sending...' : 'Send Message'}
        </button>
      </div>
    </div>
  );
} 