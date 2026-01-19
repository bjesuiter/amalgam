export interface FileManifest {
  path: string
  size: number
  mtime: number
}

export interface ConflictInfo {
  path: string
  local: FileManifest
  remote: FileManifest
}

export interface SyncDiff {
  newFiles: FileManifest[]
  changedFiles: FileManifest[]
  unchangedFiles: FileManifest[]
  deletedFiles: FileManifest[]
  conflicts: ConflictInfo[]
}

export function computeDiff(
  local: FileManifest[],
  remote: FileManifest[],
  lastSyncedAt?: Date
): SyncDiff {
  const localMap = new Map(local.map(f => [f.path, f]))
  const remoteMap = new Map(remote.map(f => [f.path, f]))
  
  const newFiles: FileManifest[] = []
  const changedFiles: FileManifest[] = []
  const unchangedFiles: FileManifest[] = []
  const deletedFiles: FileManifest[] = []
  const conflicts: ConflictInfo[] = []
  
  const lastSyncTime = lastSyncedAt?.getTime() ?? 0
  
  for (const localFile of local) {
    const remoteFile = remoteMap.get(localFile.path)
    
    if (!remoteFile) {
      newFiles.push(localFile)
    } else if (localFile.size === remoteFile.size && localFile.mtime === remoteFile.mtime) {
      unchangedFiles.push(localFile)
    } else {
      const localModifiedAfterSync = localFile.mtime > lastSyncTime
      const remoteModifiedAfterSync = remoteFile.mtime > lastSyncTime
      
      if (lastSyncTime > 0 && localModifiedAfterSync && remoteModifiedAfterSync) {
        conflicts.push({
          path: localFile.path,
          local: localFile,
          remote: remoteFile,
        })
      } else {
        changedFiles.push(localFile)
      }
    }
  }
  
  for (const remoteFile of remote) {
    if (!localMap.has(remoteFile.path)) {
      deletedFiles.push(remoteFile)
    }
  }
  
  return {
    newFiles,
    changedFiles,
    unchangedFiles,
    deletedFiles,
    conflicts,
  }
}
