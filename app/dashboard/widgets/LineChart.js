'use client';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './Charts.module.css';

export default function LineChart({ 
  title, 
  data, 
  onPointClick, 
  height = 300,
  margin = { top: 20, right: 30, bottom: 40, left: 50 }
}) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth - margin.left - margin.right;
    const chartHeight = height - margin.top - margin.bottom;

    const chart = svg.append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Group data by text_type
    const groupedData = d3.group(data, d => d.text_type);
    const textTypes = Array.from(groupedData.keys());
    
    // Color scale for different text types
    const color = d3.scaleOrdinal()
      .domain(textTypes)
      .range(d3.schemeCategory10);

    const normalizeDate = dateStr => {
      const d = new Date(dateStr);
      d.setHours(0, 0, 0, 0);
      return d;
    };

    // X scale (time)
    const x = d3.scaleTime()
      .domain(d3.extent(data, d => normalizeDate(d.date)))
      .range([0, width]);

    // Y scale (linear)
    const y = d3.scaleLinear()
      .domain([0, d3.max(data, d => d.value) * 1.1])
      .range([chartHeight, 0]);

    // Line generator
    const line = d3.line()
      .x(d => x(normalizeDate(d.date)))
      .y(d => y(d.value))
      .curve(d3.curveMonotoneX);

    // Draw a line for each text type
    groupedData.forEach((values, textType) => {
      // Add line path
      chart.append('path')
        .datum(values)
        .attr('fill', 'none')
        .attr('stroke', color(textType))
        .attr('stroke-width', 2)
        .attr('d', line);

      // Add data points
      chart.selectAll(`.dot-${textType}`)
        .data(values)
        .enter().append('circle')
        .attr('class', `dot-${textType}`)
        .attr('cx', d => x(normalizeDate(d.date)))
        .attr('cy', d => y(d.value))
        .attr('r', 5)
        .attr('fill', color(textType))
        .attr('stroke', '#fff')
        .attr('stroke-width', 1.5)
        .on('click', (event, d) => {
          event.stopPropagation();
          onPointClick?.(d.date);
        });

      // Add value labels
      chart.selectAll(`.value-label-${textType}`)
        .data(values)
        .enter().append('text')
        .attr('class', `value-label-${textType}`)
        .attr('x', d => x(normalizeDate(d.date)))
        .attr('y', d => y(d.value) - 10)
        .attr('text-anchor', 'middle')
        .style('font-size', '10px')
        .style('fill', color(textType))
        .style('font-weight', 'bold')
        .text(d => d.value);
    });

    // Add axes
    chart.append('g')
      .attr('transform', `translate(0,${chartHeight})`)
      .call(d3.axisBottom(x).ticks(5).tickFormat(d3.timeFormat('%b %d')));

    chart.append('g')
      .call(d3.axisLeft(y));

    // Add legend
    const legend = chart.append('g')
      .attr('transform', `translate(${width - 100}, 0)`);

    textTypes.forEach((textType, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(textType));

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .style('font-size', '12px')
        .text(textType);
    });

    // Add title
    chart.append('text')
      .attr('x', width / 2)
      .attr('y', -10)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(title);

  }, [data, title, height, margin, onPointClick]);

  return <svg ref={svgRef} width="100%" height={height} className={styles.chartSvg} />;
}