//api/documents/page.jsx

'use client';
import { useEffect, useState } from 'react';
//import fs from 'fs/promises'; // Use fs.promises for asynchronous file reading
import path from 'path';
import 'katex/dist/katex.min.css';
import { markdownToHtml } from '../../lib/markdownToHtml';
import Navbar from '../../components/Navbar';
import Layout from '../../components/Layout';
//import styles from './page.module.css';
import "../../globals.css";
import matter from 'gray-matter';


//import MarkdownToHtml from '@/components/MarkdownToHtml';

export default function DocumentViewer({ params }) {
  const [content, setContent] = useState('');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchDocument = async () => {
      try {
      const response = await fetch(`/api_quick_start/${params.slug}.md`)
        if (!response.ok) throw new Error('Document not found');
        const text = await response.text();
        setContent(text);
      } catch (error) {
        console.error('Error loading document:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchDocument();
  }, [params.slug]);

  return (
    <div className="p-6 max-w-4xl mx-auto">
      {loading ? (
        <div className="text-center py-8">Loading document...</div>
      ) : content ? (
        <div className="prose max-w-none">
          <markdownToHtml markdown={content} />
        </div>
      ) : (
        <div className="text-center py-8 text-red-500">Document not found</div>
      )}
    </div>
  );
}