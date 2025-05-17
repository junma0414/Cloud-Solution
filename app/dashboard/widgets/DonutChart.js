'use client';
import { useEffect, useRef } from 'react';
import * as d3 from 'd3';
import styles from './Charts.module.css';

export default function DonutChart({ data, width = 240, height = 240 }) {
  const ref = useRef();
  const tooltipRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    const svg = d3.select(ref.current);
    svg.selectAll('*').remove();

    // Clean up any existing tooltip
    if (tooltipRef.current) {
      tooltipRef.current.remove();
      tooltipRef.current = null;
    }

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

    // Arc generators
    const arc = d3.arc()
      .innerRadius(radius - thickness)
      .outerRadius(radius);

    const outerArc = d3.arc()
      .innerRadius(radius * 1.1)
      .outerRadius(radius * 1.1);

    // Create donut slices with hover effects
    const arcs = chartGroup.selectAll('path')
      .data(pie(data))
      .enter()
      .append('path')
      .attr('d', arc)
      .attr('fill', d => color(d.data.name))
      .attr('stroke', '#fff')
      .attr('stroke-width', 1)
      .on('mouseover', function(event, d) {
        d3.select(this)
          .attr('stroke-width', 2)
          .attr('stroke', '#333');

        // Create or update tooltip
        if (!tooltipRef.current) {
          tooltipRef.current = document.createElement('div');
          tooltipRef.current.className = styles.tooltip;
          document.body.appendChild(tooltipRef.current);
        }

        const tooltip = d3.select(tooltipRef.current)
          .html(`${d.data.name}: ${d.data.value}`)
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function() {
        d3.select(this)
          .attr('stroke-width', 1)
          .attr('stroke', '#fff');

        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style('opacity', 0);
        }
      });

    // Original data labels implementation
    arcs.each(function(d) {
      const centroid = arc.centroid(d);
      const outerCentroid = outerArc.centroid(d);
      const isLargeEnough = (d.endAngle - d.startAngle) > 0.2;
      
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

    // Center total text
    const total = data.reduce((sum, d) => sum + d.value, 0);
    chartGroup.append('text')
      .attr('text-anchor', 'middle')
      .attr('dy', '0.35em')
      .style('font-size', `${Math.min(14, radius * 0.3)}px`)
      .style('font-weight', 'bold')
      .style('fill', '#333')
      .text(total);

    // Legend implementation
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
      .attr('fill', (d, i) => color(d.name))
      .on('mouseover', function(event, d) {
        chartGroup.selectAll('path')
          .filter(p => p.data.name === d.name)
          .attr('stroke-width', 2)
          .attr('stroke', '#333');

        if (!tooltipRef.current) {
          tooltipRef.current = document.createElement('div');
          tooltipRef.current.className = styles.tooltip;
          document.body.appendChild(tooltipRef.current);
        }

        d3.select(tooltipRef.current)
          .html(`${d.name}: ${d.value}`)
          .style('opacity', 1)
          .style('left', `${event.pageX + 10}px`)
          .style('top', `${event.pageY - 28}px`);
      })
      .on('mouseout', function() {
        chartGroup.selectAll('path')
          .filter(p => p.data.name === p.data.name)
          .attr('stroke-width', 1)
          .attr('stroke', '#fff');

        if (tooltipRef.current) {
          d3.select(tooltipRef.current)
            .style('opacity', 0);
        }
      });

    legendItems.append('text')
      .attr('x', 15)
      .attr('y', 9)
      .style('font-size', '10px')
      .style('fill', '#555')
      .text(d => d.name);

    // Cleanup function
    return () => {
      if (tooltipRef.current) {
        d3.select(tooltipRef.current).remove();
        tooltipRef.current = null;
      }
    };
  }, [data, width, height]);

  return (
    <div className={styles.donutContainer}>
      <svg ref={ref} className={styles.donutChart} />
    </div>
  );
}