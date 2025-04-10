'use client';
import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';

export default function DailyColumnChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    // Aggregate calls by day
    const dailyCounts = {};
    data.forEach(call => {
      if (call.requested_at) {
        const dateStr = new Date(call.requested_at).toLocaleDateString('en-US', {
          month: 'short',
          day: 'numeric'
        });
        dailyCounts[dateStr] = (dailyCounts[dateStr] || 0) + 1;
      }
    });

    // Sort dates chronologically
    const sortedEntries = Object.entries(dailyCounts).sort((a, b) => 
      new Date(a[0]) - new Date(b[0])
    );
    const labels = sortedEntries.map(([date]) => date);
    const counts = sortedEntries.map(([_, count]) => count);

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'bar',
      data: {
        labels: labels,
        datasets: [{
          label: 'API Calls',
          data: counts,
          backgroundColor: 'rgba(59, 130, 246, 0.7)',
          borderColor: 'rgba(59, 130, 246, 1)',
          borderWidth: 1,
          borderRadius: 4,
          barPercentage: 0.8 // Makes bars slightly thinner
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { display: false },
          tooltip: {
            callbacks: {
              label: (context) => `${context.parsed.y} calls on ${context.label}`
            }
          }
        },
        scales: {
          x: {
            title: { 
              display: true, 
              text: 'Date', 
              font: { weight: 'bold' } 
            },
            grid: { display: false }
          },
          y: {
            beginAtZero: true,
            title: {
              display: true,
              text: 'Number of Calls',
              font: { weight: 'bold' }
            },
            grid: { 
              color: '#e5e7eb',
              drawBorder: false
            }
          }
        }
      }
    });

    return () => {
      if (chartInstance.current) {
        chartInstance.current.destroy();
      }
    };
  }, [data]);

  return (
    <div className="chart-container" style={{ height: '300px' }}>
      <h3>API Calls by Day</h3>
      <div style={{ height: '100%', width: '100%' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}