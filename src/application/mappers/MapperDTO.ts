// src/application/mappers/mapperDTO.ts
import { Route } from '@/src/core/entities/Route';
import { RouteTransaction } from '@/src/core/entities/RouteTransaction';
import { Store } from '@/src/core/entities/Store';
import { Product } from '@/src/core/entities/Product';
import { WorkDayInformation } from '@/src/core/entities/WorkDayInformation';
import { InventoryOperation } from '@/src/core/entities/InventoryOperation';

// DTOs
// import { 
//   RouteDTO, 
//   RouteTransactionDTO, 
//   StoreDTO,
//   ProductDTO,
//   WorkDayDTO,
//   InventoryOperationDTO
// } from '@/src/application/dto';
import RouteDTO from '@/src/application/dto/RouteDTO';
import RouteDayDTO from '@/src/application/dto/RouteDayDTO';
import RouteDayStoreDTO from '@/src/application/dto/RouteDayStoreDTO';

// Object values
// import { RouteDayStores } from '@/src/core/object-values/RouteDayStores';

export class MapperDTO {
  
    constructor() {}

  // Method overloads for type safety
    toDTO(entity: Route): RouteDTO;
//   toDTO(entity: RouteTransaction): RouteTransactionDTO;
//   toDTO(entity: Store): StoreDTO;
//   toDTO(entity: Product): ProductDTO;
//   toDTO(entity: WorkDayInformation): WorkDayDTO;
//   toDTO(entity: InventoryOperation): InventoryOperationDTO;
//   toDTO(entity: Route | RouteTransaction | Store | Product | WorkDayInformation | InventoryOperation): any {
    toDTO(entity: Route): any {
        
        console.log("DTO Route*******************************")
        console.log(entity)
        // Route
        if (this.isRoute(entity)) {
            return this.routeToDTO(entity);
        }
        
        // RouteTransaction
        // if (this.isTransaction(entity)) {
        //   return this.transactionToDTO(entity);
        // }
        
        // // Store
        // if (this.isStore(entity)) {
        //   return this.storeToDTO(entity);
        // }

        // // Product
        // if (this.isProduct(entity)) {
        //   return this.productToDTO(entity);
        // }

        // // WorkDayInformation
        // if (this.isWorkDay(entity)) {
        //   return this.workDayToDTO(entity);
        // }

        // // InventoryOperation
        // if (this.isInventoryOperation(entity)) {
        //   return this.inventoryOperationToDTO(entity);
        // }

        throw new Error(`Unknown entity type: ${entity?.constructor?.name || 'undefined'}`);
  }

  // Array mapping helper
//   T extends Route | RouteTransaction | Store | Product | WorkDayInformation | InventoryOperation
  toDTOArray<T extends Route>(
    entities: T[]
  ): any[] {
    return entities.map(entity => this.toDTO(entity));
  }

  // ==================== TYPE GUARDS ====================
  
  private isRoute(entity: any): entity is Route {
    console.log("Guard for entity")
    console.log(entity['id_route'])
    console.log(entity['route_name'])
    console.log(entity['route_day'])
    return (
      entity instanceof Route || 
      ('id_route' in entity && 'route_name' in entity && 'route_day' in entity)
    );
  }

  private isTransaction(entity: any): entity is RouteTransaction {
    return (
      entity instanceof RouteTransaction || 
      ('id_route_transaction' in entity && 'transaction_description' in entity)
    );
  }

  private isStore(entity: any): entity is Store {
    return (
      entity instanceof Store || 
      ('id_store' in entity && 'store_name' in entity)
    );
  }

  private isProduct(entity: any): entity is Product {
    return (
      entity instanceof Product || 
      ('id_product' in entity && 'product_name' in entity && 'price' in entity)
    );
  }

  private isWorkDay(entity: any): entity is WorkDayInformation {
    return (
      entity instanceof WorkDayInformation || 
      ('id_work_day' in entity && 'start_date' in entity && 'id_route' in entity)
    );
  }

  private isInventoryOperation(entity: any): entity is InventoryOperation {
    return (
      entity instanceof InventoryOperation || 
      ('id_inventory_operation' in entity && 'inventoryOperationDescriptions' in entity)
    );
  }

  // ==================== MAPPER METHODS ====================

