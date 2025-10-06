import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initialAPI, monitoringAPI } from '../services/api';
import axios from 'axios'; // add axios if not already

const DashboardDataContext = createContext(null);
export const useDashboardData = () => useContext(DashboardDataContext);

export const DashboardDataProvider = ({ children }) => {
  const [levels, setLevels] = useState(null);
  const [warnings, setWarnings] = useState([]);
  const [daily, setDaily] = useState([]);
  const [rangeTotals, setRangeTotals] = useState({ bio:0, non_bio:0, unclassified:0 });
  const [allTotals, setAllTotals] = useState({ bio:0, non_bio:0, unclassified:0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [lastUpdated, setLastUpdated] = useState(null);

  const computeRangeTotals = (arr) => arr.reduce((acc, d) => {
    acc.bio += Number(d.bio ?? 0) || 0;
    acc.non_bio += Number(d.non_bio ?? 0) || 0;
    acc.unclassified += Number(d.unclassified ?? 0) || 0;
    return acc;
  }, { bio:0, non_bio:0, unclassified:0 });

  // 🔹 Fetch latest bin levels from backend
  const loadLevels = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await axios.get('/api/waste-levels/latest', {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('jwt_token')}`, // JWT auth
        },
      });
      // The response is already keyed by bin: bio, non_bio, unclassified
      setLevels(res.data);
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load waste levels');
    } finally {
      setLoading(false);
    }
  }, []);

  // 🔹 Load both initial data and levels
  const load = useCallback(async () => {
    setLoading(true);
    setError('');
    try {
      const res = await initialAPI.getInitialData();
      const data = res.data || {};
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      const mon = data.monitoring || {};
      const dailyArr = Array.isArray(mon.daily) ? mon.daily : [];
      setDaily(dailyArr);
      setRangeTotals(mon.rangeTotals || computeRangeTotals(dailyArr));
      setAllTotals(mon.allTotals || { bio:0, non_bio:0, unclassified:0 });
      setLastUpdated(Date.now());

      // 🔹 Fetch latest bin levels separately
      await loadLevels();
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, [loadLevels]);

  useEffect(() => {
    load();
    const interval = setInterval(loadLevels, 10000); // auto-refresh bin levels every 10s
    return () => clearInterval(interval);
  }, [load, loadLevels]);

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
