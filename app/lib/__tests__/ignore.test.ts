import { describe, test, expect } from 'bun:test'
import { shouldIgnore, getDefaultIgnorePatterns } from '../ignore'

describe('shouldIgnore', () => {
  describe('node_modules', () => {
    test('ignores node_modules/foo.js', () => {
      expect(shouldIgnore('node_modules/foo.js')).toBe(true)
    })

    test('ignores node_modules directory', () => {
      expect(shouldIgnore('node_modules')).toBe(true)
    })

    test('ignores nested node_modules files', () => {
      expect(shouldIgnore('node_modules/@types/node/index.d.ts')).toBe(true)
    })
  })

  describe('.git', () => {
    test('ignores .git/config', () => {
      expect(shouldIgnore('.git/config')).toBe(true)
    })

    test('ignores .git directory', () => {
      expect(shouldIgnore('.git')).toBe(true)
    })

    test('ignores .git/hooks/pre-commit', () => {
      expect(shouldIgnore('.git/hooks/pre-commit')).toBe(true)
    })
  })

  describe('.DS_Store', () => {
    test('ignores .DS_Store', () => {
      expect(shouldIgnore('.DS_Store')).toBe(true)
    })

    test('ignores nested .DS_Store', () => {
      expect(shouldIgnore('src/.DS_Store')).toBe(true)
    })
  })

  describe('log files', () => {
    test('ignores debug.log', () => {
      expect(shouldIgnore('debug.log')).toBe(true)
    })

    test('ignores npm-debug.log', () => {
      expect(shouldIgnore('npm-debug.log')).toBe(true)
    })

    test('ignores nested log files', () => {
      expect(shouldIgnore('logs/error.log')).toBe(true)
    })
  })

  describe('.env files', () => {
    test('ignores .env', () => {
      expect(shouldIgnore('.env')).toBe(true)
    })

    test('ignores .env.local', () => {
      expect(shouldIgnore('.env.local')).toBe(true)
    })

    test('ignores .env.development', () => {
      expect(shouldIgnore('.env.development')).toBe(true)
    })

    test('ignores .env.production', () => {
      expect(shouldIgnore('.env.production')).toBe(true)
    })
  })

  describe('build directories', () => {
    test('ignores dist/', () => {
      expect(shouldIgnore('dist')).toBe(true)
    })

    test('ignores dist/bundle.js', () => {
      expect(shouldIgnore('dist/bundle.js')).toBe(true)
    })

    test('ignores build/', () => {
      expect(shouldIgnore('build')).toBe(true)
    })

    test('ignores build/output.css', () => {
      expect(shouldIgnore('build/output.css')).toBe(true)
    })
  })

  describe('cache directories', () => {
    test('ignores .cache/', () => {
      expect(shouldIgnore('.cache')).toBe(true)
    })

    test('ignores .cache/cached-file', () => {
      expect(shouldIgnore('.cache/cached-file')).toBe(true)
    })
  })

  describe('.amalgam', () => {
    test('ignores .amalgam/', () => {
      expect(shouldIgnore('.amalgam')).toBe(true)
    })

    test('ignores .amalgam/state.json', () => {
      expect(shouldIgnore('.amalgam/state.json')).toBe(true)
    })
  })

  describe('allowed files', () => {
    test('allows src/app.ts', () => {
      expect(shouldIgnore('src/app.ts')).toBe(false)
    })

    test('allows package.json', () => {
      expect(shouldIgnore('package.json')).toBe(false)
    })

    test('allows README.md', () => {
      expect(shouldIgnore('README.md')).toBe(false)
    })

    test('allows src/components/Button.tsx', () => {
      expect(shouldIgnore('src/components/Button.tsx')).toBe(false)
    })

    test('allows .gitignore', () => {
      expect(shouldIgnore('.gitignore')).toBe(false)
    })

    test('allows tsconfig.json', () => {
      expect(shouldIgnore('tsconfig.json')).toBe(false)
    })
  })

  describe('custom patterns', () => {
    test('ignores custom pattern', () => {
      expect(shouldIgnore('custom-ignored.txt', ['custom-ignored.txt'])).toBe(true)
    })

    test('ignores custom glob pattern', () => {
      expect(shouldIgnore('temp/file.txt', ['temp/**'])).toBe(true)
    })

    test('still ignores default patterns with custom ones', () => {
      expect(shouldIgnore('node_modules/foo.js', ['custom/**'])).toBe(true)
    })
  })

  describe('path normalization', () => {
    test('handles leading slash', () => {
      expect(shouldIgnore('/node_modules/foo.js')).toBe(true)
    })

    test('handles relative path', () => {
      expect(shouldIgnore('node_modules/foo.js')).toBe(true)
    })
  })
})

describe('getDefaultIgnorePatterns', () => {
  test('returns array of patterns', () => {
    const patterns = getDefaultIgnorePatterns()
    expect(Array.isArray(patterns)).toBe(true)
    expect(patterns.length).toBeGreaterThan(0)
  })

  test('includes node_modules', () => {
    const patterns = getDefaultIgnorePatterns()
    expect(patterns.some(p => p.includes('node_modules'))).toBe(true)
  })

  test('includes .git', () => {
    const patterns = getDefaultIgnorePatterns()
    expect(patterns.some(p => p.includes('.git'))).toBe(true)
  })

  test('returns a copy (not the original array)', () => {
    const patterns1 = getDefaultIgnorePatterns()
    const patterns2 = getDefaultIgnorePatterns()
    expect(patterns1).not.toBe(patterns2)
  })
})
