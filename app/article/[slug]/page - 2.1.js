
//'use client'; // Mark this component as a Client Component
//import { useEffect } from 'react';
import fs from 'fs';
import path from 'path';
import 'katex/dist/katex.min.css';
import { markdownToHtml} from '../../lib/markdownToHtml';
import Navbar from '../../components/Navbar';
import styles from './page.module.css';
import "../../globals.css";
import matter from 'gray-matter';




export default async function ArticlePage({ params }) {
  const { slug } = params;

  // Read the Markdown file
  const filePath = path.join(process.cwd(), 'articles', `${slug}.md`);
  const fileContent = fs.readFileSync(filePath, 'utf8');
 let articleData = { title: '', image: '', content: '' };
  // Parse the Markdown file
  const { data, content } = matter(fileContent);
  //const htmlContent = await markdownToHtml(content);
  articleData = {
      title: data.title,
      image: data.image || null,
      content: await markdownToHtml(content),
    };
 

  
  return (
    <div>
      <Navbar />
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
  );
}