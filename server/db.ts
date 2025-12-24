
/**
 * Mocking a SQL Server connection helper.
 * In a real environment, this would use the 'mssql' library.
 */

// We define 'sql' as both a value and a namespace to satisfy TypeScript
export namespace sql {
  export type Request = any;
  export type ConnectionPool = any;
}

export const sql: any = {
  NVarChar: 'NVarChar',
  Decimal: (p: number, s: number) => `Decimal(${p},${s})`,
  DateTime: 'DateTime',
  VarChar: (l: number) => `VarChar(${l})`,
  Date: 'Date',
  Int: 'Int',
  Bit: 'Bit'
};

class MockRequest {
  inputs: any = {};
  input(name: string, type: any, value: any) {
    this.inputs[name] = value;
    return this;
  }
  async query(q: string): Promise<any> {
    // This will trigger the catch block in the routes, 
    // forcing them to use the fallbackStore.
    throw new Error("Database connection not configured. Using fallback store.");
  }
}

class MockPool {
  request() {
    return new MockRequest();
  }
}

let pool: MockPool | null = null;

export const getPool = async () => {
  if (!pool) {
    pool = new MockPool();
  }
  return pool;
};
