import React, { createContext, useContext, useEffect, useState, useCallback } from 'react';
import { wasteLevelAPI, monitoringAPI } from '../services/api';

const DashboardDataContext = createContext(null);

export const useDashboardData = () => useContext(DashboardDataContext);

export const DashboardDataProvider = ({ children }) => {
  const [levels, setLevels] = useState(null);
  // warnings: array of alert objects { id, binType, message, severity, createdAt, read }
  const [warnings, setWarnings] = useState([]);
  const [readIds, setReadIds] = useState(() => {
    try {
      const raw = localStorage.getItem('waste_alert_read_ids');
      return raw ? JSON.parse(raw) : [];
    } catch {
      return [];
    }
  });
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

      // Extract & normalize alerts from each bin
      // Expecting backend shape: { bio: { level_percentage, alerts: ["Warning: ..."] }, ... }
      const now = Date.now();
      const allAlerts = Object.entries(data)
        .flatMap(([binType, bin]) => {
          if (!bin || !Array.isArray(bin.alerts)) return [];
            return bin.alerts.filter(Boolean).map((msg) => {
              // Remove unwanted prefixes
              let mainMsg = msg
                .replace(/^(Info: (Classified|Unclassified|Biodegradable|Non Biodegradable),?\s*)/i, '')
                .replace(/^(Biodegradable:?\s*|Non Biodegradable:?\s*)/i, '')
                .replace(/^(Notice|Warning|Critical|Full):\s*/i, '');
              const severityMatch = msg.match(/(Notice|Warning|Critical|Full)/i);
              const severity = severityMatch ? severityMatch[1].toLowerCase() : 'info';
              const id = `${binType}_${severity}_${mainMsg.replace(/\s+/g,'_').toLowerCase()}`.slice(0,160);
              return {
                id,
                binType,
                message: mainMsg.trim(),
                severity,
                createdAt: now,
                read: false,
              };
            });
        });

      // Merge with existing to preserve read flags
      setWarnings((prev) => {
        const prevMap = Object.fromEntries(prev.map(a => [a.id, a]));
        const merged = allAlerts.map(a => ({ ...a, read: prevMap[a.id]?.read || readIds.includes(a.id) }));
        return merged;
      });
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

  // Persist read ids
  useEffect(() => {
    try {
      localStorage.setItem('waste_alert_read_ids', JSON.stringify(readIds));
    } catch {}
  }, [readIds]);

  const markAlertRead = (id) => {
    setWarnings((prev) => prev.filter(a => a.id !== id));
    setReadIds((prev) => prev.includes(id) ? prev : [...prev, id]);
  };

  // dismissAlert is now an alias for markAlertRead
  const dismissAlert = markAlertRead;

  const markAllRead = () => {
    const ids = warnings.map(w => w.id);
    setWarnings((prev) => prev.map(a => ({ ...a, read: true })));
    setReadIds((prev) => Array.from(new Set([...prev, ...ids])));
  };

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
  // unreadWarnings derived for convenience
  warnings,
  unreadWarnings: warnings.filter(w => !w.read),
  markAlertRead,
  dismissAlert,
  markAllRead,
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
