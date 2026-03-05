import React, { useState, useEffect } from 'react';
import { Bar } from 'react-chartjs-2';
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
} from 'chart.js';
import api from '../api/axios';
import './AttendanceRateChart.css';

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

/**
 * AttendanceRateChart Component
 * Displays attendance rate chart in teacher dashboard
 * @param {string} teacherId - Optional teacher ID (defaults to current user)
 */
const AttendanceRateChart = ({ teacherId }) => {
  const [chartData, setChartData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    const fetchAttendanceRates = async () => {
      setLoading(true);
      setError('');

      try {
        const endpoint = teacherId 
          ? `/attendance/teacher-rates/${teacherId}`
          : '/attendance/teacher-rates';
        
        const response = await api.get(endpoint);
        
        if (response.data.success && response.data.data.length > 0) {
          const rates = response.data.data;
          
          // Prepare chart data
          const labels = rates.map(r => r.className);
          const data = rates.map(r => r.attendanceRate);
          
          setChartData({
            labels,
            datasets: [
              {
                label: 'Tỷ lệ chuyên cần (%)',
                data,
                backgroundColor: 'rgba(54, 162, 235, 0.6)',
                borderColor: 'rgba(54, 162, 235, 1)',
                borderWidth: 1,
              }
            ]
          });
        } else {
          setChartData(null);
          setError('Chưa có dữ liệu điểm danh');
        }
      } catch (err) {
        if (err.response?.data?.message) {
          setError(err.response.data.message);
        } else {
          setError('Không thể tải dữ liệu biểu đồ. Vui lòng thử lại.');
        }
      } finally {
        setLoading(false);
      }
    };

    fetchAttendanceRates();
  }, [teacherId]);

  const options = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: 'top',
      },
      title: {
        display: true,
        text: 'Tỷ lệ chuyên cần theo lớp',
        font: {
          size: 16
        }
      },
      tooltip: {
        callbacks: {
          label: function(context) {
            const rate = context.parsed.y;
            const dataIndex = context.dataIndex;
            return `Tỷ lệ: ${rate.toFixed(2)}%`;
          }
        }
      }
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      }
    }
  };

  if (loading) {
    return (
      <div className="attendance-rate-chart">
        <div className="loading-message">Đang tải biểu đồ...</div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="attendance-rate-chart">
        <div className="error-message">{error}</div>
      </div>
    );
  }

  if (!chartData) {
    return (
      <div className="attendance-rate-chart">
        <div className="no-data-message">Chưa có dữ liệu điểm danh</div>
      </div>
    );
  }

  return (
    <div className="attendance-rate-chart">
      <div className="chart-container">
        <Bar data={chartData} options={options} />
      </div>
    </div>
  );
};

export default AttendanceRateChart;
