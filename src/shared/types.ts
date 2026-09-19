export type DocumentType = "DNI" | "RUC";
export type QuotationStatus =
  "DRAFT" | "ISSUED" | "ACCEPTED" | "REJECTED" | "EXPIRED";
export type ReceiptStatus = "DRAFT" | "ISSUED" | "CANCELLED";
export interface Product {
  id: string;
  sku: string;
  name: string;
  description: string;
  price: number;
  stock: number;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface Customer {
  id: string;
  documentType: DocumentType;
  documentNumber: string;
  name: string;
  email?: string;
  phone?: string;
  address?: string;
  active: boolean;
  createdAt: string;
  updatedAt: string;
}
export interface QuotationItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface Quotation {
  id: string;
  number: string;
  customerId: string;
  items: QuotationItem[];
  status: QuotationStatus;
  subtotal: number;
  discount: number;
  tax: number;
  total: number;
  validUntil: string;
  createdAt: string;
  updatedAt: string;
}
export interface ReceiptItem {
  productId: string;
  quantity: number;
  unitPrice: number;
  subtotal: number;
}
export interface Receipt {
  id: string;
  number: string;
  customerId: string;
  quotationId?: string;
  items: ReceiptItem[];
  subtotal: number;
  tax: number;
  total: number;
  status: ReceiptStatus;
  issuedAt?: string;
  createdAt: string;
}
export interface User {
  id: string;
  email: string;
  password: string;
  name: string;
}
