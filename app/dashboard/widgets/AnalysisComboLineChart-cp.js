'use client';
import { useRef, useEffect, useState, useMemo } from 'react';
import * as d3 from 'd3';
import styles from '../Analysis.module.css';

export default function AnalysisComboLineChart({ 
  data, 
  metrics, 
  height = 200, 
  selectedDate = null,  // Default to null
    onDateClick = () => {},  // Default empty function
  axisTitles = {
    y1: 'Left Axis',
    y2: 'Right Axis'
  } 
}) {
  const svgRef = useRef();
  const [hiddenMetrics, setHiddenMetrics] = useState([]);
  const margin = useMemo(() => ({
    top: 10,
    right: 40,
    bottom: 40,
    left: 40
  }), []);
  const width = 1024;

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous chart
    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    // Set up dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG group
    const chartGroup = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Create tooltip
    const tooltip = d3.select("body").append("div")
      .attr("class", "tooltip")
      .style("opacity", 0)
      .style("position", "absolute")
      .style("background", "#fff")
      .style("border", "1px solid #ddd")
      .style("padding", "5px 10px")
      .style("border-radius", "3px")
      .style("pointer-events", "none");

    // Parse dates
    const parseDate = d3.timeParse('%Y-%m-%d');
    const processedData = data.map(d => ({
      ...d,
      parsedDate: parseDate(d.date),
      isSelected: selectedDate === d.date  // Precompute selection state
    })).sort((a, b) => a.parsedDate - b.parsedDate);

    // Create scales
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

    // Add grid lines
    //chartGroup.append('g')
      //.attr('class', styles.grid)
      //..call(d3.axisLeft(y1)
        //.tickSize(-innerWidth)
        //.tickFormat(''));

    // Render metrics
    metrics.filter(m => !hiddenMetrics.includes(m.key)).forEach(metric => {
      const yScale = metric.axis === 'y1' ? y1 : y2;
      
      if (metric.chartType === 'bar') {
        const barWidth = innerWidth / processedData.length * 0.1;
        chartGroup.selectAll(`.bar-${metric.key}`)
          .data(processedData)
          .enter()
          .append('rect')
            .attr('class', `bar-${metric.key}`)
            .attr('x', d => x(d.parsedDate) - barWidth/2)
            .attr('y', d => yScale(d[metric.key]))
            .attr('width', barWidth * 0.9)
            .attr('height', d => innerHeight - yScale(d[metric.key]))
            .attr('fill', metric.color)
            .attr('opacity', 0.5)
            .attr('pointer-events', 'none');
      } else {
        // Render lines
        const lineGenerator = d3.line()
          .x(d => x(d.parsedDate))
          .y(d => yScale(d[metric.key]));

        chartGroup.append('path')
          .datum(processedData)
          .attr('d', lineGenerator)
          .attr('stroke', metric.color)
          .attr('stroke-width', 2)
          .attr('fill', 'none');

        // Render points
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
              if (!d.isSelected) {
                d3.select(this).attr('r', 8);
              }
              tooltip
                .html(`<strong>${metric.key}:</strong> ${d[metric.key]}`)
                .style('left', `${event.pageX + 10}px`)
                .style('top', `${event.pageY - 28}px`)
                .style('opacity', 0.9);
            })
            .on('mouseout', function(event, d) {
              if (!d.isSelected) {
                d3.select(this).attr('r', 6);
              }
              tooltip.style('opacity', 0);
            });
      }
    });

    // Add axes
    chartGroup.append('g')
      .attr('class', styles.axis)
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x).ticks(5));

chartGroup.append('g')
  .attr('class', styles.axis)
  .call(d3.axisLeft(y1)
    .tickValues(d3.range(0, y1Max + 0.2, 0.2)) // Fixed interval of 0.2
    .tickFormat(d3.format(".1f"))) // Format to 1 decimal place
  .selectAll(".tick text")
    .style("font-size", "10px"); // Optional styling

    chartGroup.append('g')
      .attr('class', styles.axis)
    .attr('transform', `translate(${innerWidth},0)`)
      .call(d3.axisRight(y2)
      .tickValues(d3.range(0, y2Max + 20, 20)) // Fixed interval of 20
    .tickFormat(d3.format(".1f"))) // Format to 1 decimal place
    .selectAll(".tick text")
     .style("font-size", "10px"); // Optional styling

    // Add legend
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
  }, [data, metrics, height, margin, hiddenMetrics, selectedDate,onDateClick]);

  return (
    <div className={styles.chartContainer} style={{ position: 'relative' }}>
      <svg 
        ref={svgRef}
        style={{ 
          overflowx: 'auto',
          pointerEvents: 'all',
          position: 'relative',
          zIndex: 1
        }}
      ></svg>
    </div>
  );
}