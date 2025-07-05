'use client';

import { useState, useEffect } from 'react';
import { useFavorites } from '@/hooks/useFavorites';
import { useAuth } from '@/lib/auth';

export default function DebugFavoritesPage() {
  const { user } = useAuth();
  const { favorites, loading, error, refreshFavorites, syncStatus } = useFavorites();
  const [testResults, setTestResults] = useState<any>(null);
  const [apiTest, setApiTest] = useState<any>(null);

  const runTest = async () => {
    try {
      const response = await fetch('/api/test/favorites');
      const data = await response.json();
      setTestResults(data);
    } catch (err) {
      setTestResults({ error: 'Failed to run test', details: err });
    }
  };

  const testApiDirectly = async () => {
    try {
      const response = await fetch('/api/favorites');
      const data = await response.json();
      setApiTest({ status: response.status, data });
    } catch (err) {
      setApiTest({ error: 'Failed to call API', details: err });
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Favorites Debug Page</h1>
      
      {/* Auth Status */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Authentication Status</h2>
        <p>User: {user ? user.email : 'Not logged in'}</p>
        <p>User ID: {user?.id || 'N/A'}</p>
      </div>

      {/* useFavorites Hook Status */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">useFavorites Hook Status</h2>
        <p>Loading: {loading ? 'Yes' : 'No'}</p>
        <p>Error: {error || 'None'}</p>
        <p>Favorites Count: {favorites.length}</p>
        <p>Sync Status: {syncStatus}</p>
        <button 
          onClick={refreshFavorites}
          className="mt-2 px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
        >
          Refresh Favorites
        </button>
      </div>

      {/* Favorites Data */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Favorites Data</h2>
        <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
          {JSON.stringify(favorites, null, 2)}
        </pre>
      </div>

      {/* Test Controls */}
      <div className="mb-6 p-4 border rounded">
        <h2 className="text-lg font-semibold mb-2">Test Controls</h2>
        <div className="space-x-2">
          <button 
            onClick={runTest}
            className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
          >
            Run Debug Test
          </button>
          <button 
            onClick={testApiDirectly}
            className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600"
          >
            Test API Directly
          </button>
        </div>
      </div>

      {/* Test Results */}
      {testResults && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Debug Test Results</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(testResults, null, 2)}
          </pre>
        </div>
      )}

      {/* API Test Results */}
      {apiTest && (
        <div className="mb-6 p-4 border rounded">
          <h2 className="text-lg font-semibold mb-2">Direct API Test Results</h2>
          <pre className="bg-gray-100 p-2 rounded text-sm overflow-x-auto">
            {JSON.stringify(apiTest, null, 2)}
          </pre>
        </div>
      )}
    </div>
  );
} 