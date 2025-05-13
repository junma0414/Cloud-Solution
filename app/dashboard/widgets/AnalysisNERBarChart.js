'use client';
import { useEffect, useRef, useState } from 'react';
import * as d3 from 'd3';
import styles from '../Analysis.module.css';

export default function AnalysisNERBarChart({ 
  data, 
  height = 300, 
  onBarClick,
  selectedWord = null // Add selectedWord prop
}) {
  const svgRef = useRef();
  const margin = { top: 20, right: 30, bottom: 60, left: 50 };
  const width = 1024;

  useEffect(() => {
    if (!data || data.length === 0) return;

    d3.select(svgRef.current).selectAll('*').remove();

    const innerWidth = width - margin.left - margin.right;
    const innerHeight = height - margin.top - margin.bottom;

    const svg = d3.select(svgRef.current)
      .attr('width', width)
      .attr('height', height)
      .append('g')
      .attr('transform', `translate(${margin.left},${margin.top})`);

    const sortedData = [...data].sort((a, b) => b.count - a.count);

    const x = d3.scaleBand()
      .domain(sortedData.map(d => d.word))
      .range([0, innerWidth])
      .padding(0.2);

    const y = d3.scaleLinear()
      .domain([0, d3.max(sortedData, d => d.count) * 1.1])
      .range([innerHeight, 0]);

    // Add axes
    svg.append('g')
      .attr('transform', `translate(0,${innerHeight})`)
      .call(d3.axisBottom(x))
      .selectAll("text")
      .attr("transform", "rotate(-45)")
      .style("text-anchor", "end");

    svg.append('g')
      .call(d3.axisLeft(y));

    // Render bars with selection styling
    svg.selectAll('.bar')
      .data(sortedData)
      .enter()
      .append('rect')
      .attr('class', styles.bar)
      .attr('x', d => x(d.word))
      .attr('y', d => y(d.count))
      .attr('width', x.bandwidth())
      .attr('height', d => innerHeight - y(d.count))
      .attr('fill', d => d.word === selectedWord ? '#2c5282' : '#4e73df') // Darker blue when selected
      .attr('opacity', d => d.word === selectedWord ? 1 : 0.8) // More opaque when selected
      .attr('stroke', d => d.word === selectedWord ? '#000' : 'none') // Border when selected
      .attr('stroke-width', 1)
      .style('cursor', 'pointer')
      .on('click', (event, d) => {
        if (onBarClick) onBarClick(d.word);
      });

    // Add count text above bars
    svg.selectAll('.label')
      .data(sortedData)
      .enter()
      .append('text')
      .attr('x', d => x(d.word) + x.bandwidth() / 2)
      .attr('y', d => y(d.count) - 5)
      .attr('text-anchor', 'middle')
      .style('font-size', '11px')
      .style('fill', d => d.word === selectedWord ? '#000' : '#333') // Darker text when selected
      .style('font-weight', d => d.word === selectedWord ? 'bold' : 'normal')
      .text(d => d.count);

    // Add axis labels
    svg.append("text")
      .attr("transform", "rotate(-90)")
      .attr("y", -margin.left+30)
      .attr("x", -innerHeight / 2)
      .attr("dy", "-1em")
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Entity Count");
{/*
    svg.append("text")
      .attr("x", innerWidth / 2)
      .attr("y", innerHeight + margin.bottom - 15)
      .style("text-anchor", "middle")
      .style("font-size", "12px")
      .style("font-weight", "bold")
      .text("Entity Word");   */}

  }, [data, height, onBarClick, selectedWord, margin]); // Add selectedWord to dependencies

  return (
    <div className={styles.chartContainer}>
      <svg ref={svgRef}></svg>
    </div>
  );
}