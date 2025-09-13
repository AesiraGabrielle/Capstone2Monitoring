import React, { useEffect, useState } from 'react';
import { wasteLevelAPI } from '../services/api';

const BinsPage = () => {
  const [levels, setLevels] = useState(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let isMounted = true;
    wasteLevelAPI
      .getLatestLevels()
      .then((res) => {
        if (!isMounted) return;
        setLevels(res.data);
      })
      .catch((err) => {
        if (!isMounted) return;
        setError(err?.response?.data?.message || 'Failed to load bins');
      })
      .finally(() => isMounted && setLoading(false));
    return () => {
      isMounted = false;
    };
  }, []);

  const bins = [
    { id: 1, key: 'bio', type: 'Biodegradable', color: '#f0e68c' },
    { id: 2, key: 'non_bio', type: 'Non-Biodegradable', color: '#add8e6' },
    { id: 3, key: 'unclassified', type: 'Unidentified Waste', color: '#90EE90' },
  ];

  return (
    <div className="bins-page">
      <h2 className="page-title mb-5">Bins</h2>
      {loading && <div>Loading bins...</div>}
      {error && <div className="alert alert-danger">{error}</div>}
      
  <div className="row justify-content-center gx-3 gy-4">
        {bins.map((bin) => {
          const level = levels?.[bin.key];
          const displayLevel = typeof level === 'number' ? Math.round(level) : null;
          const isCovered = (displayLevel ?? 0) >= 50; // if filler likely behind text
          const textStyle = displayLevel === null
            ? {}
            : isCovered
              ? { color: '#000', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }
              : { color: bin.color, textShadow: '0 1px 1px rgba(0,0,0,0.15)' };
          return (
          <div key={bin.id} className="col-12 col-sm-10 col-md-4 text-center mb-4">
            <div className="bin-container">
              {/* Bin graphic */}
              <div className="bin-graphic">
                {/* Lid/handle outline */}
                <div className="bin-lid"></div>
                {/* Thin rim line across the top opening */}
                <div className="bin-rim"></div>
                <div className="bin-body">
                  <div className="bin-level-text" style={textStyle}>
                    {displayLevel !== null ? `${displayLevel}%` : 'No data'}
                  </div>
                  <div 
                    className="bin-level" 
                    style={{ 
                      height: `${displayLevel ?? 0}%`,
                      backgroundColor: bin.color,
                    }}
                  ></div>
                </div>
              </div>
              <div className="bin-label mt-3">
                {bin.type}
              </div>
            </div>
          </div>
          );
        })}
      </div>
      
      {/* Add footer */}
      <div className="footer white">
        © 2025 Leyte Normal University, All rights reserved.
      </div>
    </div>
  );
};

export default BinsPage;