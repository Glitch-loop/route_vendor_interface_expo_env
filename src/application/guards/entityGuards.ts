import { Route } from '@/src/core/entities/Route';
import { Product } from '@/src/core/entities/Product';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { ProductInventory } from '@/src/core/entities/ProductInventory';
import { DayOperation } from '@/src/core/entities/DayOperation';

import { RouteTransactionDescription } from '@/src/core/object-values/RouteTransactionDescription';

export function isRoute(entity: any): entity is Route {
        return (
            entity instanceof Route || 
            (
                'id_route' in entity &&
                'route_name' in entity &&
                'description' in entity &&
                'route_status' in entity &&
                'id_vendor' in entity &&
                'route_day' in entity
            )
        );
    }

export function isProduct(entity: any): entity is Product {
        return (
            entity instanceof Product || 
            (
                'id_product' in entity &&
                'product_name' in entity &&
                'barcode' in entity &&
                'weight' in entity &&
                'unit' in entity &&
                'comission' in entity &&
                'price' in entity &&
                'product_status' in entity &&
                'order_to_show' in entity
            )
        );
    }

export function isInventoryOperation(entity: any): entity is InventoryOperation {
        return (
            entity instanceof InventoryOperation || 
            (
                'id_inventory_operation' in entity &&
                'sign_confirmation' in entity &&
                'date' in entity &&
                'state' in entity &&
                'audit' in entity &&
                'id_inventory_operation_type' in entity &&
                'id_work_day' in entity &&
                'inventory_operation_descriptions' in entity
            )
        );
    }

export function isTransaction(entity: any): entity is RouteTransaction {
        return (
            entity instanceof RouteTransaction || 
            (
                'id_route_transaction' in entity &&
                'date' in entity &&
                'state' in entity &&
                'cash_received' in entity &&
                'id_work_day' in entity &&
                'id_store' in entity &&
                'payment_method' in entity &&
                'transaction_description' in entity
            )
        );
    }

export function isTransactionDescription(entity: any): entity is RouteTransactionDescription {
        return (
            entity instanceof RouteTransactionDescription || 
            (
                'id_route_transaction_description' in entity &&
                'price_at_moment' in entity &&
                'amount' in entity &&
                'created_at' in entity &&
                'id_product_inventory' in entity &&
                'id_transaction_operation_type' in entity &&
                'id_product' in entity &&
                'id_route_transaction' in entity
            )
        );
    }

export function isStore(entity: any): entity is Store {
    return (
        entity instanceof Store || 
        (
            'id_store' in entity &&
            'street' in entity &&
            'ext_number' in entity &&
            'colony' in entity &&
            'postal_code' in entity &&
            'address_reference' in entity &&
            'store_name' in entity &&
            'owner_name' in entity &&
            'cellphone' in entity &&
            'latitude' in entity &&
            'longitude' in entity &&
            'id_creator' in entity &&
            'creation_date' in entity &&
            'creation_context' in entity &&
            'status_store' in entity
        )
    );
    }

export function isWorkDay(entity: any): entity is WorkDayInformation {
    return (
        entity instanceof WorkDayInformation || 
        (
            'id_work_day' in entity &&
            'start_date' in entity &&
            'finish_date' in entity &&
            'start_petty_cash' in entity &&
            'final_petty_cash' in entity &&
            'id_route' in entity &&
            'route_name' in entity &&
            'description' in entity &&
            'route_status' in entity &&
            'id_day' in entity &&
            'id_route_day' in entity
        )
    );
    }

export function isProductInventory(entity: any): entity is ProductInventory {
    return (
        entity instanceof ProductInventory ||
        (
            typeof entity?.get_stock_of_product === 'function' &&
            typeof entity?.get_price_of_product === 'function' &&
            typeof entity?.get_value_of_product === 'function'
        )
    );
}

export function isDayOperation(entity: any): entity is DayOperation {
    return (
        entity instanceof DayOperation ||
        ('id_day_operation' in entity && 'id_item' in entity && 'operation_type' in entity && 'created_at' in entity)
    );
}