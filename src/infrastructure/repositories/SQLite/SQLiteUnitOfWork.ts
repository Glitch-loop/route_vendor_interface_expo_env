// Libraries
import { inject, injectable } from "tsyringe";
import { SQLiteDatabase } from "expo-sqlite";

// Interfaces
import { IUnitOfWork, IUnitOfWorkRepositories } from "@/src/core/interfaces/IUnitOfWork";


// DataSources
import { SQLiteDataSource } from '@/src/infrastructure/datasources/SQLiteDataSource';

// Container
import { TOKENS } from '@/src/infrastructure/di/tokens';

// Repositories
import { SQLiteDayOperationRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteDayOperationRepository";
import { SQLiteInventoryOperationRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteInventoryOperationRepository";
import { SQLiteProductInventoryRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteProductInventoryRepository";
import { SQLiteProductRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteProductRepository";
import { SQLiteRouteTransactionRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteRouteTransactionRepository";
import { SQLiteShiftOrganizationRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteShiftOrganizationRepository";
import { SQLiteStoreRepository } from "@/src/infrastructure/repositories/SQLite/SQLiteStoreRepository";

@injectable()
export class SQLiteUnitOfWork implements IUnitOfWork {
  constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {
  }

  async execute<T>(work: (repos: IUnitOfWorkRepositories) => Promise<T>): Promise<T> {
    await this.dataSource.initialize();
    const db: SQLiteDatabase = await this.dataSource.getClient();
    
    let result: T;

    await db.withExclusiveTransactionAsync(async (txn) => {
      const repos: IUnitOfWorkRepositories = {
        get dayOperationRepository() {
          return new SQLiteDayOperationRepository(txn);
        },
        get inventoryOperationRepository() {
          return new SQLiteInventoryOperationRepository(txn);
        },
        get productInventoryRepository() {
          return new SQLiteProductInventoryRepository(txn);
        },
        get productRepository() {
          return new SQLiteProductRepository(txn);
        },
        get routeTransactionRepository() {
          return new SQLiteRouteTransactionRepository(txn);
        },
        get shiftOrganizationRepository() {
          return new SQLiteShiftOrganizationRepository(txn);
        },
        get storeRepository() {
          return new SQLiteStoreRepository(txn);
        },
      }

      result = await work(repos);
    });
    
    return result!
  }
}
