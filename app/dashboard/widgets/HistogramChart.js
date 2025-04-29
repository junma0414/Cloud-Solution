'use client';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './HistogramChart.module.css';

export default function HistogramChart({ data, width = 800, height = 400, margin = { top: 20, right: 30, bottom: 40, left: 40 } }) {
  const svgRef = useRef();

  useEffect(() => {
    if (!data || data.length === 0) return;

    // Clear previous chart
    d3.select(svgRef.current).selectAll('*').remove();

    // Set up dimensions
    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    // Create SVG
    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    // Prepare data - limit to top 20 entities for better visualization
    const topEntities = [...data]
      .sort((a, b) => b.count - a.count)
      .slice(0, 20);

    // Create scales
    const x = d3.scaleBand()
      .domain(topEntities.map(d => d.word))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(topEntities, d => d.count)])
      .nice()
      .range([innerHeight, 0]);

    // Color scale for different entity groups
    const color = d3.scaleOrdinal()
      .domain([...new Set(topEntities.map(d => d.entityGroup))])
      .range(d3.schemeCategory10);

    // Add bars
    svg.selectAll('.bar')
      .data(topEntities)
      .enter()
      .append('rect')
        .attr('class', styles.bar)
        .attr('x', d => x(d.word))
        .attr('y', d => y(d.count))
        .attr('width', x.bandwidth())
        .attr('height', d => innerHeight - y(d.count))
        .attr('fill', d => color(d.entityGroup))
        .on('mouseover', function(event, d) {
          d3.select(this).attr('opacity', 0.7);
          tooltip.style('visibility', 'visible')
            .html(`<strong>${d.word}</strong><br/>Count: ${d.count}<br/>Type: ${d.entityGroup}`);
        })
        .on('mousemove', (event) => {
          tooltip.style('top', `${event.pageY - 10}px`)
                .style('left', `${event.pageX + 10}px`);
        })
        .on('mouseout', function() {
          d3.select(this).attr('opacity', 1);
          tooltip.style('visibility', 'hidden');
        });

    // Add x-axis
    svg.append('g')
      .attr('class', styles.axis)
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll('text')
        .attr('transform', 'rotate(-45)')
        .style('text-anchor', 'end')
        .attr('dx', '-.8em')
        .attr('dy', '.15em');

    // Add y-axis
    svg.append('g')
      .attr('class', styles.axis)
      .call(d3.axisLeft(y));

    // Add axis labels
    svg.append('text')
      .attr('class', styles.axisLabel)
      .attr('x', innerWidth / 2)
      .attr('y', innerHeight + margin.bottom - 5)
      .style('text-anchor', 'middle')
      .text('Named Entities');

    svg.append('text')
      .attr('class', styles.axisLabel)
      .attr('transform', 'rotate(-90)')
      .attr('x', -innerHeight / 2)
      .attr('y', -margin.left + 15)
      .style('text-anchor', 'middle')
      .text('Frequency');

    // Add legend
    const legend = svg.append('g')
      .attr('transform', `translate(${innerWidth - 150}, 0)`);

    const uniqueGroups = [...new Set(topEntities.map(d => d.entityGroup))];
    
    uniqueGroups.forEach((group, i) => {
      const legendItem = legend.append('g')
        .attr('transform', `translate(0, ${i * 20})`);

      legendItem.append('rect')
        .attr('width', 15)
        .attr('height', 15)
        .attr('fill', color(group));

      legendItem.append('text')
        .attr('x', 20)
        .attr('y', 12)
        .text(group)
        .style('font-size', '12px');
    });

    // Add tooltip
    const tooltip = d3.select('body').append('div')
      .attr('class', styles.tooltip)
      .style('visibility', 'hidden');

    // Clean up
    return () => {
      tooltip.remove();
    };
  }, [data, width, height, margin]);

  return (
    <div className={styles.chartContainer}>
      <svg ref={svgRef}></svg>
    </div>
  );
}