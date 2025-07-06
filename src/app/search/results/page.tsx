'use client';

import { Suspense } from 'react';
import LoadingSpinner from '@/components/LoadingSpinner';
import SearchResultsPageContent from './SearchResultsPageContent';

export default function SearchResultsPage() {
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
      <SearchResultsPageContent />
    </Suspense>
  );
} 