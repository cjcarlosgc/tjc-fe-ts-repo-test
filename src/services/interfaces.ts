import type {Customer,Product,InventoryItem,SalesOrder,Shipment} from '../domain/types';
export interface CustomerService{list():Promise<Customer[]>}
export interface ProductService{list():Promise<Product[]>}
export interface InventoryService{list():Promise<InventoryItem[]>;get(id:string):Promise<InventoryItem|undefined>;reserve(id:string,q:number):Promise<void>;release(id:string,q:number):Promise<void>}
export interface OrderService{list():Promise<SalesOrder[]>;get(id:string):Promise<SalesOrder|undefined>;create(customerId:string):Promise<SalesOrder>;addItem(orderId:string,productId:string,q:number):Promise<SalesOrder>;confirm(id:string):Promise<SalesOrder>;process(id:string):Promise<SalesOrder>;cancel(id:string):Promise<SalesOrder>}
