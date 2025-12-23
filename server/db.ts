
/**
 * Mocking a SQL Server connection helper.
 * In a real environment, this would use the 'mssql' library.
 */
// Fix: Casting sql to any to prevent "not callable" errors on parameterized types like VarChar(20)
export const sql: any = {
  NVarChar: 'NVarChar',
  Decimal: (p: number, s: number) => `Decimal(${p},${s})`,
  DateTime: 'DateTime',
  VarChar: (l: number) => `VarChar(${l})`,
  Date: 'Date',
  Int: 'Int'
};

class MockRequest {
  inputs: any = {};
  input(name: string, type: any, value: any) {
    this.inputs[name] = value;
    return this;
  }
  // Fix: Explicitly returning Promise<any> instead of void so that .recordset property access in routes passes type checking
  async query(q: string): Promise<any> {
    // This will trigger the catch block in the routes, 
    // forcing them to use the fallbackStore which we want for this environment.
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
