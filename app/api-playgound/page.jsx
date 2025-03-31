// app/api/api-playgound/page.js
"use client";

import { useState } from "react";
import Navbar from '../components/Navbar.js';
//import styles from './page.module.css'; // Use only one CSS module
import Layout from '../components/Layout';
import Link from 'next/link';

export default function APIPlayground() {
  const [inputText, setInputText] = useState("");
  const [scores, setScores] = useState(null);
  const [loading, setLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/grc", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      setScores(data.scores);
    } catch (error) {
      console.error("Error fetching API:", error);
    }
    setLoading(false);
  };

  return (
<div>
 {/* Navbar (if needed) */}
      <Navbar />

    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 p-6">
      <h1 className="text-3xl font-bold mb-6">API Playground</h1>
      <textarea
        className="w-full max-w-lg p-3 border rounded-md"
        rows="4"
        placeholder="Enter text to analyze..."
        value={inputText}
        onChange={(e) => setInputText(e.target.value)}
      />
      <button
        onClick={handleAnalyze}
        className="mt-4 px-6 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-400"
      >
        {loading ? "Analyzing..." : "Analyze"}
      </button>

      {scores && (
        <div className="mt-6 bg-white p-4 rounded-lg shadow-md w-full max-w-lg">
          <h2 className="text-xl font-bold mb-4">Analysis Scores</h2>
          <ul>
            {Object.entries(scores).map(([category, score]) => (
              <li key={category} className="flex justify-between">
                <span>{category}</span>
                <span className="font-bold">{score.toFixed(2)}</span>
              </li>
            ))}
          </ul>
        </div>
      )}
   <Link
  href="/api-docs"
  className="mt-4 text-blue-500 hover:underline"
>
  View API Documentation →
</Link>
</div>
    <Layout />
    </div>
  );
}
