import React, { useEffect, useState } from 'react';
import { wasteLevelAPI } from '../services/api';

function TestConnection() {
    const [levels, setLevels] = useState(null);
    const [error, setError] = useState(null);

    useEffect(() => {
        console.log('TestConnection component mounted');
        wasteLevelAPI.getLatestLevels()
            .then(response => {
                console.log('API Response:', response);
                setLevels(response.data);
            })
            .catch(err => {
                console.error('API Error:', err);
                setError(err.message || 'An error occurred');
            });
    }, []);

    return (
        <div>
            <h2>Connection Test</h2>
            {error && (
                <div style={{ color: 'red' }}>
                    Error: {error}
                </div>
            )}
            {!error && !levels && (
                <div>Loading waste levels...</div>
            )}
            {levels && (
                <div>
                    <h3>Waste Levels:</h3>
                    <pre style={{ background: '#f5f5f5', padding: '10px' }}>
                        {JSON.stringify(levels, null, 2)}
                    </pre>
                </div>
            )}
        </div>
    );
}

export default TestConnection;