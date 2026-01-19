import type { FileManifest } from './sync'

declare global {
  interface Window {
    showDirectoryPicker(options?: {
      id?: string
      mode?: 'read' | 'readwrite'
      startIn?: FileSystemHandle | 'desktop' | 'documents' | 'downloads' | 'music' | 'pictures' | 'videos'
    }): Promise<FileSystemDirectoryHandle>
  }

  interface FileSystemHandle {
    queryPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
    requestPermission(descriptor?: { mode?: 'read' | 'readwrite' }): Promise<PermissionState>
  }

  interface FileSystemDirectoryHandle {
    values(): AsyncIterableIterator<FileSystemHandle>
  }
}

export function isFileSystemApiSupported(): boolean {
  return 'showDirectoryPicker' in window
}

export async function selectDirectory(): Promise<FileSystemDirectoryHandle> {
  if (!isFileSystemApiSupported()) {
    throw new Error('File System Access API is not supported in this browser')
  }

  try {
    const handle = await window.showDirectoryPicker({
      mode: 'readwrite',
    })
    return handle
  } catch (error) {
    if (error instanceof Error && error.name === 'AbortError') {
      throw new Error('Directory selection was cancelled')
    }
    throw error
  }
}

export async function verifyPermission(
  handle: FileSystemDirectoryHandle,
  requestIfNeeded = true
): Promise<boolean> {
  const options = { mode: 'readwrite' as const }

  if ((await handle.queryPermission(options)) === 'granted') {
    return true
  }

  if (requestIfNeeded) {
    return (await handle.requestPermission(options)) === 'granted'
  }

  return false
}

export async function readDirectoryRecursive(
  handle: FileSystemDirectoryHandle,
  shouldIgnore: (path: string) => boolean = () => false,
  basePath = ''
): Promise<FileManifest[]> {
  const manifests: FileManifest[] = []

  for await (const entry of handle.values()) {
    const relativePath = basePath ? `${basePath}/${entry.name}` : entry.name

    if (shouldIgnore(relativePath)) {
      continue
    }

    if (entry.kind === 'file') {
      const fileHandle = entry as FileSystemFileHandle
      try {
        const file = await fileHandle.getFile()
        manifests.push({
          path: relativePath,
          size: file.size,
          mtime: file.lastModified,
        })
      } catch {
        console.warn(`Could not read file: ${relativePath}`)
      }
    } else if (entry.kind === 'directory') {
      const dirHandle = entry as FileSystemDirectoryHandle
      const subManifests = await readDirectoryRecursive(
        dirHandle,
        shouldIgnore,
        relativePath
      )
      manifests.push(...subManifests)
    }
  }

  return manifests
}

export async function readFile(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<Blob> {
  const parts = path.split('/')
  const fileName = parts.pop()

  if (!fileName) {
    throw new Error('Invalid path: empty file name')
  }

  let currentDir = handle
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part)
  }

  const fileHandle = await currentDir.getFileHandle(fileName)
  const file = await fileHandle.getFile()
  return file
}

export async function writeFile(
  handle: FileSystemDirectoryHandle,
  path: string,
  content: Blob | ArrayBuffer | string
): Promise<void> {
  const parts = path.split('/')
  const fileName = parts.pop()

  if (!fileName) {
    throw new Error('Invalid path: empty file name')
  }

  let currentDir = handle
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part, { create: true })
  }

  const fileHandle = await currentDir.getFileHandle(fileName, { create: true })
  const writable = await fileHandle.createWritable()

  try {
    if (typeof content === 'string') {
      await writable.write(content)
    } else if (content instanceof ArrayBuffer) {
      await writable.write(new Blob([content]))
    } else {
      await writable.write(content)
    }
  } finally {
    await writable.close()
  }
}

export async function deleteFile(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<void> {
  const parts = path.split('/')
  const fileName = parts.pop()

  if (!fileName) {
    throw new Error('Invalid path: empty file name')
  }

  let currentDir = handle
  for (const part of parts) {
    currentDir = await currentDir.getDirectoryHandle(part)
  }

  await currentDir.removeEntry(fileName)
}

export async function deleteDirectory(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<void> {
  const parts = path.split('/')
  const dirName = parts.pop()

  if (!dirName) {
    throw new Error('Invalid path: empty directory name')
  }

  let parentDir = handle
  for (const part of parts) {
    parentDir = await parentDir.getDirectoryHandle(part)
  }

  await parentDir.removeEntry(dirName, { recursive: true })
}

export async function pathExists(
  handle: FileSystemDirectoryHandle,
  path: string
): Promise<{ exists: boolean; kind: 'file' | 'directory' | null }> {
  const parts = path.split('/')
  const name = parts.pop()

  if (!name) {
    return { exists: true, kind: 'directory' }
  }

  try {
    let currentDir = handle
    for (const part of parts) {
      currentDir = await currentDir.getDirectoryHandle(part)
    }

    try {
      await currentDir.getFileHandle(name)
      return { exists: true, kind: 'file' }
    } catch {
      try {
        await currentDir.getDirectoryHandle(name)
        return { exists: true, kind: 'directory' }
      } catch {
        return { exists: false, kind: null }
      }
    }
  } catch {
    return { exists: false, kind: null }
  }
}
