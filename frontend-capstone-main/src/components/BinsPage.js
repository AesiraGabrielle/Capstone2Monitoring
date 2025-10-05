import React, { useState, useEffect } from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const severityColor = (alert) => {
  if (alert.toLowerCase().includes('locked')) return 'darkred';
  if (alert.toLowerCase().includes('critical')) return 'red';
  if (alert.toLowerCase().includes('warning')) return 'orange';
  return 'goldenrod'; // Notice
};

const BinsPage = () => {
  const { levels, loading, error } = useDashboardData() || {};
  const [readAlerts, setReadAlerts] = useState({});

  useEffect(() => {
    // Initialize read state for new alerts
    const newRead = {};
    ['bio', 'non_bio', 'unclassified'].forEach((bin) => {
      newRead[bin] = Array((levels?.[bin]?.alerts?.length) || 0).fill(false);
    });
    setReadAlerts(newRead);
  }, [levels]);

  const markAsRead = (binKey, idx) => {
    setReadAlerts((prev) => ({
      ...prev,
      [binKey]: prev[binKey].map((r, i) => (i === idx ? true : r)),
    }));
  };

  const bins = [
    { id: 1, key: 'bio', type: 'Biodegradable', color: '#f0e68c' },
    { id: 2, key: 'non_bio', type: 'Non-Biodegradable', color: '#add8e6' },
    { id: 3, key: 'unclassified', type: 'Unidentified Waste', color: '#90EE90' },
  ];

  return (
    <div className="bins-page">
      <div className="container bins-container-centered">
        <h2 className="page-title mb-3">Bins</h2>
        <div className="outer-bins-card">
          {loading && <div>Loading bins...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          <div className="row justify-content-center gx-3 gy-4">
            {bins.map((bin) => {
              const level = levels?.[bin.key]?.level_percentage;
              const displayLevel = typeof level === 'number' ? Math.round(level) : null;
              const isCovered = (displayLevel ?? 0) >= 50;
              const textStyle = displayLevel === null
                ? {}
                : isCovered
                  ? { color: '#000', textShadow: '0 1px 2px rgba(255,255,255,0.6)' }
                  : { color: bin.color, textShadow: '0 1px 1px rgba(0,0,0,0.15)' };

              return (
                <div key={bin.id} className="col-12 col-sm-10 col-md-4 text-center mb-4">
                  <div className="bin-container">
                    <div className="bin-graphic">
                      <div className="bin-lid"></div>
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
                    <div className="bin-label mt-3">{bin.type}</div>

                    {/* Alerts per bin */}
                    {levels?.[bin.key]?.alerts?.length > 0 && (
                      <div className="mt-2">
                        {levels[bin.key].alerts.map((alert, idx) => (
                          <div
                            key={bin.key + idx}
                            className="alert"
                            style={{
                              backgroundColor: readAlerts[bin.key]?.[idx]
                                ? '#e0e0e0'
                                : severityColor(alert),
                              color: readAlerts[bin.key]?.[idx] ? '#555' : '#000',
                              cursor: 'pointer',
                            }}
                            onClick={() => markAsRead(bin.key, idx)}
                            title="Click to mark as read"
                          >
                            {alert} {readAlerts[bin.key]?.[idx] ? '(Read)' : ''}
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Footer */}
        <div className="footer white">
          © 2025 Leyte Normal University, All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default BinsPage;
