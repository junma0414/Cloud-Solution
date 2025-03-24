import { remark } from 'remark';
import html from 'remark-html'; // Convert Markdown to HTML
import remarkMath from 'remark-math'; // For math formulas
import remarkGfm from 'remark-gfm'; // For tables and GitHub Flavored Markdown
import rehypeHighlight from 'rehype-highlight'; // For syntax highlighting
import rehypeKatex from 'rehype-katex'; // Render math formulas
import matter from 'gray-matter'; // Parse front matter

export async function markdownToHtml(markdown) {
 markdown = markdown.replace(/\{size:(\d+px)\}(.*?)\{\/size\}/g, '<span style="font-size: $1;">$2</span>');

  const result = await remark()
    .use(remarkMath) // Enable math formulas
   .use(remarkGfm) // Enable tables and GitHub Flavored Markdown
 .use(rehypeHighlight) // Enable syntax highlighting
    .use(html) // Convert Markdown to HTML
    .use(rehypeKatex) // Render math formulas
    .process(markdown);

  return result.toString();
}

export function parseMarkdownFile(fileContent) {
  const { data, content} = matter(fileContent);
  return { data, content };
}