import React, { useEffect, useState } from 'react';
import { apiClient } from './lib/apiClient';

const ApiTest: React.FC = () => {
  const [apiStatus, setApiStatus] = useState<'testing' | 'connected' | 'failed'>('testing');
  const [apiData, setApiData] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testApiConnection = async () => {
      try {
        console.log('Testing API connection to Laravel backend...');
        const response = await apiClient.get('/api/test');
        console.log('API Response:', response);
        
        setApiStatus('connected');
        setApiData(response);
      } catch (err: any) {
        console.error('API Connection failed:', err);
        setApiStatus('failed');
        setError(err.message || 'Connection failed');
      }
    };

    testApiConnection();
  }, []);

  return (
    <div style={{ 
      minHeight: '100vh', 
      backgroundColor: '#0d1117', 
      color: 'white', 
      padding: '40px',
      fontFamily: 'Inter, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <h1 style={{ fontSize: '48px', fontWeight: 'bold', marginBottom: '20px', color: '#D4AF37' }}>
          DrealtiesFX Academy
        </h1>
        <h2 style={{ fontSize: '24px', marginBottom: '30px' }}>
          API Connection Test
        </h2>
        
        <div style={{ 
          padding: '20px', 
          backgroundColor: '#161b22', 
          borderRadius: '12px', 
          border: '1px solid #30363d',
          marginBottom: '20px'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Connection Status:</h3>
          <div style={{ 
            padding: '10px 15px', 
            borderRadius: '8px',
            backgroundColor: apiStatus === 'connected' ? '#0d4f3c' : 
                           apiStatus === 'failed' ? '#4c1d1d' : '#1f2937',
            color: apiStatus === 'connected' ? '#4ade80' : 
                   apiStatus === 'failed' ? '#f87171' : '#fbbf24'
          }}>
            {apiStatus === 'testing' && '🔄 Testing connection...'}
            {apiStatus === 'connected' && '✅ Connected to Laravel Backend'}
            {apiStatus === 'failed' && '❌ Connection Failed'}
          </div>
        </div>

        {apiStatus === 'connected' && apiData && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#161b22', 
            borderRadius: '12px', 
            border: '1px solid #30363d',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px' }}>API Response:</h3>
            <pre style={{ 
              backgroundColor: '#0d1117', 
              padding: '15px', 
              borderRadius: '8px',
              overflow: 'auto',
              fontSize: '14px',
              color: '#e6edf3'
            }}>
              {JSON.stringify(apiData, null, 2)}
            </pre>
          </div>
        )}

        {apiStatus === 'failed' && error && (
          <div style={{ 
            padding: '20px', 
            backgroundColor: '#161b22', 
            borderRadius: '12px', 
            border: '1px solid #30363d',
            marginBottom: '20px'
          }}>
            <h3 style={{ marginBottom: '15px', color: '#f87171' }}>Error Details:</h3>
            <p style={{ color: '#fca5a5' }}>{error}</p>
          </div>
        )}

        <div style={{ 
          padding: '20px', 
          backgroundColor: '#161b22', 
          borderRadius: '12px', 
          border: '1px solid #30363d'
        }}>
          <h3 style={{ marginBottom: '15px' }}>Expected Endpoints:</h3>
          <ul style={{ listStyle: 'none', padding: 0 }}>
            <li style={{ padding: '5px 0' }}>• GET /api/test - API status check</li>
            <li style={{ padding: '5px 0' }}>• GET /api/test/courses - Course data</li>
            <li style={{ padding: '5px 0' }}>• GET /api/test/users - User data</li>
            <li style={{ padding: '5px 0' }}>• POST /api/auth/register - User registration</li>
            <li style={{ padding: '5px 0' }}>• POST /api/auth/login - User authentication</li>
          </ul>
        </div>
      </div>
    </div>
  );
};

export default ApiTest;