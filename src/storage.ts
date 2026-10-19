import type { Project } from "./types";
const DB = "bikestyler-local-v1";
type Stored = Project & { _revision?: number };
const revisions = new Map<string, number>();
const queues = new Map<string, Promise<void>>();
export class StorageConflictError extends Error {
  constructor() {
    super(
      "Another tab saved this bicycle. Your edits are still here. Save a separate copy or export this project before reopening the other version.",
    );
    this.name = "StorageConflictError";
  }
}
function openDB(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    if (!("indexedDB" in window)) {
      reject(
        new Error(
          "Browser storage is unavailable. Export a project file to keep your work.",
        ),
      );
      return;
    }
    const req = indexedDB.open(DB, 1);
    req.onupgradeneeded = () =>
      req.result.createObjectStore("projects", { keyPath: "id" });
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
    req.onblocked = () =>
      reject(
        new Error("Close other BikeStyler tabs to unlock browser storage."),
      );
  });
}
async function write(project: Project) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite"),
      store = tx.objectStore("projects"),
      read = store.get(project.id);
    let failure: Error | undefined,
      next = 0;
    read.onsuccess = () => {
      const existing = read.result as Stored | undefined,
        actual = existing ? existing._revision || 0 : -1,
        expected = revisions.get(project.id) ?? -1;
      if (actual !== expected) {
        failure = new StorageConflictError();
        tx.abort();
        return;
      }
      next = actual + 1;
      store.put({
        ...project,
        _revision: next,
        updatedAt: new Date().toISOString(),
      });
    };
    tx.oncomplete = () => {
      revisions.set(project.id, next);
      db.close();
      resolve();
    };
    tx.onerror = () => {
      failure =
        tx.error ||
        new Error("Autosave failed. Export your project to keep your work.");
    };
    tx.onabort = () => {
      db.close();
      reject(
        failure ||
          tx.error ||
          new Error(
            "Storage is full or unavailable. Export your project to keep your work.",
          ),
      );
    };
  });
}
export function saveProject(project: Project): Promise<void> {
  const previous = queues.get(project.id) || Promise.resolve(),
    next = previous.catch(() => {}).then(() => write(project));
  queues.set(project.id, next);
  void next
    .finally(() => {
      if (queues.get(project.id) === next) queues.delete(project.id);
    })
    .catch(() => {});
  return next;
}
export async function listProjects(): Promise<Project[]> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly"),
      req = tx.objectStore("projects").getAll();
    req.onsuccess = () =>
      resolve(
        (req.result as Stored[])
          .map((record) => {
            if (!revisions.has(record.id))
              revisions.set(record.id, record._revision || 0);
            const { _revision, ...project } = record;
            return project;
          })
          .sort((a, b) => b.updatedAt.localeCompare(a.updatedAt)),
      );
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
// Only an explicit reopen accepts a newer revision; background listing never authorizes an overwrite.
export async function reloadProject(id: string): Promise<Project> {
  const db = await openDB();
  return new Promise((resolve, reject) => {
    const tx = db.transaction("projects", "readonly"),
      req = tx.objectStore("projects").get(id);
    req.onsuccess = () => {
      const record = req.result as Stored | undefined;
      if (!record) {
        reject(new Error("This bicycle was removed in another tab."));
        return;
      }
      revisions.set(id, record._revision || 0);
      const { _revision, ...project } = record;
      resolve(project);
    };
    req.onerror = () => reject(req.error);
    tx.oncomplete = () => db.close();
  });
}
export async function deleteProject(id: string) {
  const db = await openDB();
  return new Promise<void>((resolve, reject) => {
    const tx = db.transaction("projects", "readwrite"),
      store = tx.objectStore("projects"),
      req = store.get(id);
    let conflict = false;
    req.onsuccess = () => {
      if (req.result && (req.result._revision || 0) !== revisions.get(id)) {
        conflict = true;
        tx.abort();
      } else store.delete(id);
    };
    tx.oncomplete = () => {
      revisions.delete(id);
      db.close();
      resolve();
    };
    tx.onabort = () => {
      db.close();
      reject(conflict ? new StorageConflictError() : tx.error);
    };
    tx.onerror = () => {};
  });
}
