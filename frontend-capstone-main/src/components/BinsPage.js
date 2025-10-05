import React from 'react';
import { useDashboardData } from '../context/DashboardDataContext';

const BinsPage = () => {
  const { levels, loading, error } = useDashboardData() || {};

  const bins = [
    { id: 1, key: 'bio', type: 'Biodegradable', color: '#f0e68c' },
    { id: 2, key: 'non_bio', type: 'Non-Biodegradable', color: '#add8e6' },
    { id: 3, key: 'unclassified', type: 'Unidentified Waste', color: '#90EE90' },
  ];

  // Generate system-wide alerts if any bin is full
  const systemAlerts = [];
  if (levels) {
    bins.forEach(bin => {
      const lvlObj = levels[bin.key];
      if (lvlObj && lvlObj.level_percentage >= 98) {
        systemAlerts.push("System locked! One or more bins are full.");
      }
    });
  }

  return (
    <div className="bins-page">
      <div className="container bins-container-centered">
        <h2 className="page-title mb-3">Bins</h2>

        <div className="outer-bins-card">
          {loading && <div>Loading bins...</div>}
          {error && <div className="alert alert-danger">{error}</div>}

          {/* Display system-wide alerts */}
          {systemAlerts.length > 0 &&
            systemAlerts.map((alert, idx) => (
              <div key={idx} className="alert alert-danger">
                {alert}
              </div>
            ))
          }

          {/* Display per-bin alerts */}
          {levels &&
            bins.map(bin => {
              const lvlObj = levels[bin.key];
              return lvlObj?.alerts?.map((alert, idx) => (
                <div key={bin.key + idx} className="alert alert-warning">
                  {alert}
                </div>
              ));
            })
          }

          <div className="row justify-content-center gx-3 gy-4">
            {bins.map((bin) => {
              const lvlObj = levels?.[bin.key];
              const displayLevel = lvlObj?.level_percentage ?? null;
              const isCovered = (displayLevel ?? 0) >= 50;
              const textStyle =
                displayLevel === null
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
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        <div className="footer white">
          © 2025 Leyte Normal University, All rights reserved.
        </div>
      </div>
    </div>
  );
};

export default BinsPage;
