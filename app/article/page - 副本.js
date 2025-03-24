import Navbar from '../components/Navbar';
import styles from './page.module.css';
import fs from 'fs';
import path from 'path';
import matter from 'gray-matter';
import Link from 'next/link';

// Get all articles
function getArticles() {
  const articlesDir = path.join(process.cwd(), 'articles');
  try {
    const files = fs.readdirSync(articlesDir);
    const articles=files.map((file) => {
      const filePath = path.join(articlesDir, file);
      const fileContent = fs.readFileSync(filePath, 'utf8');
      const { data } = matter(fileContent);

     console.log('Articles Directory:', path.join(process.cwd(), 'articles'));
     console.log('Files in Articles Directory:', fs.readdirSync(path.join(process.cwd(), 'articles')));
      return {
        slug: file.replace('.md', ''),
        title: data.title,
      };
    });
     console.log("Article: ", articles);
     return articles;
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
            <Link
              key={article.slug}
              href={`/article/${article.slug}`}
              className={styles.card}
            >
              <h2 className={styles.articleTitle}>{article.title}</h2>
            </Link>
          ))}
        </div>
      </main>
    </div>
  );
}