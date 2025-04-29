'use client';
import { useRef, useEffect } from 'react';
import * as d3 from 'd3';
import styles from './Charts.module.css';

export default function RadarChart({ 
  title, 
  currentData, 
  historicalData, 
  categories, 
  height = 400,
  levels = 5
}) {
  const svgRef = useRef();

  useEffect(() => {
    if (!currentData || !historicalData || !categories) return;

    const svg = d3.select(svgRef.current);
    svg.selectAll('*').remove();

    const width = svgRef.current.clientWidth;
    const radius = Math.min(width, height) / 2 - 40;

    const chart = svg.append('g')
      .attr('transform', `translate(${width / 2},${height / 2})`);

    // Scales
    const angleSlice = (2 * Math.PI) / categories.length;
    const rScale = d3.scaleLinear()
      .domain([0, 1])
      .range([0, radius]);

    // Axes
    categories.forEach((category, i) => {
      chart.append('line')
        .attr('x1', 0)
        .attr('y1', 0)
        .attr('x2', rScale(1) * Math.sin(angleSlice * i))
        .attr('y2', -rScale(1) * Math.cos(angleSlice * i))
        .attr('stroke', '#ddd')
        .attr('stroke-width', 1);

      chart.append('text')
        .attr('x', (rScale(1) + 10) * Math.sin(angleSlice * i))
        .attr('y', -(rScale(1) + 10) * Math.cos(angleSlice * i))
        .text(category)
        .style('font-size', '10px')
        .style('text-anchor', 'middle');
    });

    // Levels
    for (let i = 0; i < levels; i++) {
      const level = (i + 1) / levels;
      chart.append('circle')
        .attr('r', rScale(level))
        .attr('fill', 'none')
        .attr('stroke', '#ddd')
        .attr('stroke-width', 0.5);
    }

    // Process data
    const currentValues = categories.map(cat => 
      currentData.find(d => d.cat === cat)?.score || 0
    );
    const historicalValues = categories.map(cat => 
      historicalData.find(d => d.cat === cat)?.score || 0
    );

    // Radar line
    const line = d3.lineRadial()
      .curve(d3.curveLinearClosed)
      .radius(d => rScale(d))
      .angle((d, i) => i * angleSlice);

    // Historical data
    chart.append('path')
      .datum(historicalValues)
      .attr('d', line)
      .attr('stroke', '#4f46e5')
      .attr('stroke-width', 2)
      .attr('fill', 'rgba(79, 70, 229, 0.2)');

    // Current data
    chart.append('path')
      .datum(currentValues)
      .attr('d', line)
      .attr('stroke', '#ec4899')
      .attr('stroke-width', 2)
      .attr('fill', 'rgba(236, 72, 153, 0.2)');

    // Title
    svg.append('text')
      .attr('x', width / 2)
      .attr('y', 20)
      .attr('text-anchor', 'middle')
      .style('font-size', '14px')
      .style('font-weight', 'bold')
      .text(title);

  }, [currentData, historicalData, categories, title, height, levels]);

  return <svg ref={svgRef} width="100%" height={height} className={styles.chartSvg} />;
}