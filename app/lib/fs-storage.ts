import { verifyPermission } from './fs-api'

const DB_NAME = 'amalgam-fs-storage'
const DB_VERSION = 1
const STORE_NAME = 'workdir-handles'

export interface WorkdirHandle {
  workdirId: string
  handle: FileSystemDirectoryHandle
  lastAccessedAt: number
}

function openDatabase(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME, { keyPath: 'workdirId' })
      }
    }
  })
}

export async function storeWorkdirHandle(
  workdirId: string,
  handle: FileSystemDirectoryHandle
): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)

    const data: WorkdirHandle = {
      workdirId,
      handle,
      lastAccessedAt: Date.now(),
    }

    const request = store.put(data)
    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

export async function getWorkdirHandle(
  workdirId: string,
  requestPermission = true
): Promise<FileSystemDirectoryHandle | null> {
  const db = await openDatabase()

  const data = await new Promise<WorkdirHandle | undefined>((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.get(workdirId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result)

    transaction.oncomplete = () => db.close()
  })

  if (!data) {
    return null
  }

  const hasPermission = await verifyPermission(data.handle, requestPermission)
  if (!hasPermission) {
    return null
  }

  await updateLastAccessedAt(workdirId)

  return data.handle
}

export async function removeWorkdirHandle(workdirId: string): Promise<void> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readwrite')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.delete(workdirId)

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve()

    transaction.oncomplete = () => db.close()
  })
}

export async function getAllWorkdirHandles(): Promise<WorkdirHandle[]> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.getAll()

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result || [])

    transaction.oncomplete = () => db.close()
  })
}

async function updateLastAccessedAt(workdirId: string): Promise<void> {
  const db = await openDatabase()

  const transaction = db.transaction(STORE_NAME, 'readwrite')
  const store = transaction.objectStore(STORE_NAME)

  return new Promise((resolve, reject) => {
    const getRequest = store.get(workdirId)

    getRequest.onerror = () => reject(getRequest.error)
    getRequest.onsuccess = () => {
      const data = getRequest.result as WorkdirHandle | undefined
      if (data) {
        data.lastAccessedAt = Date.now()
        const putRequest = store.put(data)
        putRequest.onerror = () => reject(putRequest.error)
        putRequest.onsuccess = () => resolve()
      } else {
        resolve()
      }
    }

    transaction.oncomplete = () => db.close()
  })
}

export async function hasStoredHandle(workdirId: string): Promise<boolean> {
  const db = await openDatabase()

  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, 'readonly')
    const store = transaction.objectStore(STORE_NAME)
    const request = store.count(IDBKeyRange.only(workdirId))

    request.onerror = () => reject(request.error)
    request.onsuccess = () => resolve(request.result > 0)

    transaction.oncomplete = () => db.close()
  })
}
