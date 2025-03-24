import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm'; // Add support for tables
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeRemark from 'rehype-remark';
import rehypeHighlight from 'rehype-highlight'; // For syntax highlighting


export async function markdownToHtml(markdown) {
  const result = await remark()
    .use(remarkMath) // Enable math formulas
   .use(remarkGfm)
    .use(remarkHtml) // Convert Markdown to HTML
    .process(markdown);

  const htmlContent = await unified()
 .use(rehypeParse, { fragment: true, space: 'html' }) // Parse HTML
    .use(rehypeKatex) // Render math formulas
 .use(rehypeHighlight) // Enable syntax highlighting
    .use(rehypeStringify) // Convert back to HTML string
    .process(result.toString());

  return htmlContent.toString();
}
