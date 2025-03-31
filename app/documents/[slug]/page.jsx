//app/document/[slug]/page.jsx
//'use client';

//import { useEffect, useState } from 'react';
import fs from 'fs/promises'; // Use fs.promises for asynchronous file reading
import path from 'path';
import 'katex/dist/katex.min.css';
import { markdownToHtml } from '../../lib/markdownToHtml';
import Navbar from '../../components/Navbar';
import Layout from '../../components/Layout';
import styles from './page.module.css';
import "../../globals.css";
import matter from 'gray-matter';



import { readFile } from 'fs/promises'


export default async function DocumentViewer({ params }) {
  const { slug } = await params;

  // Read the Markdown file asynchronously
  const filePath = path.join(process.cwd(), 'public/api_quick_start', `${slug}.md`);
  //const { default: fs } = await import('fs/promises');
  const fileContent = await fs.readFile(filePath, 'utf8');

  // Parse the Markdown file
  const { data, content } = matter(fileContent);
  const { html, headings } = await markdownToHtml(content);

  const articleData = {
    title: data.title,
    image: data.image || null,
    content: html,
    headings,
  };
  
 console.log("headings in page js", headings)

  return (
    <div>
      <Navbar />
      <div className={styles.container}>
        {/* Hidden checkbox for toggle functionality */}
        <input type="checkbox" id="sidebar-toggle" className={styles.sidebarToggleCheckbox} />
        <label htmlFor="sidebar-toggle" className={styles.sidebarToggleButton}>☰</label>

        

        <main className={styles.main}>
          {articleData.image && (
            <img src={articleData.image} alt={articleData.title} className={styles.articleImage} />
          )}
          <div
            className={`${styles.content} tableWrapper codeWrapper`}
            dangerouslySetInnerHTML={{ __html: articleData.content }}
          />
        </main>

       </div>
    </div>
  );
}