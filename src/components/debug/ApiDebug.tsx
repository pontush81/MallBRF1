import React, { useState, useEffect } from 'react';
import pageService from '../../services/pageService';

const ApiDebug: React.FC = () => {
  const [debugInfo, setDebugInfo] = useState<any>(null);
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const testDebug = async () => {
      try {
        setLoading(true);
        const result = await pageService.testDebugEndpoint();
        setDebugInfo(result);
        setError(null);
      } catch (err) {
        console.error('Debug test error:', err);
        setError(err instanceof Error ? err.message : 'Unknown error');
      } finally {
        setLoading(false);
      }
    };

    testDebug();
  }, []);

  return (
    <div style={{ padding: '20px', maxWidth: '800px', margin: '0 auto' }}>
      <h1>API Debug Info</h1>
      
      {loading && <p>Loading API debug information...</p>}
      
      {error && (
        <div style={{ background: '#ffeeee', padding: '10px', border: '1px solid #ff0000', borderRadius: '4px', marginBottom: '20px' }}>
          <h3>Error:</h3>
          <p>{error}</p>
        </div>
      )}
      
      {debugInfo && (
        <div>
          <h2>Debug Response:</h2>
          <pre style={{ 
            background: '#f5f5f5', 
            padding: '15px', 
            borderRadius: '4px',
            overflow: 'auto',
            maxHeight: '500px'
          }}>
            {JSON.stringify(debugInfo, null, 2)}
          </pre>
        </div>
      )}

      <div style={{ marginTop: '30px' }}>
        <h2>Client Information:</h2>
        <pre style={{ 
          background: '#f5f5f5', 
          padding: '15px', 
          borderRadius: '4px' 
        }}>
          {JSON.stringify({
            location: window.location.href,
            origin: window.location.origin,
            hostname: window.location.hostname,
            environment: process.env.NODE_ENV
          }, null, 2)}
        </pre>
      </div>
    </div>
  );
};

export default ApiDebug; 