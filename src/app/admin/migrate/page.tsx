'use client';

import { useState } from 'react';

export default function MigratePage() {
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<string>('');
  const [error, setError] = useState<string>('');

  const runMigration = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('Starting migration check...');
      
      const response = await fetch('/api/admin/migrate', {
        method: 'PATCH',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          migration: 'fulltext-search'
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.error || 'Migration check failed');
      }

      // Format the result nicely
      let formattedResult = `Migration Check Results:\n\n`;
      
      data.results?.forEach((result: any, index: number) => {
        formattedResult += `Step ${result.step}: ${result.message}\n`;
        formattedResult += `Status: ${result.status}\n`;
        if (result.error) {
          formattedResult += `Error: ${result.error}\n`;
        }
        formattedResult += '\n';
      });

      if (data.needsManualSetup) {
        formattedResult += `\n⚠️  MANUAL SETUP REQUIRED ⚠️\n\n`;
        formattedResult += `${data.manualInstructions.message}\n\n`;
        formattedResult += `SQL Commands to run in Supabase SQL Editor:\n`;
        formattedResult += `=====================================\n\n`;
        
        data.manualInstructions.commands?.forEach((command: string, index: number) => {
          formattedResult += `-- Command ${index + 1}:\n${command}\n\n`;
        });
      } else {
        formattedResult += `✅ Full-text search is ready to use!\n`;
      }

      setResult(formattedResult);
      console.log('Migration check completed:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      setError(errorMessage);
      console.error('Migration error:', err);
    } finally {
      setLoading(false);
    }
  };

  const testSearch = async () => {
    setLoading(true);
    setError('');
    setResult('');

    try {
      console.log('Testing search functionality...');
      
      const response = await fetch('/api/search?q=honda&limit=5');
      const data = await response.json();

      let formattedResult = `Search Test Results:\n\n`;

      if (!response.ok) {
        formattedResult += `❌ Search API Error: ${data.error || 'Unknown error'}\n`;
        if (data.details) {
          formattedResult += `Details: ${data.details}\n`;
        }
        formattedResult += `\nThis likely means the full-text search database setup is not complete.\n`;
        formattedResult += `Please run the "Check Setup" first to get setup instructions.\n`;
      } else {
        formattedResult += `✅ Search API is working!\n\n`;
        formattedResult += `Query: "honda"\n`;
        formattedResult += `Results found: ${data.listings?.length || 0}\n`;
        formattedResult += `Total items: ${data.pagination?.totalItems || 0}\n`;
        formattedResult += `Current page: ${data.pagination?.page || 1}\n`;
        formattedResult += `Total pages: ${data.pagination?.totalPages || 0}\n\n`;
        
        if (data.listings && data.listings.length > 0) {
          formattedResult += `Sample Results:\n`;
          formattedResult += `================\n`;
          data.listings.slice(0, 3).forEach((listing: any, index: number) => {
            formattedResult += `${index + 1}. ${listing.title || 'Untitled'}\n`;
            formattedResult += `   Make: ${listing.make || 'Unknown'}\n`;
            formattedResult += `   Model: ${listing.model || 'Unknown'}\n`;
            formattedResult += `   Year: ${listing.year || 'Unknown'}\n`;
            formattedResult += `   Price: $${listing.price || 'N/A'}\n\n`;
          });
        } else {
          formattedResult += `No listings found for "honda" - this could mean:\n`;
          formattedResult += `- No Honda cars in the database\n`;
          formattedResult += `- Search indexing hasn't been set up\n`;
          formattedResult += `- There are no active listings\n`;
        }
      }

      setResult(formattedResult);
      console.log('Search test completed:', data);
    } catch (err) {
      const errorMessage = err instanceof Error ? err.message : 'Unknown error';
      let formattedError = `❌ Search Test Failed\n\n`;
      formattedError += `Error: ${errorMessage}\n\n`;
      formattedError += `This could indicate:\n`;
      formattedError += `- Network connectivity issues\n`;
      formattedError += `- API endpoint not available\n`;
      formattedError += `- Authentication problems\n`;
      formattedError += `- Database connection issues\n`;
      
      setError(formattedError);
      console.error('Search test error:', err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="container mx-auto px-4">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-3xl font-bold text-gray-900 mb-8">
            Database Migration & Search Testing
          </h1>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            {/* Migration Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Check Full-Text Search Setup
              </h2>
              <p className="text-gray-600 mb-4">
                This will check if the search_vector column and full-text search functionality are available. 
                If not, it will provide SQL commands to run manually in Supabase.
              </p>
              <button
                onClick={runMigration}
                disabled={loading}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Checking Setup...' : 'Check Setup'}
              </button>
            </div>

            {/* Search Test Section */}
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h2 className="text-xl font-semibold text-gray-900 mb-4">
                Test Search Functionality
              </h2>
              <p className="text-gray-600 mb-4">
                Test the search API with a sample query ("honda") to verify that full-text search is working correctly.
                Run this after completing the database setup from the check above.
              </p>
              <button
                onClick={testSearch}
                disabled={loading}
                className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
              >
                {loading ? 'Testing...' : 'Test Search'}
              </button>
            </div>
          </div>

          {/* Results/Error Display */}
          {(result || error) && (
            <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">
                {error ? 'Error' : 'Result'}
              </h3>
              {error && (
                <div className="bg-red-50 border border-red-200 rounded-lg p-4 mb-4">
                  <div className="text-red-800">{error}</div>
                </div>
              )}
              {result && (
                <pre className="bg-gray-50 border border-gray-200 rounded-lg p-4 overflow-auto text-sm">
                  {result}
                </pre>
              )}
            </div>
          )}

          {/* Information Section */}
          <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6 mt-6">
            <h3 className="text-lg font-semibold text-gray-900 mb-4">
              Migration Information
            </h3>
            <div className="space-y-3 text-sm text-gray-600">
              <p>
                <strong>What the migration does:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Adds search_vector tsvector column to listings table</li>
                <li>Creates PostgreSQL function to update search vectors</li>
                <li>Sets up triggers for automatic search vector updates</li>
                <li>Creates GIN index for optimal search performance</li>
                <li>Includes modifications data in search vectors</li>
                <li>Updates existing listings with search vectors</li>
              </ul>
              <p className="mt-4">
                <strong>Search capabilities:</strong>
              </p>
              <ul className="list-disc list-inside space-y-1 ml-4">
                <li>Full-text search across title, make, model, description</li>
                <li>Engine, transmission, condition, and location fields</li>
                <li>Modification names, descriptions, and categories</li>
                <li>Relevance-based ranking</li>
                <li>Combined with traditional filters</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
} 