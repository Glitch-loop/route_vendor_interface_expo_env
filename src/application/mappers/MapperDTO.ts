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
import ProductDTO from '@/src/application/dto/ProductDTO';
import StoreDTO from '@/src/application/dto/StoreDTO';
import InventoryOperationDTO from '@/src/application/dto/InventoryOperationDTO';
import InventoryOperationDescriptionDTO from '@/src/application/dto/InventoryOperationDescriptionDTO';
import WorkDayInformationDTO  from '@/src/application/dto/WorkdayInformationDTO';
import { InventoryOperationDescription } from '@/src/core/object-values/InventoryOperationDescription';
import { RouteDay } from '@/src/core/object-values/RouteDay';
import { RouteDayStore } from '@/src/core/object-values/RouteDayStore';

// dto guards
import { 
    isProductDTO,
    isInventoryOperationDTO,
    isWorkDayDTO,
    isRouteDTO,
    isRouteDayDTO
 } from '@/src/application/guards/dtoGuards';

// entity guard
import {
    isRoute,
    isProduct,
    isInventoryOperation,
    isTransaction,
    isStore,
    isWorkDay
} from '@/src/application/guards/entityGuards';

// Object values
// import { RouteDayStores } from '@/src/core/object-values/RouteDayStores';

export class MapperDTO {
  
    constructor() {}

  // Method overloads for type safety
    toDTO(entity: Route): RouteDTO;
    toDTO(entity: Product): ProductDTO;
    toDTO(entity: Store): StoreDTO;
    toDTO(entity: InventoryOperation): InventoryOperationDTO;
    toDTO(entity: WorkDayInformation): WorkDayInformationDTO;
//   toDTO(entity: RouteTransaction): RouteTransactionDTO;
//   toDTO(entity: Store): StoreDTO;
//   toDTO(entity: WorkDayInformation): WorkDayDTO;
//   toDTO(entity: Route | RouteTransaction | Store | Product | WorkDayInformation | InventoryOperation): any {
        toDTO(entity: Route | Product | Store | InventoryOperation | WorkDayInformation): any {
        // Route
        if (isRoute(entity)) {
            return this.routeToDTO(entity);
        }
        
        // Product
        if (isProduct(entity)) {
          return this.productToDTO(entity);
        }

                // Store
                if (isStore(entity)) {
                    return this.storeToDTO(entity);
                }

        // InventoryOperation
        if (isInventoryOperation(entity)) {
          return this.inventoryOperationToDTO(entity);
        }

        // WorkDayInformation
        if (isWorkDay(entity)) {
            return this.workDayToDTO(entity);
        }
        // RouteTransaction
        // if (this.isTransaction(entity)) {
        //   return this.transactionToDTO(entity);
        // }
        
        



        // // WorkDayInformation
        // if (this.isWorkDay(entity)) {
        //   return this.workDayToDTO(entity);
        // }



          throw new Error('Unknown entity type');
  }

    // Unified DTO -> Entity mapping

    toEntity(dto: ProductDTO): Product;
    toEntity(dto: InventoryOperationDTO): InventoryOperation;
    toEntity(dto: WorkDayInformationDTO): WorkDayInformation;
    toEntity(dto: RouteDTO): Route;
    toEntity(dto: RouteDayDTO): RouteDay;
    toEntity(dto: ProductDTO | InventoryOperationDTO | WorkDayInformationDTO | RouteDTO | RouteDayDTO): Product | InventoryOperation | WorkDayInformation | Route | RouteDay {
        if (isProductDTO(dto)) return this.productDTOToEntity(dto);
        if (isInventoryOperationDTO(dto)) return this.inventoryOperationDTOToEntity(dto);
        if (isWorkDayDTO(dto)) return this.workDayDTOToEntity(dto);
        if (isRouteDTO(dto)) return this.routeDTOToEntity(dto);
        if (isRouteDayDTO(dto)) return this.routeDayDTOToEntity(dto);
        
        throw new Error('Unknown DTO type');
    }


  // ==================== ENTITY TYPE GUARDS ====================


    // ==================== MAPPER METHODS ENTITY to DTO ====================

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

    private productToDTO(entity: Product): ProductDTO {
        return {
            id_product: entity.id_product,
            product_name: entity.product_name,
            barcode: entity.barcode || '',
            weight: entity.weight || '',
            unit: entity.unit || '',
            comission: entity.comission,
            price: entity.price,
            product_status: entity.product_status,
            order_to_show: entity.order_to_show,
        };
    }

    private storeToDTO(entity: Store): StoreDTO {
        return {
            id_store: entity.id_store,
            street: entity.street,
            ext_number: entity.ext_number,
            colony: entity.colony,
            postal_code: entity.postal_code,
            address_reference: entity.address_reference,
            store_name: entity.store_name,
            latitude: entity.latitude,
            longitude: entity.longitude,
            creation_date: entity.creation_date,
            status_store: entity.status_store,
        };
    }

