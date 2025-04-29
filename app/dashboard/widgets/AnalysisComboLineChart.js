'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import styles from '../Analysis.module.css';

export default function AnalysisComboLineChart({ 
  data, 
  metrics, 
  height = 200, 
  selectedDate = null,
  onDateClick = () => {}, 
  axisTitles = {
    y1: 'Left Axis',
    y2: 'Right Axis'
  } 
}) {
  const svgRef = useRef();
  const containerRef = useRef();
  const [chartWidth, setChartWidth] = useState(1024);
  const [hiddenMetrics, setHiddenMetrics] = useState([]);

  const margin = useMemo(() => ({
    top: 10,
    right: 40,
    bottom: 40,
    left: 40
  }), []);

  useEffect(() => {
    const resizeObserver = new ResizeObserver(entries => {
      for (let entry of entries) {
        if (entry.contentRect?.width) {
          setChartWidth(entry.contentRect.width);
        }
      }
    });

    if (containerRef.current) {
      resizeObserver.observe(containerRef.current);
    }

    return () => resizeObserver.disconnect();
  }, []);

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const innerWidth = chartWidth - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const chartGroup = svg
      .attr('width', chartWidth)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ddd")
      .style("padding", "5px 10px")
      .style("border-radius", "3px")
      .style("pointer-events", "none");

    const parseDate = d3.timeParse('%Y-%m-%d');
    const processedData = data.map(d => ({
      ...d,
      parsedDate: parseDate(d.date),
      isSelected: selectedDate === d.date
    })).sort((a, b) => a.parsedDate - b.parsedDate);

    const y1Metrics = metrics.filter(m => m.axis === 'y1' && !hiddenMetrics.includes(m.key));
    const y1Max = d3.max(y1Metrics, metric => 
      d3.max(processedData, d => d[metric.key])
    ) * 1.1;

    const y1 = d3.scaleLinear()
      .domain([0, y1Max || 1])
      .range([innerHeight, 0]);

    const y2Metrics = metrics.filter(m => m.axis === 'y2' && !hiddenMetrics.includes(m.key));
    const y2Max = d3.max(y2Metrics, metric => 
      d3.max(processedData, d => d[metric.key])
    ) * 1.1;

    const y2 = d3.scaleLinear()
      .domain([0, y2Max || 1])
      .range([innerHeight, 0]);

    const x = d3.scaleTime()
      .domain(d3.extent(processedData, d => d.parsedDate))
      .range([0, innerWidth]);

    metrics.filter(m => !hiddenMetrics.includes(m.key)).forEach(metric => {
      const yScale = metric.axis === 'y1' ? y1 : y2;

      if (metric.chartType === 'bar') {
        const barWidth = innerWidth / processedData.length * 0.1;
        chartGroup.selectAll(`.bar-${metric.key}`)
          .data(processedData)
          .enter()
          .append('rect')
          .attr('class', `bar-${metric.key}`)
          .attr('x', d => x(d.parsedDate) - barWidth / 2)
          .attr('y', d => yScale(d[metric.key]))
          .attr('width', barWidth * 0.9)
          .attr('height', d => innerHeight - yScale(d[metric.key]))
          .attr('fill', metric.color)
          .attr('opacity', 0.5)
          .attr('pointer-events', 'none');
      } else {
        const lineGenerator = d3.line()
          .x(d => x(d.parsedDate))
          .y(d => yScale(d[metric.key]));

        chartGroup.append('path')
          .datum(processedData)
          .attr('d', lineGenerator)
          .attr('stroke', metric.color)
          .attr('stroke-width', 2)
          .attr('fill', 'none');

        chartGroup.selectAll(`.point-${metric.key}`)
          .data(processedData)
          .enter()
          .append('circle')
          .attr('class', `point-${metric.key}`)
          .attr('cx', d => x(d.parsedDate))
          .attr('cy', d => yScale(d[metric.key]))
          .attr('r', d => d.isSelected ? 8 : 6)
          .attr('fill', d => d.isSelected ? metric.color : 'white')
          .attr('stroke', metric.color)
          .attr('stroke-width', d => d.isSelected ? 3 : 2)
          .style('cursor', 'pointer')
          .on('click', function(event, d) {
            event.stopPropagation();
            onDateClick(d.date);
          })
          .on('mouseover', function(event, d) {
            if (!d.isSelected) d3.select(this).attr('r', 8);
            tooltip.html(`
              <div><strong>Date:</strong> ${d.date}</div>
              <div><strong>${metric.key}:</strong> ${Number(d[metric.key]).toFixed(3)}</div>
            `)
              .style('left', `${event.pageX + 10}px`)
              .style('top', `${event.pageY - 28}px`)
              .style('opacity', 0.9)
              .style('z-index', 10000);
          })
          .on('mouseout', function(event, d) {
            if (!d.isSelected) d3.select(this).attr('r', 6);
            tooltip.style('opacity', 0);
          });
      }
    });

    chartGroup.append('g')
      .attr('class', styles.axis)
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5));

    chartGroup.append('g')
      .attr('class', styles.axis)
      .call(d3.axisLeft(y1).tickFormat(d3.format(".1f")))
      .selectAll(".tick text")
      .style("font-size", "10px");

    chartGroup.append('g')
      .attr('class', styles.axis)
      .attr('transform', `translate(${innerWidth},0)`)
      .call(d3.axisRight(y2).tickFormat(d3.format(".1f")))
      .selectAll(".tick text")
      .style("font-size", "10px");

    const legend = chartGroup.append('g')
      .attr('transform', `translate(${margin.left}, ${margin.top - 10})`);

    metrics.forEach((metric, i) => {
      const isHidden = hiddenMetrics.includes(metric.key);
      const legendItem = legend.append('g')
        .attr('transform', `translate(${i * 120}, 0)`)
        .style('cursor', 'pointer')
        .on('click', () => {
          setHiddenMetrics(prev => 
            prev.includes(metric.key) 
              ? prev.filter(k => k !== metric.key) 
              : [...prev, metric.key]
          );
        });

      legendItem.append('line')
        .attr('x1', 0)
        .attr('x2', 15)
        .attr('y1', 10)
        .attr('y2', 10)
        .attr('stroke', isHidden ? '#ccc' : metric.color)
        .attr('stroke-width', 2)
        .attr('opacity', isHidden ? 0.5 : 1);

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(metric.name)
        .style('font-size', '12px')
        .style('fill', isHidden ? '#ccc' : '#333')
        .style('opacity', isHidden ? 0.5 : 1);
    });

    return () => {
      tooltip.remove();
    };
  }, [data, metrics, height, margin, hiddenMetrics, selectedDate, chartWidth, onDateClick]);

  return (
    <div ref={containerRef} >
      <svg 
        ref={svgRef}
        className={styles.chartSvg}
        style={{
          width: '100%',
          height: `${height}px`
        }}
      ></svg>
    </div>
  );
}
