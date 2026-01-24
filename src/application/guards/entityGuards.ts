import { Route } from '@/src/core/entities/Route';
import { Product } from '@/src/core/entities/Product';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { DayOperation } from '@/src/core/entities/DayOperation';

export function isRoute(entity: any): entity is Route {
        return (
            entity instanceof Route || 
            ('id_route' in entity && 'route_name' in entity && 'route_day' in entity)
        );
    }

export function isProduct(entity: any): entity is Product {
        return (
            entity instanceof Product || 
            ('id_product' in entity && 'product_name' in entity && 'price' in entity)
        );
    }

export function isInventoryOperation(entity: any): entity is InventoryOperation {
        return (
            entity instanceof InventoryOperation || 
            ('id_inventory_operation' in entity && 'inventoryOperationDescriptions' in entity)
        );
    }

export function isTransaction(entity: any): entity is RouteTransaction {
        return (
            entity instanceof RouteTransaction || 
            ('id_route_transaction' in entity && 'transaction_description' in entity)
        );
    }

export function isStore(entity: any): entity is Store {
    return (
        entity instanceof Store || 
        ('id_store' in entity && 'store_name' in entity)
    );
    }

export function isWorkDay(entity: any): entity is WorkDayInformation {
    return (
        entity instanceof WorkDayInformation || 
        ('id_work_day' in entity && 'start_date' in entity && 'id_route' in entity)
    );
    }

export function isProductInventory(entity: any): entity is ProductInventory {
    return (
        entity instanceof ProductInventory ||
        (typeof entity?.get_stock_of_product === 'function' && typeof entity?.get_price_of_product === 'function')
    );
}

export function isDayOperation(entity: any): entity is DayOperation {
    return (
        entity instanceof DayOperation ||
        ('id_day_operation' in entity && 'id_item' in entity && 'operation_type' in entity && 'created_at' in entity)
    );
}