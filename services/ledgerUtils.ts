// src/services/ledgerUtils.ts

export interface Transaction {
  id: string | number;
  date: string;
  type: 'debit' | 'credit' | 'invoice' | 'payment';
  amount: number;
  description?: string;
}

// Fixes: "Module has no exported member 'calculateBalance'"
export const calculateBalance = (transactions: Transaction[]): number => {
  return transactions.reduce((acc, t) => {
    // Logic: Invoices/Debits increase balance, Payments/Credits decrease it
    if (t.type === 'invoice' || t.type === 'debit') return acc + t.amount;
    if (t.type === 'payment' || t.type === 'credit') return acc - t.amount;
    return acc;
  }, 0);
};

// Fixes: "Module has no exported member 'formatCurrency'"
export const formatCurrency = (amount: number): string => {
  return new Intl.NumberFormat('en-NG', {
    style: 'currency',
    currency: 'NGN',
  }).format(amount);
};

// Fixes: "Cannot find name 'analyzeCustomerData'"
export const analyzeCustomerData = (transactions: Transaction[]): string => {
  if (!transactions || transactions.length === 0) {
    return "No transaction history available.";
  }

  const balance = calculateBalance(transactions);
  const status = balance <= 0 ? "Account Clear" : "Debt Outstanding";

  return `Customer has a ${status}. Current Balance: ${formatCurrency(balance)}`;
};
