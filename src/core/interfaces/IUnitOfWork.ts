// Repositories

import { DayOperationRepository } from "@/src/core/interfaces/DayOperationRepository";
import { SyncDayOperationInformationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncDayOperationRepository";
import { InventoryOperationRepository } from "@/src/core/interfaces/InventoryOperationRepository";
import { SyncInventoryOperationRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncInventoryOperationRepository";
import { ProductInventoryRepository } from "@/src/core/interfaces/ProductInventoryRepository";
import { ProductRepository } from "@/src/core/interfaces/ProductRepository";
import { RouteRepository } from "@/src/core/interfaces/RouteRepository";
import { RouteTransactionRepository } from "@/src/core/interfaces/RouteTransactionRepository";
import { ShiftOrganizationRepository } from "@/src/core/interfaces/ShiftOrganizationRepository";
import { StoreRepository } from "@/src/core/interfaces/StoreRepository";
import { SyncRouteTransactionRepository } from "@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository";

export interface IUnitOfWorkRepositories {
  dayOperationRepository: DayOperationRepository&SyncDayOperationInformationRepository;
  inventoryOperationRepository: InventoryOperationRepository&SyncInventoryOperationRepository;
  productInventoryRepository: ProductInventoryRepository;
  productRepository: ProductRepository;
  routeTransactionRepository: RouteTransactionRepository&SyncRouteTransactionRepository;
  shiftOrganizationRepository: ShiftOrganizationRepository;
  storeRepository: StoreRepository;
}

export interface IUnitOfWork {
  execute<T>(
    work: (repos: IUnitOfWorkRepositories) => Promise<T>
  ): Promise<T>;
}