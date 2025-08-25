import React, { useEffect, useMemo, useState } from 'react';
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
  const [totals, setTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  const handleDateChange = (update) => {
    setDateRange(update);
    if (update[0] && update[1]) {
      setShowConfirmation(true);
    }
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "Select Date Range";
  };

  // Fetch initial daily breakdown and totals
  useEffect(() => {
    let mounted = true;
    const load = async () => {
      setLoading(true);
      setError('');
      try {
        const [dailyRes, totalsRes] = await Promise.all([
          monitoringAPI.getDailyBreakdown(),
          monitoringAPI.getTotals(),
        ]);
        if (!mounted) return;
        setDaily(Array.isArray(dailyRes.data) ? dailyRes.data : []);
        setTotals(totalsRes.data || { bio: 0, non_bio: 0, unclassified: 0 });
      } catch (err) {
        if (!mounted) return;
        setError(err?.response?.data?.message || 'Failed to load monitoring data');
      } finally {
        mounted && setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, []);

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
          data: daily.map((d) => d.bio ?? 0),
          borderColor: 'rgb(102, 176, 50)',
          backgroundColor: 'rgb(102, 176, 50)',
          tension: 0.4,
          pointRadius: 5,
        },
        {
          label: 'Non-Biodegradable',
          data: daily.map((d) => d.non_bio ?? 0),
          borderColor: 'rgb(255, 192, 0)',
          backgroundColor: 'rgb(255, 192, 0)',
          tension: 0.4,
          pointRadius: 5,
        },
        {
          label: 'Unidentified Waste',
          data: daily.map((d) => d.unclassified ?? 0),
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
    const allValues = daily.flatMap(d => [d.bio ?? 0, d.non_bio ?? 0, d.unclassified ?? 0]);
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
          <div className="print-button-container">
            <button className="print-button">Print</button>
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
                <img src={unidentifiedIcon} alt="Unidentified Waste" />
                <div className="waste-type">Unidentified Waste:</div>
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

      {/* Add confirmation modal */}
      <Modal show={showConfirmation} onHide={() => setShowConfirmation(false)}>
        <Modal.Header closeButton>
          <Modal.Title>Confirm Date Range</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          Do you want to view data for the period: {formatDateRange()}?
        </Modal.Body>
        <Modal.Footer>
          <Button variant="secondary" onClick={() => setShowConfirmation(false)}>
            Cancel
          </Button>
          <Button variant="primary" onClick={() => {
            // Handle confirmed date range here
            setShowConfirmation(false);
            // Update your chart data based on the selected range
          }}>
            Confirm
          </Button>
        </Modal.Footer>
      </Modal>
    </div>
  );
};

export default MonitoringPage;