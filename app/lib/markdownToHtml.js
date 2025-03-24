import { remark } from 'remark';
import remarkHtml from 'remark-html';
import remarkMath from 'remark-math';
import remarkGfm from 'remark-gfm';
import rehypeKatex from 'rehype-katex';
import rehypeStringify from 'rehype-stringify';
import { unified } from 'unified';
import rehypeParse from 'rehype-parse';
import rehypeHighlight from 'rehype-highlight';
import remarkHeadingId from 'remark-heading-id';
import rehypeSlug from 'rehype-slug';
import remark2rehype from 'rehype-remark';

export async function markdownToHtml(markdown) {
  const headings = [];

  // Function to build nested headings
  const buildNestedHeadings = (nodes, currentDepth = 1) => {
    const nestedHeadings = [];
    while (nodes.length > 0) {
      const node = nodes[0];
      if (node.type === 'heading' && node.depth === currentDepth) {
        const heading = {
          depth: node.depth,
          text: node.children[0].value,
          id: node.data?.id || node.children[0].value.toLowerCase().replace(/\s+/g, '-'),
          children: [],
        };
        nodes.shift(); // Remove the processed node
        heading.children = buildNestedHeadings(nodes, currentDepth + 1); // Recursively process children
        nestedHeadings.push(heading);
      } else if (node.type === 'heading' && node.depth < currentDepth) {
        break; // Stop if the next node is a higher-level heading
      } else {
        nodes.shift(); // Skip non-heading nodes
      }
    }
    return nestedHeadings;
  };

  // Parse the Markdown content
  const tree = remark().use(remarkHeadingId).parse(markdown);

console.log("tree structure: ", JSON.stringify(tree, null, 2)); // Print parsed AST

  // Extract headings
  const nodes = tree.children.filter((node) => node.type === 'heading');


  headings.push(...buildNestedHeadings(nodes));

  console.log('Headings:', headings); // Debug the final headings array


  // Convert Markdown to HTML
  const result = await remark()
    .use(remarkMath) // Enable math formulas
    .use(remarkGfm)
  .use(remarkHeadingId) // Ensure IDs are added to headings
    .use(remarkHtml, { sanitize: false }) // Convert Markdown to HTML
    .process(markdown);
    
   console.log('Result after await: ', result);    

  const htmlContent = await unified()
    .use(rehypeParse, { fragment: true, space: 'html' }) // Parse HTML
    .use(rehypeSlug) // Add IDs to headings (rehype-slug)
    .use(rehypeKatex) // Render math formulas
    .use(rehypeHighlight) // Enable syntax highlighting
    .use(rehypeStringify) // Convert back to HTML string
    .process(result.toString());

 console.log('HTML Content:', htmlContent.toString()); // Debug the final HTML

  return {
    html: htmlContent.toString(),
    headings,
  };
}