    private inventoryOperationToDTO(entity: InventoryOperation): InventoryOperationDTO {
        return {
            id_inventory_operation: entity.id_inventory_operation,
            sign_confirmation: entity.sign_confirmation,
            date: entity.date.toISOString(),
            state: entity.state,
            audit: entity.audit,
            id_inventory_operation_type: entity.id_inventory_operation_type,
            id_work_day: entity.id_work_day,
            inventory_operation_descriptions: entity.inventory_operation_descriptions.map((desc) => this.inventoryProductDescriptionToDTO(desc)),
        };
    }

    private workDayToDTO(entity: WorkDayInformation): WorkDayInformationDTO {
        return {
            id_work_day: entity.id_work_day,
            start_date: entity.start_date,
            finish_date: entity.finish_date,
            start_petty_cash: entity.start_petty_cash,
            final_petty_cash: entity.final_petty_cash,
            id_route: entity.id_route,
            route_name: entity.route_name,
            description: entity.description,
            route_status: entity.route_status,
            id_day: entity.id_day,
            id_route_day: entity.id_route_day,
        };
    }


    // ==================== DTO TYPE GUARDS ====================

 
    // ==================== MAPPER METHODS DTO to ENTITY ====================

    // ProductDTO -> Product (domain)
    productDTOToEntity(dto: ProductDTO): Product {
        return new Product(
            dto.id_product,
            dto.product_name,
            dto.barcode ?? null,
            dto.weight ?? null,
            dto.unit ?? null,
            dto.comission,
            dto.price,
            dto.product_status,
            dto.order_to_show
        );
    }

    // InventoryOperationDescriptionDTO -> InventoryOperationDescription (domain)
    private inventoryProductDescriptionDTOToEntity(dto: InventoryOperationDescriptionDTO): InventoryOperationDescription {
        return new InventoryOperationDescription(
            dto.id_product_operation_description,
            dto.price_at_moment,
            dto.amount,
            new Date(),
            dto.id_inventory_operation,
            dto.id_product
        );
    }

    // InventoryOperationDTO -> InventoryOperation (domain)
    inventoryOperationDTOToEntity(dto: InventoryOperationDTO): InventoryOperation {
        return new InventoryOperation(
            dto.id_inventory_operation,
            dto.sign_confirmation,
            new Date(dto.date),
            dto.state,
            dto.audit,
            dto.id_inventory_operation_type,
            dto.id_work_day,
            (dto.inventory_operation_descriptions || []).map(d => this.inventoryProductDescriptionDTOToEntity(d))
        );
    }

    // WorkDayInformationDTO -> WorkDayInformation (domain)
    workDayDTOToEntity(dto: WorkDayInformationDTO): WorkDayInformation {
        const start = dto.start_date instanceof Date ? dto.start_date : new Date(dto.start_date);
        const finish = dto.finish_date === null ? null : (dto.finish_date instanceof Date ? dto.finish_date : new Date(dto.finish_date));
        return new WorkDayInformation(
            dto.id_work_day,
            start,
            finish,
            dto.start_petty_cash,
            dto.final_petty_cash ?? null,
            dto.id_route,
            dto.route_name,
            dto.description,
            dto.route_status,
            dto.id_day,
            dto.id_route_day,
        );
    }

    // RouteDTO -> Route (domain)
    routeDTOToEntity(dto: RouteDTO): Route {
        const routeDays: RouteDay[] = [];
        // dto.route_day_by_day is Map<string, RouteDayDTO>
        dto.route_day_by_day.forEach((rd) => {
            const stores: RouteDayStore[] = (rd.stores || []).map(s =>
                new RouteDayStore(
                    s.id_route_day_store,
                    s.position_in_route,
                    s.id_route_day,
                    s.id_store
                )
            );
            routeDays.push(
                new RouteDay(
                    rd.id_route_day,
                    rd.id_route,
                    rd.id_day,
                    stores
                )
            );
        });
        return new Route(
            dto.id_route,
            dto.route_name,
            dto.description,
            dto.route_status,
            dto.id_vendor,
            routeDays
        );
    }

    // RouteDayDTO -> RouteDay (domain)
    routeDayDTOToEntity(dto: RouteDayDTO): RouteDay {
        const stores: RouteDayStore[] = (dto.stores || []).map(s =>
            new RouteDayStore(
                s.id_route_day_store,
                s.position_in_route,
                s.id_route_day,
                s.id_store
            )
        );
        return new RouteDay(
            dto.id_route_day,
            dto.id_route,
            dto.id_day,
            stores
        );
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

    // InventoryOperationDescription (domain) -> InventoryOperationDescriptionDTO (UI)
    private inventoryProductDescriptionToDTO(desc: InventoryOperationDescription): InventoryOperationDescriptionDTO {
        return {
            id_product_operation_description: desc.id_inventory_operation_description,
            price_at_moment: desc.price_at_moment,
            amount: desc.amount,
            id_inventory_operation: desc.id_inventory_operation,
            id_product: desc.id_product,
        };
    }

}