import { openDB, type IDBPDatabase } from "idb";

interface QueuedDelivery {
  clientEventId: string;
  inningsId: string;
  payload: Record<string, unknown>;
  synced: boolean;
}

const DB_NAME = "cricket-score";
const STORE = "deliveries";

async function db(): Promise<IDBPDatabase> {
  return openDB(DB_NAME, 1, {
    upgrade(database) {
      database.createObjectStore(STORE, { keyPath: "clientEventId" });
    },
  });
}

export async function enqueueDelivery(item: QueuedDelivery) {
  const database = await db();
  await database.put(STORE, item);
}

export async function getUnsynced(): Promise<QueuedDelivery[]> {
  const database = await db();
  const all = await database.getAll(STORE);
  return all.filter((d) => !d.synced);
}

export async function markSynced(clientEventId: string) {
  const database = await db();
  const item = await database.get(STORE, clientEventId);
  if (item) await database.put(STORE, { ...item, synced: true });
}
