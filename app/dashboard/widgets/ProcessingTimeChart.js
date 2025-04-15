'use client';
import { useEffect, useRef } from 'react';
import { Chart } from 'chart.js/auto';
import 'chartjs-adapter-date-fns';

export default function ProcessingTimeChart({ data }) {
  const chartRef = useRef(null);
  const chartInstance = useRef(null);

  useEffect(() => {
    if (!data || !chartRef.current) return;

    const points = data
      .filter(call => call.requested_at && call.processing_time_ms)
      .map(call => ({
        x: new Date(call.requested_at).getTime(),
        y: call.processing_time_ms
      }))
      .sort((a, b) => a.x - b.x);

    const ctx = chartRef.current.getContext('2d');

    if (chartInstance.current) {
      chartInstance.current.destroy();
    }

    chartInstance.current = new Chart(ctx, {
      type: 'line',
      data: {
        datasets: [{
          label: 'Processing Time (ms)',
          data: points,
          borderColor: 'rgba(234, 88, 12, 1)',
          backgroundColor: 'rgba(234, 88, 12, 0.1)',
          borderWidth: 2,
          tension: 0.1,
          pointRadius: 3,
          pointHoverRadius: 5
        }]
      },
      options: {
        responsive: true,
        maintainAspectRatio: false,
        plugins: {
          legend: { 
            position: 'top',
            labels: {
              boxWidth: 12
            }
          },
          tooltip: {
            callbacks: {
              title: (context) => new Date(context[0].raw.x).toLocaleString(),
              label: (context) => `${context.parsed.y} ms`
            }
          }
        },
        scales: {
          x: {
            type: 'time',
            time: {
              unit: 'day',
              displayFormats: {
                day: 'MMM d'
              }
            },
            title: {
              display: true,
              text: 'Date',
              font: { weight: 'bold' }
            },
            grid: { display: false }
          },
          y: {
            title: {
              display: true,
              text: 'Processing Time (ms)',
              font: { weight: 'bold' }
            },
            beginAtZero: true,
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
      <h3>Processing Time</h3>
      <div style={{ height: '100%', width: '100%' }}>
        <canvas ref={chartRef} />
      </div>
    </div>
  );
}