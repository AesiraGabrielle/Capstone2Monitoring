import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { initialAPI, monitoringAPI } from '../services/api';

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

  const computeRangeTotals = (arr) => arr.reduce((acc,d)=>{
    acc.bio += Number(d.bio ?? 0) || 0;
    acc.non_bio += Number(d.non_bio ?? 0) || 0;
    acc.unclassified += Number(d.unclassified ?? 0) || 0;
    return acc;
  }, { bio:0, non_bio:0, unclassified:0 });

  const load = useCallback(async () => {
    setLoading(true); setError('');
    try {
      const res = await initialAPI.getInitialData();
      const data = res.data || {};
      setLevels(data.levels || data || null);
      setWarnings(Array.isArray(data.warnings) ? data.warnings : []);
      const mon = data.monitoring || {};
      const dailyArr = Array.isArray(mon.daily) ? mon.daily : [];
      setDaily(dailyArr);
      setRangeTotals(mon.rangeTotals || computeRangeTotals(dailyArr));
      setAllTotals(mon.allTotals || { bio:0, non_bio:0, unclassified:0 });
      setLastUpdated(Date.now());
    } catch (e) {
      setError(e?.response?.data?.message || 'Failed to load initial data');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);

  // Date range refetch for monitoring page consumers
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
