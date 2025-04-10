'use client';
import { useState, useEffect, useRef } from 'react';
import { supabase } from '../../lib/supabase/client';
import ReactECharts from 'echarts-for-react';
import * as echarts from 'echarts';
import styles from './../Dashboard.module.css';

// Register required features
echarts.registerTheme('dark', {
  backgroundColor: 'transparent'
});

const categories = [
  'jailbreaking',
  'illegal_content',
  'hateful_content',
  'harassment',
  'racism',
  'sexism',
  'violence',
  'sexual_content',
  'harmful_content',
  'unethical_content'
];

export default function GaugeTab() {
  const [riskData, setRiskData] = useState([]);
  const [loading, setLoading] = useState(true);
  const chartRefs = useRef({});
  const [timeRange, setTimeRange] = useState('7d');

  // Enhanced data fetch
  useEffect(() => {
    const fetchRiskData = async () => {
      setLoading(true);
      try {
        const { data: { user }, error: authError } = await supabase.auth.getUser();
        if (authError) throw authError;
        
        const { data, error } = await supabase
          .from('grc_service_flat')
          .select('*')
          .eq('user_id', user.id)
          .order('response_at_sec', { ascending: true });

        if (error) throw error;
        setRiskData(data || []);
      } catch (error) {
        console.error("Fetch Error:", error);
      } finally {
        setLoading(false);
      }
    };
    fetchRiskData();
  }, [timeRange]);

  // Prepare chart options
  const getChartOptions = (type) => {
    if (!riskData.length) return {};
    
    const baseOptions = {
      toolbox: {
        feature: {
          saveAsImage: { title: 'Save', pixelRatio: 2 },
          dataView: { readOnly: false },
          magicType: { 
            type: type === 'pie' ? ['line', 'bar'] : ['pie', 'bar'] 
          },
          restore: {},
        }
      },
      tooltip: {
        trigger: 'item',
        formatter: (params) => {
          if (type === 'heatmap') {
            return `${params.data[0]} vs ${params.data[1]}<br/>Correlation: ${params.data[2]}`;
          }
          return `${params.name}: ${params.value}`;
        }
      },
    };

    switch (type) {
      case 'pie':
        return {
          ...baseOptions,
          series: [{
            name: 'Risk Distribution',
            type: 'pie',
            radius: ['40%', '70%'],
            data: categories.map(cat => ({
              name: cat.replace('_', ' '),
              value: riskData.reduce((sum, d) => sum + (d[cat] || 0), 0)
            })),
            emphasis: {
              itemStyle: {
                shadowBlur: 10,
                shadowOffsetX: 0,
                shadowColor: 'rgba(0, 0, 0, 0.5)'
              }
            }
          }]
        };

      case 'line':
        return {
          ...baseOptions,
          xAxis: {
            type: 'time',
            boundaryGap: false
          },
          yAxis: { type: 'value', min: 0, max: 1 },
          series: categories.map(cat => ({
            name: cat.replace('_', ' '),
            type: 'line',
            showSymbol: false,
            data: riskData.map(d => ([
              new Date(d.response_at_sec).getTime(),
              d[cat] || 0
            ]))
          }))
        };

      case 'heatmap':
        const correlationMatrix = categories.map(cat1 => 
          categories.map(cat2 => [
            cat1,
            cat2,
            riskData.length > 0 ? 
              pearsonCorrelation(
                riskData.map(d => d[cat1] || 0),
                riskData.map(d => d[cat2] || 0)
              ) : 0
          ])
        ).flat();

        return {
          ...baseOptions,
          visualMap: {
            min: -1,
            max: 1,
            calculable: true,
            inRange: { color: ['#215cff', '#d7e1ff', '#ff4d4f'] }
          },
          xAxis: { type: 'category', data: categories },
          yAxis: { type: 'category', data: categories },
          series: [{
            type: 'heatmap',
            data: correlationMatrix,
            emphasis: {
              itemStyle: { shadowBlur: 10, shadowColor: 'rgba(0, 0, 0, 0.5)' }
            }
          }]
        };

      case 'bar':
        return {
          ...baseOptions,
          xAxis: { type: 'category', data: categories },
          yAxis: { type: 'value' },
          series: ['high', 'medium', 'low'].map((type, idx) => ({
            name: type,
            type: 'bar',
            stack: 'total',
            data: categories.map(cat => {
              const value = riskData.filter(d => {
                const score = d[cat] || 0;
                if (type === 'high') return score > 0.7;
                if (type === 'medium') return score > 0.3 && score <= 0.7;
                return score > 0 && score <= 0.3;
              }).length;
              return { value, itemStyle: { color: getColor(idx) } };
            })
          }))
        };

      default:
        return {};
    }
  };

  // Helper functions
  const pearsonCorrelation = (x, y) => {
    const n = x.length;
    const sumX = x.reduce((a, b) => a + b, 0);
    const sumY = y.reduce((a, b) => a + b, 0);
    const sumXY = x.reduce((a, val, i) => a + val * y[i], 0);
    const numerator = sumXY - (sumX * sumY / n);
    const denominator = Math.sqrt(
      (x.reduce((a, b) => a + b * b, 0) - sumX * sumX / n) * 
      (y.reduce((a, b) => a + b * b, 0) - sumY * sumY / n)
    );
    return denominator === 0 ? 0 : numerator / denominator;
  };

  const getColor = (index) => {
    const colors = ['#ff4d4f', '#faad14', '#52c41a'];
    return colors[index % colors.length];
  };

  const handleChartReady = (chart, type) => {
    chartRefs.current[type] = chart;
    chart.on('click', (params) => {
      console.log('Chart clicked:', params);
      // Add custom interactions here
    });
  };

  if (loading) return <div className={styles.loading}>Loading...</div>;

  return (
    <div className={styles.tabContent}>
      <h3>Advanced Risk Analytics</h3>
      
      <div className={styles.analyticsFilters}>
        <select
          value={timeRange}
          onChange={(e) => setTimeRange(e.target.value)}
          className={styles.filterSelect}
        >
          <option value="24h">Last 24 hours</option>
          <option value="7d">Last 7 days</option>
          <option value="30d">Last 30 days</option>
        </select>
      </div>

      <div className={styles.visualizationGrid}>
        {/* Pie Chart */}
        <div className={styles.vizCard}>
          <h4>Risk Distribution</h4>
          <ReactECharts
            option={getChartOptions('pie')}
            style={{ height: '400px' }}
            onChartReady={(chart) => handleChartReady(chart, 'pie')}
            theme="dark"
          />
        </div>

        {/* Line Chart */}
        <div className={styles.vizCard}>
          <h4>Risk Trend</h4>
          <ReactECharts
            option={getChartOptions('line')}
            style={{ height: '400px' }}
            onChartReady={(chart) => handleChartReady(chart, 'line')}
            theme="dark"
          />
        </div>

        {/* Heatmap */}
        <div className={styles.vizCard}>
          <h4>Risk Correlation</h4>
          <ReactECharts
            option={getChartOptions('heatmap')}
            style={{ height: '400px' }}
            onChartReady={(chart) => handleChartReady(chart, 'heatmap')}
            theme="dark"
          />
        </div>

        {/* Stacked Bar */}
        <div className={styles.vizCard}>
          <h4>Risk Severity</h4>
          <ReactECharts
            option={getChartOptions('bar')}
            style={{ height: '400px' }}
            onChartReady={(chart) => handleChartReady(chart, 'bar')}
            theme="dark"
          />
        </div>
      </div>
    </div>
  );
}