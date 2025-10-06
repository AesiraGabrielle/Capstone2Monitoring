import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wasteLevelAPI, monitoringAPI } from '../services/api';

const DashboardDataContext = createContext(null);

export const useDashboardData = () => useContext(DashboardDataContext);

export const DashboardDataProvider = ({ children }) => {
  const [levels, setLevels] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [daily, setDaily] = useState([]);
  const [rangeTotals, setRangeTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 });
  const [allTotals, setAllTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const computeRangeTotals = (arr) =>
    arr.reduce(
      (acc, d) => {
        acc.bio += Number(d.bio ?? 0) || 0;
        acc.non_bio += Number(d.non_bio ?? 0) || 0;
        acc.unclassified += Number(d.unclassified ?? 0) || 0;
        return acc;
      },
      { bio: 0, non_bio: 0, unclassified: 0 }
    );

  // 🔹 Load waste levels + optional monitoring data
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await wasteLevelAPI.getLatestLevels();
      const data = res.data || {};

      // ✅ Direct mapping from backend response
      setLevels(data || null);

      // Extract alerts from each bin
      const allAlerts = Object.values(data)
        .flatMap((bin) => (bin.alerts ? bin.alerts : []))
        .filter(Boolean);

      setWarnings(allAlerts);
      setDaily([]);
      setRangeTotals({ bio: 0, non_bio: 0, unclassified: 0 });
      setAllTotals({ bio: 0, non_bio: 0, unclassified: 0 });
      setLastUpdated(Date.now());
    } catch (e) {
      console.error('Load error:', e);
      setError(e?.response?.data?.message || 'Failed to load waste level data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  // 🔹 Date range refetch for monitoring consumers (charts)
  const fetchRange = async (start, end) => {
    try {
      const params = {};
      if (start) params.start = start;
      if (end) params.end = end;
      const res = await monitoringAPI.getDailyBreakdown(params);
      const arr = Array.isArray(res.data) ? res.data : [];
      setDaily(arr);
      setRangeTotals(computeRangeTotals(arr));
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load range');
    }
  };

  const value = {
    levels,
    warnings,
    daily,
    rangeTotals,
    allTotals,
    loading,
    error,
    lastUpdated,
    refresh: load,
    fetchRange,
  };

  return (
    <DashboardDataContext.Provider value={value}>
      {children}
    </DashboardDataContext.Provider>
  );
};