  private routeToDTO(entity: Route): RouteDTO {
    const routeDayMap = new Map<string, RouteDayDTO>(); // <id_day, RouteDayDTO>
    
    const { route_day } = entity;
    
    // Organizing route days and their stores by day id
    for (const routeDay of route_day) {
        const routeDayStoreDTOs: RouteDayStoreDTO[] = [];
        const { stores } = routeDay;

        for (const store of stores) {
            const storeDTO: RouteDayStoreDTO = {
                id_route_day_store: store.id_route_day_store,
                position_in_route: store.position_in_route,
                id_route_day: store.id_route_day,
                id_store: store.id_store
            };
            routeDayStoreDTOs.push(storeDTO);
        }

        routeDayMap.set(
            routeDay.id_day, 
            {
                id_route_day: routeDay.id_route_day,
                id_route: routeDay.id_route,
                id_day: routeDay.id_day,
                stores: routeDayStoreDTOs
            }
        )
    }

    const routeDTO: RouteDTO = {
        id_route: entity.id_route,
        route_name:  entity.route_name,
        description: entity.description,
        route_status: entity.route_status,
        id_vendor: entity.id_vendor,
        route_day_by_day: routeDayMap
    }


    return routeDTO;
  }

//   private transactionToDTO(entity: RouteTransaction): RouteTransactionDTO {
//     return {
//       id: entity.id_route_transaction,
//       date: entity.date.toLocaleDateString('es-MX'),
//       dateISO: entity.date.toISOString(),
//       state: entity.state,
//       cashReceived: entity.cash_received,
//       total: entity.get_transaction_grand_total(),
//       totalFormatted: `$${entity.get_transaction_grand_total().toFixed(2)}`,
//       itemCount: entity.transaction_description.length,
//       paymentMethod: {
//         id: entity.payment_method.id_payment_method,
//         name: entity.payment_method.payment_method_name,
//       },
//       items: entity.transaction_description.map(desc => ({
//         id: desc.id_route_transaction_description,
//         productId: desc.id_product,
//         price: desc.price_at_moment,
//         commission: desc.comission_at_moment,
//         amount: desc.amount,
//         subtotal: desc.price_at_moment * desc.amount,
//         operationType: desc.id_transaction_operation_type,
//       })),
//     };
//   }

//   private storeToDTO(entity: Store): StoreDTO {
//     return {
//       id: entity.id_store,
//       name: entity.store_name || 'Sin nombre',
//       ownerName: entity.owner_name || 'Sin información',
//       address: this.formatAddress(entity),
//       fullAddress: `${entity.street} ${entity.ext_number}, ${entity.colony}, CP ${entity.postal_code}`,
//       reference: entity.address_reference || '',
//       phone: entity.cellphone || '',
//       coordinates: {
//         latitude: parseFloat(entity.latitude) || 0,
//         longitude: parseFloat(entity.longitude) || 0,
//       },
//       status: entity.status_store,
//       createdBy: entity.id_creator,
//       createdAt: entity.creation_date,
//     };
//   }

//   private productToDTO(entity: Product): ProductDTO {
//     return {
//       id: entity.id_product,
//       name: entity.product_name,
//       barcode: entity.barcode || '',
//       weight: entity.weight || '',
//       unit: entity.unit || '',
//       commission: entity.comission,
//       price: entity.price,
//       priceFormatted: `$${entity.price.toFixed(2)}`,
//       status: entity.product_status,
//       order: entity.order_to_show,
//     };
//   }

//   private workDayToDTO(entity: WorkDayInformation): WorkDayDTO {
//     return {
//       id: entity.id_work_day,
//       startDate: entity.start_date.toISOString(),
//       startDateFormatted: entity.start_date.toLocaleDateString('es-MX'),
//       endDate: entity.finish_date?.toISOString() || null,
//       endDateFormatted: entity.finish_date?.toLocaleDateString('es-MX') || null,
//       startPettyCash: entity.start_petty_cash,
//       finalPettyCash: entity.final_petty_cash || 0,
//       routeId: entity.id_route,
//       routeName: entity.route_name,
//       description: entity.description,
//       routeStatus: entity.route_status,
//       dayId: entity.id_day,
//       isActive: entity.finish_date === null,
//     };
//   }

//   private inventoryOperationToDTO(entity: InventoryOperation): InventoryOperationDTO {
//     return {
//       id: entity.id_inventory_operation,
//       date: entity.date.toISOString(),
//       dateFormatted: entity.date.toLocaleDateString('es-MX'),
//       state: entity.state,
//       audit: entity.audit,
//       operationType: entity.id_inventory_operation_type,
//       workDayId: entity.id_work_day,
//       itemCount: entity.inventoryOperationDescriptions.length,
//       items: entity.inventoryOperationDescriptions.map(desc => ({
//         id: desc.id_inventory_operation_description,
//         productId: desc.id_product,
//         price: desc.price_at_moment,
//         amount: desc.amount,
//         total: desc.price_at_moment * desc.amount,
//         createdAt: desc.created_at.toISOString(),
//       })),
//     };
//   }

  // ==================== HELPER METHODS ====================

  private formatAddress(store: Store): string {
    return `${store.street} ${store.ext_number}, ${store.colony}`;
  }

}