export enum CustomerType { REGULAR='REGULAR', VIP='VIP' }
export enum OrderStatus { DRAFT='DRAFT', CONFIRMED='CONFIRMED', PROCESSING='PROCESSING', SHIPPED='SHIPPED', CANCELLED='CANCELLED' }
export enum ShipmentStatus { PENDING='PENDING', PREPARING='PREPARING', SHIPPED='SHIPPED' }
export interface Customer { id:string; name:string; type:CustomerType; active:boolean }
export interface Product { id:string; sku:string; name:string; price:number; active:boolean }
export interface InventoryItem { productId:string; availableStock:number; reservedStock:number }
export interface SalesOrderItem { productId:string; quantity:number; unitPrice:number }
export interface SalesOrder { id:string; customerId:string; items:SalesOrderItem[]; status:OrderStatus; subtotal:number; discount:number; total:number; createdAt:string }
export interface Shipment { id:string; orderId:string; status:ShipmentStatus; shippedAt?:string }
export class DomainError extends Error {}
