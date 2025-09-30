import React, { useEffect, useMemo, useState } from 'react';
// PDF export libs
import { jsPDF } from 'jspdf';
import html2canvas from 'html2canvas';
import autoTable from 'jspdf-autotable';
// NOTE: These libraries are used to generate a PDF report containing the chart image,
// a table for every visible daily data row (multi-page supported), and summary totals.
// The PDF replaces the previous Excel export per user request.
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
import { useDashboardData } from '../context/DashboardDataContext';

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
  const { daily: ctxDaily, rangeTotals: ctxRangeTotals, allTotals: ctxAllTotals, loading: ctxLoading, error: ctxError, fetchRange } = useDashboardData() || {};
  const [daily, setDaily] = useState([]);
  const [totals, setTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 });
  const [allTotals, setAllTotals] = useState({ bio: 0, non_bio: 0, unclassified: 0 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [initialDaily, setInitialDaily] = useState([]);
  // Tracks whether a PDF is currently being generated to disable the button & show status
  const [pdfGenerating, setPdfGenerating] = useState(false);

  const handleDateChange = (update) => {
    setDateRange(update);
  };

  const formatDateRange = () => {
    if (startDate && endDate) {
      return `${startDate.toLocaleDateString()} - ${endDate.toLocaleDateString()}`;
    }
    return "Select Date Range";
  };

  // Format date as YYYY-MM-DD in LOCAL time (avoids UTC shift from toISOString())
  const formatDateLocal = (date) => {
    if (!date) return '';
    const y = date.getFullYear();
    const m = String(date.getMonth() + 1).padStart(2, '0');
    const d = String(date.getDate()).padStart(2, '0');
    return `${y}-${m}-${d}`;
  };

  // Initialize from context when ready
  useEffect(() => {
    if (ctxDaily) {
      setDaily(ctxDaily);
      setInitialDaily(ctxDaily);
      setTotals(ctxRangeTotals || { bio:0, non_bio:0, unclassified:0 });
      setAllTotals(ctxAllTotals || { bio:0, non_bio:0, unclassified:0 });
      setLoading(ctxLoading === undefined ? false : ctxLoading);
      setError(ctxError || '');
    }
  }, [ctxDaily, ctxRangeTotals, ctxAllTotals, ctxLoading, ctxError]);

  // Fetch when both start and end are selected
  useEffect(() => {
    if (!startDate || !endDate) return;
    let mounted = true;
    const loadRange = async () => {
      setLoading(true); setError('');
      try {
        await fetchRange(formatDateLocal(startDate), formatDateLocal(endDate));
        if (!mounted) return;
      } catch (e) {
        if (!mounted) return;
        setError('Failed to load monitoring data');
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

  // PDF EXPORT
  // Generates a PDF containing: header metadata, chart image, daily table (all visible rows),
  // range totals and overall totals. Uses landscape A4 for width.
  const handleExportPdf = async () => {
    // Decide which dataset to export: if a range is chosen use current filtered `daily`,
    // otherwise fall back to the initially loaded week (`initialDaily`). This ensures
    // users always get data even if they didn't pick a custom range.
    const source = (startDate && endDate) ? daily : initialDaily;
    if (!source || source.length === 0) {
      alert('No data available to export.');
      return;
    }
  setPdfGenerating(true);
    try {
      const doc = new jsPDF({ orientation: 'landscape', unit: 'pt', format: 'a4' });
      const pageWidth = doc.internal.pageSize.getWidth();
      let cursorY = 40;

      const title = 'Waste Monitoring Report';
      doc.setFontSize(18);
      doc.setFont('helvetica', 'bold');
      doc.text(title, pageWidth / 2, cursorY, { align: 'center' });
      cursorY += 24;

      doc.setFontSize(11);
      doc.setFont('helvetica', 'normal');
      const rangeLine = (startDate && endDate)
        ? `Range: ${formatDateLocal(startDate)} to ${formatDateLocal(endDate)}`
        : 'Range: Initial (current week)';
      const generatedAt = `Generated At: ${new Date().toLocaleString()}`;
      doc.text(rangeLine, 40, cursorY); cursorY += 16;
      doc.text(generatedAt, 40, cursorY); cursorY += 16;

      // Capture chart (best-effort). If chart not found continue without it.
      const chartCanvas = document.querySelector('.chart-container canvas');
      if (chartCanvas) {
        try {
          const canvas = await html2canvas(chartCanvas, { backgroundColor: '#ffffff', scale: 2 });
          const imgData = canvas.toDataURL('image/png');
          const imgWidth = pageWidth - 80; // 40pt margins left/right
          const aspect = canvas.height / canvas.width;
          const imgHeight = imgWidth * aspect;
          doc.addImage(imgData, 'PNG', 40, cursorY, imgWidth, imgHeight, 'chart', 'FAST');
          cursorY += imgHeight + 24;
        } catch (e) {
          // Ignore chart capture errors
        }
      }

      // Prepare table data
      const rows = source.map(d => {
        const bio = Number(d.bio ?? 0) || 0;
        const non = Number(d.non_bio ?? 0) || 0;
        const un = Number(d.unclassified ?? 0) || 0;
        return [d.date, bio, non, un, bio + non + un];
      });

      const filteredTotals = rows.reduce((acc, r) => {
        acc.bio += r[1];
        acc.non += r[2];
        acc.un += r[3];
        acc.sum += r[4];
        return acc;
      }, { bio: 0, non: 0, un: 0, sum: 0 });

      // Daily data table
      autoTable(doc, {
        startY: cursorY,
        head: [[ 'Date', 'Biodegradable', 'Non-Biodegradable', 'Unidentified', 'Daily Total' ]],
        body: rows,
        styles: { fontSize: 9 },
        headStyles: { fillColor: [57, 111, 176] },
        theme: 'striped',
        didDrawPage: (data) => {
          // Add page footer with page numbers
          const pageCount = doc.getNumberOfPages();
          doc.setFontSize(9);
          doc.setFont('helvetica', 'normal');
          doc.text(`Page ${data.pageNumber} of ${pageCount}`, pageWidth - 60, doc.internal.pageSize.getHeight() - 20);
        }
      });
      cursorY = doc.lastAutoTable.finalY + 20;

      // Summary section (range vs overall)
      const overallTotals = {
        bio: Number(allTotals.bio ?? 0) || 0,
        non: Number(allTotals.non_bio ?? 0) || 0,
        un: Number(allTotals.unclassified ?? 0) || 0,
      };
      const overallSum = overallTotals.bio + overallTotals.non + overallTotals.un;

      autoTable(doc, {
        startY: cursorY,
        head: [[ 'Summary Type', 'Biodegradable', 'Non-Biodegradable', 'Unidentified', 'Total' ]],
        body: [
          [ 'Selected Range', filteredTotals.bio, filteredTotals.non, filteredTotals.un, filteredTotals.sum ],
          [ 'Overall Totals', overallTotals.bio, overallTotals.non, overallTotals.un, overallSum ],
        ],
        styles: { fontSize: 10 },
        headStyles: { fillColor: [90, 90, 90] },
        theme: 'grid'
      });

      const filenameBase = (startDate && endDate)
        ? `waste-monitoring_${formatDateLocal(startDate)}_to_${formatDateLocal(endDate)}`
        : 'waste-monitoring_initial';
      doc.save(`${filenameBase}.pdf`);
    } finally {
      setPdfGenerating(false);
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
      <div className="outer-monitoring-card top">
        <h2 className="page-title text-center">Monitoring</h2>
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

            <div className="chart-container expanded">
              <Line data={lineChartData} options={chartOptions} />
              {daily.length === 0 && (
                <div className="text-center text-muted mt-2">No data available for the selected period.</div>
              )}
            </div>
            <div className="print-button-container d-flex gap-2">
              <button type="button" onClick={handleExportPdf} className="print-button" disabled={pdfGenerating}>
                {pdfGenerating ? 'Generating PDF...' : 'Download PDF'}
              </button>
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
                <span>Unclassified Waste:</span>
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
                <span>Unclassified Waste</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="outer-monitoring-card bottom">
        <div className="waste-info-container expanded-row">
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
              <div className="waste-type">Unclassified Waste:</div>
              <div className="waste-amount">{totals.unclassified ?? 0}</div>
            </div>
          </div>
        </div>
      </div>

        <div className="footer white">
          © 2025 Leyte Normal University, All rights reserved.
        </div>
      </div>{/* /.container */}
    </div>
  );
};

export default MonitoringPage;