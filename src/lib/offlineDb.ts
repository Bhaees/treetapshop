/**
 * IndexedDB Offline Engine for BHAEES POS
 * Handles product caching and offline transaction queuing with background sync to Supabase.
 */

import { supabase } from '@/integrations/supabase/client';

const DB_NAME = 'bhaees-pos';
const DB_VERSION = 1;

export interface OfflineTransaction {
  id: string;
  cart: Array<{ productId: string; productName: string; quantity: number; unitPrice: number; cost: number; total: number; barcode?: string }>;
  customer: string;
  customerId?: string;
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

// ========== REAL SYNC ENGINE — pushes to Supabase ==========
async function syncOneTransaction(offlineTx: OfflineTransaction): Promise<boolean> {
  try {
    // Insert transaction
    const { data: txData, error: txError } = await supabase
      .from('transactions')
      .insert({
        invoice_no: offlineTx.invoiceNo,
        customer_name: offlineTx.customer,
        customer_id: offlineTx.customerId || null,
        subtotal: offlineTx.subtotal,
        discount: offlineTx.discount,
        vat: offlineTx.tax,
        total: offlineTx.total,
        payment_type: offlineTx.paymentMethod.toLowerCase(),
        status: offlineTx.paymentMethod === 'Credit' ? 'credit' : 'paid',
        created_at: offlineTx.createdAt,
      })
      .select()
      .single();

    if (txError) {
      console.error('[Sync] Transaction insert failed:', txError);
      return false;
    }

    // Insert transaction items
    const items = offlineTx.cart.map((item) => ({
      transaction_id: txData.id,
      product_id: item.productId || null,
      product_name: item.productName,
      quantity: item.quantity,
      unit_price: item.unitPrice,
      cost: item.cost || 0,
      total: item.total,
      barcode: item.barcode || null,
    }));

    const { error: itemsError } = await supabase
      .from('transaction_items')
      .insert(items);

    if (itemsError) {
      console.error('[Sync] Items insert failed:', itemsError);
      return false;
    }

    // Deduct stock for each product
    for (const item of offlineTx.cart) {
      if (item.productId) {
        await supabase.rpc('update_updated_at_column' as never); // no-op, just use direct update
        const { data: product } = await supabase
          .from('products')
          .select('stock')
          .eq('id', item.productId)
          .single();
        if (product) {
          await supabase
            .from('products')
            .update({ stock: Math.max(0, product.stock - item.quantity) })
            .eq('id', item.productId);
        }
      }
    }

    return true;
  } catch (err) {
    console.error('[Sync] Error:', err);
    return false;
  }
}

export async function syncPendingTransactions(): Promise<number> {
  const pending = await getUnsyncedTransactions();
  let synced = 0;
  for (const tx of pending) {
    const ok = await syncOneTransaction(tx);
    if (ok) {
      await markTransactionSynced(tx.id);
      synced++;
    } else {
      break; // retry next cycle
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

export function isOnline(): boolean {
  return navigator.onLine;
}
