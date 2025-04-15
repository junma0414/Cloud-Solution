"use client";
import { useState, useEffect } from "react";
import Navbar from "../components/Navbar.js";
import Layout from "../components/Layout";

const categoryDescriptions = {
  "jailbreaking": "Attempts to bypass system restrictions.",
  "illegal content": "Content related to unlawful activities.",
  "hateful content": "Promotes hate speech or discrimination.",
  "harassment": "Threats, bullying, or intimidation.",
  "racism": "Racially insensitive or discriminatory content.",
  "sexism": "Sexist or gender-based discrimination.",
  "violence": "Content depicting or encouraging violence.",
  "sexual content": "Explicit or inappropriate sexual material.",
  "harmful content": "Misinformation or dangerous content.",
  "unethical content": "Encourages unethical behavior or fraud.",
};

export default function APIPlayground() {
  const [inputText, setInputText] = useState("");
  const [records, setRecords] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  const [documents, setDocuments] = useState([]);
  const [docLoading, setDocLoading] = useState(true);

   const [activeDoc, setActiveDoc] = useState(null);
   const [docContent, setDocContent] = useState('');

  useEffect(() => {
    // Fetch the list of documents from the API quick start folder
    const fetchDocuments = async () => {
      try {
        const response = await fetch('/api_quick_start/list.json');
        if (!response.ok) {
          throw new Error('Failed to fetch documents');
        }
        const docs = await response.json();
        setDocuments(docs);
      } catch (error) {
        console.error("Error loading documents:", error);
        setError("Failed to load API documents");
      } finally {
        setDocLoading(false);
      }
    };

    fetchDocuments();
  }, []);

  const handleAnalyze = async () => {
    if (!inputText.trim()) {
      setError("Please enter some text to analyze");
      return;
    }

    setLoading(true);
    setError(null);
    setRecords([]); // Clear previous results

    try {

const API_URL = process.env.NEXT_PUBLIC_API_URL || '/api/grc';

    //const API_URL =  process.env.NEXT_PUBLIC_API_URL||'/api/grc';
         const response = await fetch(API_URL, {
        method: "POST",
        headers: { 
          "Content-Type": "application/json",
          "Accept": "application/json" 
        },
        body: JSON.stringify({ text: inputText }),
      });

      const data = await response.json();
      console.log("Full API response:", data); // Add this line

      if (!response.ok) {
        throw new Error(data.error || 'API request failed');
      }

      if (!data.records || !Array.isArray(data.records) || data.records.length === 0) {
        throw new Error('Analysis failed - no valid results returned');
      }

      // Ensure we always show all records
      const validRecords = data.records.map(record => ({
        ...record,
        score: Number(record.score) || 0 // Ensure score is a number, default to 0 if invalid
      }));

      setRecords(validRecords);
    } catch (error) {
      console.error("Error:", error);
      setError(error.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex flex-col">
      <Navbar />

      <div className="flex-1 p-6 pt-16 pb-20">
        <div className="flex max-w-6xl mx-auto gap-6">
          <div className="flex-1 bg-white rounded-lg p-6">
            <div className="p-2 bg-blue-100 text-blue-700 rounded-md mb-3">
              Play Ground - Enter text to analyze potential risks.
            </div>

            <textarea
              className="w-full p-3 border rounded-md"
              rows="4"
              placeholder="Type your input here..."
              value={inputText}
              onChange={(e) => setInputText(e.target.value)}
            />

            {error && (
              <div className="mt-2 p-2 bg-red-100 text-red-700 rounded-md">
                {error}
              </div>
            )}

            <button
              onClick={handleAnalyze}
              disabled={loading}
              className={`mt-3 w-full py-2 rounded-lg font-bold transition ${
                loading ? "bg-gray-400" : "bg-blue-500 hover:bg-blue-400"
              } text-white`}
            >
              {loading ? "Analyzing..." : "Get Score"}
            </button>

            {records.length > 0 && (
              <div className="mt-6">
                <h2 className="text-lg font-bold mb-3">Risk Scores</h2>
                <div className="space-y-3">
                  {records.map((record) => (
                    <div 
                      key={record.cat} 
                      className={`flex flex-col ${record.score === 0 ? 'opacity-70' : ''}`}
                    >
                      <div className="flex justify-between items-center">
                        <div className="flex items-center gap-1">
                          <span className="font-medium capitalize">
                            {record.cat}
                          </span>
                          <div className="group relative inline-block">
                            <span 
                              className="flex items-center justify-center w-4 h-4 rounded-full bg-gray-100 text-gray-500 text-xs cursor-pointer hover:bg-gray-200"
                              title={categoryDescriptions[record.cat] || "No description available"}
                            >
                              ?
                            </span>
                          </div>
                        </div>
                        <span className={`font-mono ${
                          record.score > 0.5 ? "text-red-500" : 
                          record.score >= 0 ? "text-blue-500" : "text-gray-500"
                        }`}>
                          {record.score.toFixed(2)}
                        </span>
                      </div>
                      {(
                        <div className="text-sm text-gray-600 mt-1">
                          {record.reason}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>

       <div className="flex-1 bg-white rounded-lg p-6">
  <h2 className="text-xl font-bold mb-4">API Documents</h2>
  
  {docLoading ? (
    <div className="flex justify-center items-center h-32">
      <div className="animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
    </div>
  ) : documents.length > 0 ? (
    <div className="space-y-2">
      {documents.map((doc) => (
        <div key={doc.name} className="p-3 border rounded hover:bg-gray-50 transition">
         <a 
  href={`./documents/${doc.name.replace('.md', '')}`}
  target="_blank"
  rel="noopener noreferrer"
  className="text-blue-600 hover:text-blue-800 hover:underline"
>
  {doc.displayName || doc.name.replace('.md', '')}
</a>
          {doc.description && (
            <p className="mt-1 text-sm text-gray-600">{doc.description}</p>
          )}
        </div>
      ))}
    </div>
  ) : (
    <div className="text-center py-8 text-gray-500">
      No API documents found
    </div>
  )}
</div>
        </div>
      </div>

      <div className="mt-auto">
        <Layout />
      </div>
    </div>
  );
}