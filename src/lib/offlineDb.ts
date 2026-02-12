/**
 * IndexedDB Offline Engine for BHAEES POS
 * Handles product caching and offline transaction queuing with background sync.
 */

const DB_NAME = 'bhaees-pos';
const DB_VERSION = 1;

interface OfflineTransaction {
  id: string;
  cart: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; total: number }>;
  customer: string;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  paymentMethod: string;
  invoiceNo: string;
  createdAt: string;
  synced: boolean;
}

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains('products')) {
        db.createObjectStore('products', { keyPath: 'id' });
      }
      if (!db.objectStoreNames.contains('transactions')) {
        const txStore = db.createObjectStore('transactions', { keyPath: 'id' });
        txStore.createIndex('synced', 'synced', { unique: false });
      }
      if (!db.objectStoreNames.contains('meta')) {
        db.createObjectStore('meta', { keyPath: 'key' });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Products cache
export async function cacheProducts(products: any[]): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('products', 'readwrite');
  const store = tx.objectStore('products');
  for (const p of products) {
    store.put(p);
  }
  // Save last cache time
  const metaTx = db.transaction('meta', 'readwrite');
  metaTx.objectStore('meta').put({ key: 'lastProductSync', value: Date.now() });
}

export async function getCachedProducts(): Promise<any[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('products', 'readonly');
    const request = tx.objectStore('products').getAll();
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

// Offline transactions
export async function saveOfflineTransaction(transaction: OfflineTransaction): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('transactions', 'readwrite');
  tx.objectStore('transactions').put(transaction);
}

export async function getUnsyncedTransactions(): Promise<OfflineTransaction[]> {
  const db = await openDb();
  return new Promise((resolve, reject) => {
    const tx = db.transaction('transactions', 'readonly');
    const index = tx.objectStore('transactions').index('synced');
    const request = index.getAll(IDBKeyRange.only(0));
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

export async function markTransactionSynced(id: string): Promise<void> {
  const db = await openDb();
  const tx = db.transaction('transactions', 'readwrite');
  const store = tx.objectStore('transactions');
  const request = store.get(id);
  request.onsuccess = () => {
    const data = request.result;
    if (data) {
      data.synced = true;
      store.put(data);
    }
  };
}

export async function getOfflineTransactionCount(): Promise<number> {
  const txs = await getUnsyncedTransactions();
  return txs.length;
}

// Sync engine
export async function syncPendingTransactions(): Promise<number> {
  const pending = await getUnsyncedTransactions();
  let synced = 0;
  for (const tx of pending) {
    try {
      // In a real implementation, this would POST to Supabase
      // For now, we mark as synced after a simulated delay
      await new Promise(r => setTimeout(r, 100));
      await markTransactionSynced(tx.id);
      synced++;
    } catch {
      // Will retry on next sync cycle
      break;
    }
  }
  return synced;
}

// Background sync registration
export function startBackgroundSync(intervalMs = 30000): () => void {
  const id = setInterval(async () => {
    if (navigator.onLine) {
      const count = await syncPendingTransactions();
      if (count > 0) {
        console.log(`[BHAEES Sync] Synced ${count} offline transactions`);
      }
    }
  }, intervalMs);
  return () => clearInterval(id);
}

// Online status hook helper
export function isOnline(): boolean {
  return navigator.onLine;
}
