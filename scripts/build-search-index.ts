/**
 * Build-time script to generate search index from MDX files
 * Run: npm run build:search-index
 */

import fs from "fs";
import path from "path";
import { glob } from "glob";
import matter from "gray-matter";

interface SearchEntry {
  id: string;
  title: string;
  description: string;
  section: string;
  keywords: string[];
  content: string;
  path: string;
}

async function buildSearchIndex(): Promise<void> {
  const docsDir = path.join(process.cwd(), "docs");
  const outputPath = path.join(process.cwd(), "src", "search-index.json");

  // Find all MDX files
  const mdxFiles = await glob("**/*.mdx", { cwd: docsDir });

  const entries: SearchEntry[] = [];

  for (const file of mdxFiles) {
    const filePath = path.join(docsDir, file);
    const content = fs.readFileSync(filePath, "utf-8");

    // Parse frontmatter
    const { data: frontmatter, content: body } = matter(content);

    // Extract text content (strip MDX/JSX components)
    const textContent = body
      // Remove import statements
      .replace(/^import\s+.*$/gm, "")
      // Remove JSX components
      .replace(/<[^>]+>/g, "")
      // Remove code blocks
      .replace(/```[\s\S]*?```/g, "")
      // Remove inline code
      .replace(/`[^`]+`/g, "")
      // Remove markdown links but keep text
      .replace(/\[([^\]]+)\]\([^)]+\)/g, "$1")
      // Remove markdown formatting
      .replace(/[#*_~]/g, "")
      // Collapse whitespace
      .replace(/\s+/g, " ")
      .trim();

    // Build path from file location
    const urlPath = file
      .replace(/\.mdx$/, "")
      .replace(/\/index$/, "")
      .replace(/\\/g, "/");

    entries.push({
      id: urlPath,
      title: frontmatter.title || path.basename(file, ".mdx"),
      description: frontmatter.description || "",
      section: frontmatter.section || "",
      keywords: frontmatter.keywords || [],
      content: textContent.slice(0, 1000), // Limit content for index size
      path: `/docs/${urlPath}`,
    });
  }

  // Write index to JSON file
  fs.writeFileSync(outputPath, JSON.stringify(entries, null, 2));

  console.log(`Built search index with ${entries.length} entries`);
  console.log(`Output: ${outputPath}`);
}

buildSearchIndex().catch(console.error);
