export type TransactionType = 'income' | 'fixed_bill' | 'flexible_bill' | 'spending';

export interface Transaction {
  id: string;
  date: string;
  merchant: string;
  amount: number;
  type: TransactionType;
  category: string;
}

export enum CategoryEnum {
  Food = 'Food & Dining',
  Housing = 'Housing',
  Utilities = 'Utilities',
  Transportation = 'Transportation',
  Health = 'Health & Fitness',
  PersonalCare = 'Personal Care',
  Entertainment = 'Entertainment',
  Shopping = 'Shopping',
  Pet = 'Pet',
  Income = 'Income',
  Other = 'Other'
}

export const CATEGORIES = Object.values(CategoryEnum);