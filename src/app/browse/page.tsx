'use client';

import { useState, useEffect, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { createClientComponentClient } from '@supabase/auth-helpers-nextjs';
import ListingCard from '@/components/ListingCard';
import FilterSidebar from '@/components/FilterSidebar';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchInput from '@/components/SearchInput';
import SearchResultsHeader from '@/components/SearchResultsHeader';
import FilterBreadcrumbs from '@/components/FilterBreadcrumbs';
import AdvancedPagination from '@/components/AdvancedPagination';
import NoResults from '@/components/NoResults';
import AppLayout from '@/components/AppLayout';
import { MaterialYouIcon } from '@/components/ui/MaterialYouIcon';
import BrowsePageContent from './BrowsePageContent';

interface Listing {
  id: string;
  title: string;
  make: string;
  model: string;
  year: number;
  price: number;
  location: string;
  description: string;
  engine: string;
  transmission: string;
  mileage: number;
  condition: string;
  created_at: string;
  listing_images: {
    image_url: string;
    is_primary: boolean;
  }[];
  modifications?: {
    name: string;
    description: string;
    category: string;
    created_at: string;
  }[];
}

interface Filters {
  query: string;
  make: string;
  model: string;
  yearFrom: number;
  yearTo: number;
  priceFrom: number;
  priceTo: number;
  sortBy: string;
  modificationCategories: string[];
  specificModifications: string[];
  modDateFrom: string;
  modDateTo: string;
  hasModifications: boolean;
}

const DEFAULT_FILTERS: Filters = {
  query: '',
  make: '',
  model: '',
  yearFrom: 0,
  yearTo: 0,
  priceFrom: 0,
  priceTo: 0,
  sortBy: 'created_at',
  modificationCategories: [],
  specificModifications: [],
  modDateFrom: '',
  modDateTo: '',
  hasModifications: false
};

const ITEMS_PER_PAGE_OPTIONS = [12, 24, 48, 96];

export default function BrowsePage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-md-sys-surface">
        <div className="container mx-auto px-4 py-8">
          <div className="flex justify-center items-center py-20">
            <LoadingSpinner />
          </div>
        </div>
      </div>
    }>
      <BrowsePageContent />
    </Suspense>
  );
} 