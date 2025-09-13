import React, { useEffect, useMemo, useState } from 'react';
import * as XLSX from 'xlsx';
import { Line } from 'react-chartjs-2';
import biodegradableIcon from '../assets/biodegradable.png';
import nonBiodegradableIcon from '../assets/non-biodegradable.png';
import unidentifiedIcon from '../assets/unidentified.png';
import { 
  Chart as ChartJS, 
  CategoryScale, 
  LinearScale, 
  BarElement,
  LineElement,
  PointElement,
  Title, 
  Tooltip, 
  Legend 
} from 'chart.js';
import DatePicker from 'react-datepicker';
import "react-datepicker/dist/react-datepicker.css";
import { Modal, Button } from 'react-bootstrap';
import { monitoringAPI } from '../services/api';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  LineElement,
  PointElement,
  Title,
  Tooltip,
  Legend
);

const WasteCollection = ({ icon, type, amount }) => (
  <div className="waste-collection-item">
    <img src={icon} alt={type} className="waste-icon" />
    <div className="waste-details">
      <div className="waste-type">{type}</div>
      <div className="waste-amount">{amount}</div>
    </div>
  </div>
);

const MonitoringPage = () => {
  const [dateRange, setDateRange] = useState([null, null]);
  const [startDate, endDate] = dateRange;
  const [showConfirmation, setShowConfirmation] = useState(false);
  const [daily, setDaily] = useState([]);
  const [totals, setTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 }); // range totals
  const [allTotals, setAllTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 }); // overall totals
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialDaily, setInitialDaily] = useState([]); // store initial (auto) dataset for printing when no range chosen
  const [exporting, setExporting] = useState(false);

  const handleDateChange = (update) => {
    setDateRange(update);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "Select Date Range";
  };

  // Fetch daily breakdown for current week initially and overall totals
  useEffect(() => {
    let mounted = true;
    const loadInitial = async () => {
      setLoading(true);
      setError('');
      try {
        const [dailyRes, allTotalsRes] = await Promise.all([
          monitoringAPI.getDailyBreakdown(),
          monitoringAPI.getTotals(),
        ]);
        if (!mounted) return;
        const arr = Array.isArray(dailyRes.data) ? dailyRes.data : [];
  setDaily(arr);
  setInitialDaily(arr); // capture initial load
        // compute totals for the returned period
        const totalsRange = arr.reduce((acc, d) => {
          acc.bio += Number(d.bio ?? 0) || 0;
          acc.non_bio += Number(d.non_bio ?? 0) || 0;
          acc.unclassified += Number(d.unclassified ?? 0) || 0;
          return acc;
        }, { bio: 0, non_bio: 0, unclassified: 0 });
        setTotals(totalsRange);

        const overall = allTotalsRes?.data || { bio: 0, non_bio: 0, unclassified: 0 };
        setAllTotals({
          bio: Number(overall.bio ?? 0) || 0,
          non_bio: Number(overall.non_bio ?? 0) || 0,
          unclassified: Number(overall.unclassified ?? 0) || 0,
        });
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load monitoring data');
      } finally {
        mounted && setLoading(false);
      }
    };
    loadInitial();
    return () => { mounted = false; };
  }, []);

  // Fetch when both start and end are selected
  useEffect(() => {
    if (!startDate || !endDate) return;
    let mounted = true;
    const loadRange = async () => {
      setLoading(true);
      setError('');
      try {
        const params = {
          start: startDate.toISOString().slice(0, 10),
          end: endDate.toISOString().slice(0, 10),
        };
        const dailyRes = await monitoringAPI.getDailyBreakdown(params);
        if (!mounted) return;
        const arr = Array.isArray(dailyRes.data) ? dailyRes.data : [];
        setDaily(arr);
        const totalsRange = arr.reduce((acc, d) => {
          acc.bio += Number(d.bio ?? 0) || 0;
          acc.non_bio += Number(d.non_bio ?? 0) || 0;
          acc.unclassified += Number(d.unclassified ?? 0) || 0;
          return acc;
        }, { bio: 0, non_bio: 0, unclassified: 0 });
        setTotals(totalsRange);
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load monitoring data');
      } finally {
        mounted && setLoading(false);
      }
    };
    loadRange();
    return () => { mounted = false; };
  }, [startDate, endDate]);

  const lineChartData = useMemo(() => {
    if (!daily || daily.length === 0) {
      return {
        labels: ['No data'],
        datasets: [
          { label: 'Biodegradable', data: [0], borderColor: 'rgb(102, 176, 50)', backgroundColor: 'rgb(102, 176, 50)', tension: 0.4, pointRadius: 5 },
          { label: 'Non-Biodegradable', data: [0], borderColor: 'rgb(255, 192, 0)', backgroundColor: 'rgb(255, 192, 0)', tension: 0.4, pointRadius: 5 },
          { label: 'Unidentified Waste', data: [0], borderColor: 'rgb(237, 125, 49)', backgroundColor: 'rgb(237, 125, 49)', tension: 0.4, pointRadius: 5 },
        ],
      };
    }
    return {
      labels: daily.map((d) => d.date),
      datasets: [
        {
          label: 'Biodegradable',
          data: daily.map((d) => Number(d.bio ?? 0) || 0),
          borderColor: 'rgb(102, 176, 50)',
          backgroundColor: 'rgb(102, 176, 50)',
          tension: 0.4,
          pointRadius: 5,
        },
        {
          label: 'Non-Biodegradable',
          data: daily.map((d) => Number(d.non_bio ?? 0) || 0),
          borderColor: 'rgb(255, 192, 0)',
          backgroundColor: 'rgb(255, 192, 0)',
          tension: 0.4,
          pointRadius: 5,
        },
        {
          label: 'Unidentified Waste',
          data: daily.map((d) => Number(d.unclassified ?? 0) || 0),
          borderColor: 'rgb(237, 125, 49)',
          backgroundColor: 'rgb(237, 125, 49)',
          tension: 0.4,
          pointRadius: 5,
        },
      ],
    };
  }, [daily]);

  // Compute a dynamic Y-axis that always shows the maximum data value.
  // If max <= 10, show 0–10 with step 1. If greater, expand and pick a
  // “nice” integer step so ticks remain readable (autoskip handled by maxTicksLimit).
  const maxYValue = useMemo(() => {
    if (!daily || daily.length === 0) return 10;
  const allValues = daily.flatMap(d => [Number(d.bio ?? 0) || 0, Number(d.non_bio ?? 0) || 0, Number(d.unclassified ?? 0) || 0]);
    const maxVal = Math.max(0, ...allValues);
    if (maxVal <= 10) return 10;
    // Round up to a nice number (nearest 5)
    return Math.ceil(maxVal / 5) * 5;
  }, [daily]);

  const stepSize = useMemo(() => {
    if (maxYValue <= 10) return 1;
    const targetTicks = 10; // aim for ~10 ticks max
    const raw = Math.ceil(maxYValue / targetTicks);
    const niceSteps = [1, 2, 5, 10, 20, 25, 50, 100, 200, 250, 500];
    return niceSteps.find(s => s >= raw) || raw;
  }, [maxYValue]);

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    scales: {
      x: {
        ticks: {
          autoSkip: true,
          maxTicksLimit: 8,
        },
      },
      y: {
        beginAtZero: true,
        max: maxYValue,
        ticks: {
          stepSize,
          maxTicksLimit: 11,
          precision: 0,
          callback: (value) => Number.isInteger(value) ? value : '',
        },
      },
    },
    plugins: {
      legend: {
        display: false, // Remove legend from chart since we have it in side panel
      },
    },
  };

  const TotalWasteCard = () => (
    <div className="total-waste-card">
      <h3>Total Waste Collected</h3>
      <div className="waste-item">
        <img src={biodegradableIcon} alt="Biodegradable" />
        <span>Biodegradable:</span>
        <span className="amount">{totals.bio ?? 0}</span>
      </div>
      <div className="waste-item">
        <img src={nonBiodegradableIcon} alt="Non-Biodegradable" />
        <span>Non-Biodegradable:</span>
        <span className="amount">{totals.non_bio ?? 0}</span>
      </div>
      <div className="waste-item">
        <img src={unidentifiedIcon} alt="Unidentified" />
        <span>Unidentified Waste:</span>
        <span className="amount">{totals.unclassified ?? 0}</span>
      </div>
    </div>
  );

  // (CSV export removed as per request)

  const buildWorkbook = () => {
    const source = (startDate && endDate) ? daily : initialDaily;
    if (!source || source.length === 0) return null;
    const now = new Date();
    const timestamp = now.toISOString();
    // Header metadata rows
    const meta = [
      ['Waste Monitoring Report'],
      [(startDate && endDate) ? `Range: ${startDate.toISOString().slice(0,10)} to ${endDate.toISOString().slice(0,10)}` : 'Range: Initial (current week)'],
      [`Generated At: ${timestamp}`],
      [],
    ];
    const header = ['Date', 'Biodegradable', 'Non Biodegradable', 'Unidentified'];
    // Data rows
    const dataRows = source.map(d => [
      d.date,
      Number(d.bio ?? 0),
      Number(d.non_bio ?? 0),
      Number(d.unclassified ?? 0)
    ]);
    // Totals row
    const totalsRow = [
      'TOTAL',
      dataRows.reduce((a,r)=>a + (r[1]||0),0),
      dataRows.reduce((a,r)=>a + (r[2]||0),0),
      dataRows.reduce((a,r)=>a + (r[3]||0),0),
    ];
    const sheetData = [...meta, header, ...dataRows, totalsRow];
    const ws = XLSX.utils.aoa_to_sheet(sheetData);
    // Bold styling via cell comments not directly supported in plain SheetJS free version; minimal formatting
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, 'Monitoring');
    return wb;
  };

  const handleExportXlsx = () => {
    const wb = buildWorkbook();
    if (!wb) {
      alert('No data available to export.');
      return;
    }
    setExporting(true);
    try {
      const filenameBase = (startDate && endDate)
        ? `waste-monitoring_${startDate.toISOString().slice(0,10)}_to_${endDate.toISOString().slice(0,10)}`
        : 'waste-monitoring_initial';
      XLSX.writeFile(wb, `${filenameBase}.xlsx`);
    } finally {
      setExporting(false);
    }
  };

  // Update the Legend component
  const Legend = () => (
    <div className="legend-card">
      <h3>LEGEND</h3>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: 'rgb(102, 176, 50)' }}></div>
        <span>Biodegradable</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: 'rgb(255, 192, 0)' }}></div>
        <span>Non-Biodegradable</span>
      </div>
      <div className="legend-item">
        <div className="legend-color" style={{ backgroundColor: 'rgb(237, 125, 49)' }}></div>
        <span>Unidentified Waste</span>
      </div>
    </div>
  );

  return (
    <div className="monitoring-page">
      <div className="container">
      <h2 className="page-title">Monitoring</h2>
  {loading && <div>Loading monitoring data...</div>}
  {error && <div className="alert alert-danger">{error}</div>}
      
      <div className="monitoring-content">
        <div className="main-section">
          <div className="date-selector">
            <DatePicker
              selectsRange={true}
              startDate={startDate}
              endDate={endDate}
              onChange={handleDateChange}
              isClearable={true}
              showMonthDropdown
              showYearDropdown
              dropdownMode="select"
              placeholderText="Select Date Range"
              className="form-control date-range-picker"
              dateFormat="MMM d, yyyy"
              customInput={
                <input
                  type="text"
                  className="form-control"
                  style={{ backgroundColor: 'white', cursor: 'pointer' }}
                />
              }
            />
          </div>

          <div className="chart-container">
            <Line data={lineChartData} options={chartOptions} />
            {daily.length === 0 && (
              <div className="text-center text-muted mt-2">No data available for the selected period.</div>
            )}
          </div>
          <div className="print-button-container d-flex gap-2">
            <button type="button" onClick={handleExportXlsx} className="print-button" disabled={exporting}>
              {exporting ? 'Exporting...' : 'Download Excel'}
            </button>
          </div>

          <div className="waste-info-container">
            <div className="waste-date">
              Waste Collected: {formatDateRange()}
            </div>
            <div className="waste-stats-card">
              <div className="waste-stat-item">
                <img src={biodegradableIcon} alt="Biodegradable" />
                <div className="waste-type">Biodegradable:</div>
                <div className="waste-amount">{totals.bio ?? 0}</div>
              </div>
              <div className="waste-stat-item">
                <img src={nonBiodegradableIcon} alt="Non-Biodegradable" />
                <div className="waste-type">Non-Biodegradable:</div>
                <div className="waste-amount">{totals.non_bio ?? 0}</div>
              </div>
              <div className="waste-stat-item">
                <img src={unidentifiedIcon} alt="Unclassified Waste" />
                <div className="waste-type">Unclassified Waste:</div>
                <div className="waste-amount">{totals.unclassified ?? 0}</div>
              </div>
            </div>
          </div>

          {/* Add footer */}
          <div className="footer white">
            © 2025 Leyte Normal University, All rights reserved.
          </div>
        </div>

  <div className="side-section">
          <div className="total-waste-card">
            <h3>Total Waste Collected</h3>
            <div className="waste-item">
              <img src={biodegradableIcon} alt="Biodegradable" />
              <span>Biodegradable:</span>
              <span className="amount">{allTotals.bio ?? 0}</span>
            </div>
            <div className="waste-item">
              <img src={nonBiodegradableIcon} alt="Non-Biodegradable" />
              <span>Non-Biodegradable:</span>
              <span className="amount">{allTotals.non_bio ?? 0}</span>
            </div>
            <div className="waste-item">
              <img src={unidentifiedIcon} alt="Unidentified" />
              <span>Unidentified Waste:</span>
              <span className="amount">{allTotals.unclassified ?? 0}</span>
            </div>
          </div>

          <div className="legend-card">
            <h3>LEGEND</h3>
            <div className="legend-item">
              <div className="legend-color biodegradable"></div>
              <span>Biodegradable</span>
            </div>
            <div className="legend-item">
              <div className="legend-color non-biodegradable"></div>
              <span>Non-Biodegradable</span>
            </div>
            <div className="legend-item">
              <div className="legend-color unidentified"></div>
              <span>Unidentified Waste</span>
            </div>
          </div>
        </div>
      </div>

  {/* Confirmation modal no longer required for filtering; kept for future use if needed */}
    </div>
    </div>
  );
};

export default MonitoringPage;