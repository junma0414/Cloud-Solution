import Navbar from '../components/Navbar';
import styles from './page.module.css';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';
import Layout from '../components/Layout';

// Get all articles
function getArticles() {
  const articlesDir = path.join(process.cwd(), 'articles');
  try {
    const files = fs.readdirSync(articlesDir);
    const articles = files.map((file) => {
      const filePath = path.join(articlesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);
      
      return {
        slug: file.replace('.md', ''),
        title: data.title,
        image: data.image,  // Pass the image URL
        date: data.date,
        formattedDate: new Date(data.date).toLocaleDateString('en-US', { // Add formatted date
          year: 'numeric',
          month: 'long',
          day: 'numeric'
        })
      };
    });

    const sortedArticles=articles.sort((a, b) => new Date(b.date) - new Date(a.date));
    return sortedArticles;
  } catch (error) {
    console.error('Error reading articles:', error);
    return [];
  }
}

export default function Article() {
  const articles = getArticles();

  return (
    <div>
      <Navbar />
      <main className={styles.main}>
        <h1 className={styles.title}>Articles</h1>
        <div className={styles.grid}>
          {articles.map((article) => (
            <Link key={article.slug} href={`/article/${article.slug}`} className={styles.card}>
              <div className={styles.imageContainer}>
                <img src={article.image} alt={article.title} className={styles.articleImage} />
              </div>
              <div className={styles.cardContent}>
                <h2 className={styles.articleTitle}>{article.title}</h2>
<span className={styles.articleDate}>{article.formattedDate}</span>
              </div>
            </Link>
          ))}
        </div>
      </main>
     <Layout />
    </div>
  );
}
