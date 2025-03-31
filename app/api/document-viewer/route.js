export async function generateStaticParams() {
  // This reads your markdown files at build time
  const fs = require('fs');
  const path = require('path');
  
  const docsDir = path.join(process.cwd(), 'public/api_quick_start');
  const files = fs.readdirSync(docsDir)
    .filter(file => file.endsWith('.md'))
    .map(file => ({ docname: file.replace('.md', '') }));
    
  return files;
}