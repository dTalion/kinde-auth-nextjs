import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { join } from "path";

/**
 * Turbopack Compatibility Plugin for Vite
 * 
 * Transforms Next.js module imports to include .js extensions for Turbopack compatibility.
 * Fixes the issue where handleAuth() returns undefined in Next.js 15+ with Turbopack.
 */
export const turbopackCompatibilityPlugin = () => {
  const findJSFiles = (dir: string): string[] => {
    const files: string[] = [];
    try {
      const entries = readdirSync(dir);
      for (const entry of entries) {
        const fullPath = join(dir, entry);
        const stat = statSync(fullPath);
        if (stat.isDirectory()) {
          files.push(...findJSFiles(fullPath));
        } else if (stat.isFile() && entry.endsWith('.js')) {
          files.push(fullPath);
        }
      }
    } catch (error) {
      // Silent error handling - directory might not exist
    }
    return files;
  };

  return {
    name: 'turbopack-compatibility',
    writeBundle() {
      // This runs after files are written but before build completes
      try {
        const jsFiles = findJSFiles('dist');
        let filesProcessed = 0;
        
        jsFiles.forEach(file => {
          try {
            const content = readFileSync(file, 'utf8');
            
            // Apply Next.js import transformations for Turbopack compatibility
            const transformedContent = content
              .replace(/"next\/server"(?!\.js)/g, '"next/server.js"')
              .replace(/"next\/headers"(?!\.js)/g, '"next/headers.js"')
              .replace(/"next\/cookies"(?!\.js)/g, '"next/cookies.js"')
              .replace(/"next\/navigation"(?!\.js)/g, '"next/navigation.js"')
              .replace(/next\/dist\/server\/web\/spec-extension\/cookies(?!\.js)/g, 'next/dist/server/web/spec-extension/cookies.js');
            
            // Only write if content changed
            if (transformedContent !== content) {
              writeFileSync(file, transformedContent, 'utf8');
              filesProcessed++;
            }
          } catch (error) {
            // Silent error handling
          }
        });
      } catch (error) {
        // Silent error handling
      }
    }
  };
}; 