import { minimatch } from 'minimatch'

const DEFAULT_IGNORE_PATTERNS = [
  'node_modules/**',
  '.git/**',
  '**/.DS_Store',
  '**/*.log',
  '.env',
  '.env.*',
  'dist/**',
  'build/**',
  '.cache/**',
  '.amalgam/**',
]

export function shouldIgnore(path: string, customPatterns: string[] = []): boolean {
  const patterns = [...DEFAULT_IGNORE_PATTERNS, ...customPatterns]
  
  const normalizedPath = path.startsWith('/') ? path.slice(1) : path
  
  for (const pattern of patterns) {
    if (minimatch(normalizedPath, pattern, { dot: true })) {
      return true
    }
    
    if (pattern.endsWith('/**')) {
      const dirPattern = pattern.slice(0, -3)
      if (normalizedPath === dirPattern || normalizedPath.startsWith(dirPattern + '/')) {
        return true
      }
    }
  }
  
  return false
}

export function getDefaultIgnorePatterns(): string[] {
  return [...DEFAULT_IGNORE_PATTERNS]
}
