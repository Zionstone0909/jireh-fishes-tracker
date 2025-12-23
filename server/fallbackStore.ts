
import fs from 'fs';
import path from 'path';

type RecordType = { id: string; createdAt?: string; [k: string]: any };

const DATA_DIR = path.join(process.cwd(), 'data');
const DATA_FILE = path.join(DATA_DIR, 'fallback-store.json');

const DEFAULT_STORE: Record<string, RecordType[]> = {
  Customers: [],
  Suppliers: [],
  Products: [],
  Sales: [],
  Payroll: [],
  Staff: [],
  Inventory: [],
  Logs: [],
  Users: [],
  SupplierTransactions: [],
  Invitations: [],
  Expenses: [],
  Transactions: []
};

// Ensure data directory exists
if (!fs.existsSync(DATA_DIR)) {
  fs.mkdirSync(DATA_DIR, { recursive: true });
}

function loadStore(): Record<string, RecordType[]> {
  try {
    if (fs.existsSync(DATA_FILE)) {
      const content = fs.readFileSync(DATA_FILE, 'utf-8');
      return { ...DEFAULT_STORE, ...JSON.parse(content) };
    }
  } catch (err) {
    console.error('Error loading fallback store:', err);
  }
  return { ...DEFAULT_STORE };
}

function saveStore(store: Record<string, RecordType[]>) {
  try {
    fs.writeFileSync(DATA_FILE, JSON.stringify(store, null, 2), 'utf-8');
  } catch (err) {
    console.error('Error saving fallback store:', err);
  }
}

let store = loadStore();

function now() { return new Date().toISOString(); }

export default {
  async getAll(table: string) {
    // Reload from disk on every read to ensure latest data is captured
    store = loadStore();
    const list = store[table] || [];
    return list.slice();
  },

  async getById(table: string, id: string) {
    const list = await this.getAll(table);
    return list.find((item: any) => item.id === id || item.token === id);
  },

  async insert(table: string, data: Record<string, any>) {
    // Reload to prevent race conditions
    store = loadStore();
    if (!store[table]) store[table] = [];
    
    const id = data.id || `${table.toLowerCase()}_${Date.now()}`;
    const rec = { ...data, id, createdAt: data.createdAt || now() };
    
    // Newest records at the top for history views
    store[table].unshift(rec);
    saveStore(store);
    return rec;
  },

  async update(table: string, id: string, updates: Record<string, any>) {
    store = loadStore();
    if (!store[table]) return null;
    const idx = store[table].findIndex((item: any) => item.id === id || item.token === id);
    if (idx === -1) return null;
    store[table][idx] = { ...store[table][idx], ...updates, updatedAt: now() };
    saveStore(store);
    return store[table][idx];
  },

  async delete(table: string, id: string) {
    store = loadStore();
    if (!store[table]) return false;
    const originalLength = store[table].length;
    store[table] = store[table].filter((item: any) => item.id !== id && item.token !== id);
    if (store[table].length !== originalLength) {
      saveStore(store);
      return true;
    }
    return false;
  },

  async clear(table?: string) {
    if (table) {
      store[table] = [];
    } else {
      Object.keys(store).forEach(k => store[k] = []);
    }
    saveStore(store);
  }
};
