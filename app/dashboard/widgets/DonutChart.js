'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './Charts.module.css';

export default function DonutChart({ data, width = 240, height = 240 }) {
  const ref = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // Calculate dimensions
    const chartHeight = height * 0.7;
    const radius = Math.min(width, chartHeight) / 2.2;
    const thickness = radius * 0.35;

    // Main chart group
    const chartGroup = svg
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${width / 2}, ${radius})`);

    // Color scale
    const color = d3.scaleOrdinal()
      .domain(data.map(d => d.name))
      .range(d3.schemeTableau10);

    // Pie generator
    const pie = d3.pie()
      .value(d => d.value)
      .sort(null);

    // Arc generators for different label positions
    const arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);

    const outerArc = d3.arc()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    // Create donut slices
    const arcs = chartGroup.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1);

    // Add value labels - inside if space permits, outside otherwise
    arcs.each(function(d) {
      const centroid = arc.centroid(d);
      const outerCentroid = outerArc.centroid(d);
      const isLargeEnough = (d.endAngle - d.startAngle) > 0.2; // Minimum angle for inner label
      
      const labelPos = isLargeEnough ? centroid : outerCentroid;
      const anchor = isLargeEnough ? 'middle' : 'start';
      const dx = isLargeEnough ? 0 : 5;

      chartGroup.append('text')
        .attr('transform', `translate(${labelPos})`)
        .attr('text-anchor', anchor)
        .attr('dy', '0.35em')
        .attr('dx', dx)
        .style('font-size', '10px')
        .style('font-weight', 'bold')
        .style('fill', isLargeEnough ? '#fff' : '#333')
        .text(d.data.value);
    });

    // Add center text with total
    const total = data.reduce((sum, d) => sum + d.value, 0);
    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', `${Math.min(14, radius * 0.3)}px`)
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(total);

    // Add compact legend beneath the chart (only names)
    const legendGroup = svg.append('g')
      .attr('transform', `translate(0, ${radius * 2 + 10})`);

    const legendItemWidth = 90;
    const legendItemHeight = 16;
    const itemsPerRow = Math.max(1, Math.floor(width / legendItemWidth));

    const legendItems = legendGroup.selectAll('.legend-item')
      .data(data)
      .enter()
      .append('g')
      .attr('class', 'legend-item')
      .attr('transform', (d, i) => {
        const row = Math.floor(i / itemsPerRow);
        const col = i % itemsPerRow;
        return `translate(${col * legendItemWidth}, ${row * legendItemHeight})`;
      });

    legendItems.append('rect')
      .attr('width', 10)
      .attr('height', 10)
      .attr('fill', (d, i) => color(d.name));

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .style('font-size', '10px')
      .style('fill', '#555')
      .text(d => d.name); // Only show name in legend

  }, [data, width, height]);

  return (
    <div className={styles.donutContainer}>
      <svg ref={ref} className={styles.donutChart} />
    </div>
  );
}