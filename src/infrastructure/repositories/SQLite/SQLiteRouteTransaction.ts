// Libraries
import { injectable, inject } from 'tsyringe';
import { SQLiteDatabase } from "expo-sqlite";

// Interfaces
import { RouteTransactionRepository } from "@/src/core/interfaces/RouteTransactionRepository";

// Entities
import { RouteTransaction } from "@/src/core/entities/RouteTransaction";
import { Store } from "@/src/core/entities/Store";

// Value Objects
import { RouteTransactionDescription } from "@/src/core/object-values/RouteTransactionDescription";

// Database
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";

// DataSources
import { SQLiteDataSource } from "@/src/infrastructure/datasources/SQLiteDataSource";

// Models
import RouteTransactionModel from '@/src/infrastructure/persitence/model/RouteTransactionModel';
import RouteTransactionDescriptionModel from '@/src/infrastructure/persitence/model/RouteTransactionDescriptionModel';

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";
import { SyncRouteTransactionRepository } from '@/src/infrastructure/persitence/interface/local-database/SyncRouteTransactionRepository';

@injectable()
export class SQLiteRouteTransactionRepository implements RouteTransactionRepository, SyncRouteTransactionRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

    // private getPaymentMethodFromId(id_payment_method: string): PAYMENT_METHODS {
    //     // Map enum UUIDs to human-readable names

    //     if id_payment_method === PAYMENT_METHODS.CASH {
    //         return PAYMENT_METHODS.CASH;
    //     } 

    //     const paymentMethodMap: { [key: string]: string } = {
    //         [PAYMENT_METHODS.CASH]: 'Efectivo',
    //         [PAYMENT_METHODS.TRANSFER]: 'Transferencia',
    //         [PAYMENT_METHODS.CREDIT_CARD]: 'Tarjeta de crédito',
    //         [PAYMENT_METHODS.DEBIT_CARD]: 'Tarjeta de débito',
    //     };
    //     const name = paymentMethodMap[id_payment_method] ?? 'Desconocido';
    //     return new PaymentMethod(id_payment_method, name);
    // }

    async insertRouteTransaction(route_transaction: RouteTransaction): Promise<void> {
        try {
            await this.dataSource.initialize();

            const {
                id_route_transaction,
                date,
                state,
                cash_received,
                id_work_day,
                id_store,
                payment_method,
                transaction_description
            } = route_transaction;
            

            const db: SQLiteDatabase = await this.dataSource.getClient();

            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} 
                    (id_route_transaction, 
                    date, 
                    state, 
                    cash_received, 
                    id_work_day, 
                    id_payment_method, 
                    id_store) VALUES (?, ?, ?, ?, ?, ?, ?);
                `,
                [
                    id_route_transaction,
                    date.toISOString(),
                    state,
                    cash_received,
                    id_work_day,
                    payment_method,
                    id_store,
                ]);

                for (const description of transaction_description) {
                    const {
                        id_route_transaction_description,
                        price_at_moment,
                        amount,
                        created_at,
                        id_product_inventory,
                        id_transaction_operation_type,
                        id_product,
                        id_route_transaction
                    } = description

                    await tx.runAsync(`INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} 
                        (id_route_transaction_description, 
                        price_at_moment, 
                        amount, 
                        created_at,
                        id_product_inventory,
                        id_transaction_operation_type, 
                        id_product, 
                        id_route_transaction) VALUES (?, ?, ?, ?, ?, ?, ?, ?);
                    `,
                    [
                        id_route_transaction_description,
                        price_at_moment,
                        amount,
                        created_at.toISOString(),
                        id_product_inventory,
                        id_transaction_operation_type,
                        id_product,
                        id_route_transaction
                    ]);
                }
            });
        } catch(error) {
            throw new Error("Failed to insert route transaction: " + error);
        }        
    }

    async updateRouteTransaction(route_transaction: RouteTransaction): Promise<void> {   
        try {
            await this.dataSource.initialize();
            const {
                id_route_transaction,
                date,
                state,
                id_work_day,
                id_store,
                payment_method,
            } = route_transaction;

            const db: SQLiteDatabase = await this.dataSource.getClient();

            await db.withExclusiveTransactionAsync(async (tx) => {
            await tx.runAsync(`UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} SET  
            date = ?, 
            state = ?, 
            id_work_day = ?, 
            id_payment_method = ?, 
            id_store = ?
            WHERE id_route_transaction = ?;
            `,
            [
                date.toISOString(),
                state,
                id_work_day,
                payment_method,
                id_store,
                id_route_transaction,
            ]);
        });
        } catch (error) {
            throw new Error("Failed to update route transaction: " + error);
        }
    }

    async deleteRouteTransactions(route_transactions: RouteTransaction[]): Promise<void> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = this.dataSource.getClient();

            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE id_route_transaction IN (?);`, 
                    [route_transactions.map(rt => rt.id_route_transaction).join(",")]);

                await tx.runAsync(`DELETE FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_route_transaction IN (?);`,
                    [route_transactions.map(rt => rt.id_route_transaction).join(",")]
                );
            });
        } catch(error) {
            throw new Error('Failed to delete route transactions: ' + error);
        }
    }

    async listRouteTransactions(): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            
            const transactions:RouteTransaction[] = [];

            // Retrieve all route transaction descriptions
            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS}`);
            const resultTransactions = transactionsStatement.executeSync<any>();

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {                
                const id_route_transaction:string = transaction['id_route_transaction'];
                
                const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.retrieveRouteTransactionDescriptionsByIds([ id_route_transaction ]);
                
                transactions.push(
                    new RouteTransaction(
                        transaction['id_route_transaction'],
                        new Date(transaction['date']),
                        transaction['state'],
                        transaction['cash_received'],
                        transaction['id_work_day'],
                        transaction['id_store'],
                        transaction['id_payment_method'],
                        resultRouteTransactionDescriptions
                    )
                );
            }
            return transactions;
        } catch (error) {
            throw new Error("Failed to list route transactions: " + error);
        }
    }

    async listRouteTransactionByStore(store: Store): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            const transactions:RouteTransaction[] = [];
            const { id_store } = store;

            // Retrieve all route transaction descriptions

            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_store = ?;`);
            const resultTransactions = transactionsStatement.executeSync<any>([id_store]);

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {
                const id_route_transaction:string = transaction['id_route_transaction'];
                
                const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.retrieveRouteTransactionDescriptionsByIds([ id_route_transaction ]);
                
                transactions.push(
                    new RouteTransaction(
                        transaction['id_route_transaction'],
                        new Date(transaction['date']),
                        transaction['state'],
                        transaction['cash_received'],
                        transaction['id_work_day'],
                        transaction['id_store'],
                        transaction['id_payment_method'],
                        resultRouteTransactionDescriptions
                    )
                );
            }

            return transactions;
        } catch (error) {
            throw new Error("Failed to list route transactions: " + error);
        }
    }

    async retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            const transactions:RouteTransaction[] = [];
            const routeTransactionDescriptions: Map<string, RouteTransactionDescription[]> = new Map();

            // Retrieve all route transaction descriptions
            const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.listRouteTransactionDescriptions();

            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_route_transaction IN (${id_route_transactions.map(id => `'${id}'`).join(', ')});`);
            const resultTransactions = transactionsStatement.executeSync<any>();
            
            // Group descriptions by their route transaction ID
            for (const transactionDescription of resultRouteTransactionDescriptions) {
                const descriptions = routeTransactionDescriptions.get(transactionDescription.id_route_transaction) || [];
                descriptions.push(transactionDescription);
                routeTransactionDescriptions.set(transactionDescription.id_route_transaction, descriptions);
            }

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {
                const id_route_transaction:string = transaction['id_route_transaction'];
                
                const descriptions = routeTransactionDescriptions.get(id_route_transaction) || [];
                
                transactions.push(
                    new RouteTransaction(
                        transaction['id_route_transaction'],
                        new Date(transaction['date']),
                        transaction['state'],
                        transaction['cash_received'],
                        transaction['id_work_day'],
                        transaction['id_store'],
                        transaction['id_payment_method'],
                        descriptions
                    )
                );
            }

            return transactions;

        } catch (error) {
            throw new Error("Failed to retrieve route transactions by ID: " + error);
        }
    }

    async listRouteTransactionDescriptions(): Promise<RouteTransactionDescription[]> {
        try {
            await this.dataSource.initialize();
            const routeTransactionDescriptions: RouteTransactionDescription[] = [];
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const statementTransactionDescriptions = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS}`);
            const resultTransactionDescriptions = statementTransactionDescriptions.executeSync<RouteTransactionDescription>();

            for (const description of resultTransactionDescriptions) {
                routeTransactionDescriptions.push(
                    new RouteTransactionDescription(
                        description['id_route_transaction_description'],
                        description['price_at_moment'],
                        description['amount'],
                        new Date(description['created_at']),
                        description['id_product_inventory'],
                        description['id_transaction_operation_type'],
                        description['id_product'],
                        description['id_route_transaction']
                    )
                );
            }

            return routeTransactionDescriptions;
        } catch (error) {
            throw new Error("Failed to list route transaction descriptions: " + error);
        }
    }

    async retrieveRouteTransactionDescriptionsByIds(ids_route_transaction: string[]): Promise<RouteTransactionDescription[]> {
        try {
            await this.dataSource.initialize();
            const routeTransactionDescriptions: RouteTransactionDescription[] = [];
            const db: SQLiteDatabase = await this.dataSource.getClient();
            // We receive route transaction IDs; filter descriptions by id_route_transaction
            const statementTransactionDescriptions = await db.prepareAsync(
                `SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE id_route_transaction IN (${ids_route_transaction.map(id => `'${id}'`).join(', ')})`
            );
            const execResult = statementTransactionDescriptions.executeSync<any>();
            const rows = execResult.getAllSync();

            for (const description of rows) {
                routeTransactionDescriptions.push(
                    new RouteTransactionDescription(
                        description.id_route_transaction_description,
                        description.price_at_moment,
                        description.amount,
                        new Date(description.created_at),
                        description.id_product_inventory,
                        description.id_transaction_operation_type,
                        description.id_product,
                        description.id_route_transaction
                    )
                );                
            }
            return routeTransactionDescriptions;
        } catch (error) {
            throw new Error("Failed to retrieve route transaction descriptions by IDs: " + error);
        }
    }

    async listPendingRouteTransactionToSync(): Promise<RouteTransactionModel[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const pending: RouteTransactionModel[] = [];
            const stmt = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE is_synced = 0 OR is_deleted = 1;`);
            const rows = stmt.executeSync<any>();
            for (const row of rows) {
                pending.push(row as RouteTransactionModel);
            }
            return pending;
        } catch (error) {
            throw new Error('Failed to list pending route transactions to sync: ' + error);
        }
    }

    async listPendingRouteTransactionDescriptionToSync(): Promise<RouteTransactionDescriptionModel[]> {
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const pending: RouteTransactionDescriptionModel[] = [];
            const stmt = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} WHERE is_synced = 0 OR is_deleted = 1;`);
            const rows = stmt.executeSync<any>();
            for (const row of rows) {
                // Ensure created_at is Date if consumers expect it
                if (row.created_at && typeof row.created_at === 'string') {
                    row.created_at = new Date(row.created_at);
                }
                pending.push(row as RouteTransactionDescriptionModel);
            }
            return pending;
        } catch (error) {
            throw new Error('Failed to list pending route transaction descriptions to sync: ' + error);
        }
    }

    async markRouteTransactionsAsSynced(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                const placeholders = ids.map(() => '?').join(',');
                await tx.runAsync(
                    `UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} SET is_synced = 1 WHERE id_route_transaction IN (${placeholders});`,
                    ids
                );
            });
        } catch (error) {
            throw new Error('Failed to mark route transactions as synced: ' + error);
        }
    }

    async markRouteTransactionDescriptionsAsSynced(ids: string[]): Promise<void> {
        if (!ids || ids.length === 0) return;
        try {
            await this.dataSource.initialize();
            const db: SQLiteDatabase = await this.dataSource.getClient();
            await db.withExclusiveTransactionAsync(async (tx) => {
                const placeholders = ids.map(() => '?').join(',');
                await tx.runAsync(
                    `UPDATE ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} SET is_synced = 1 WHERE id_route_transaction_description IN (${placeholders});`,
                    ids
                );
            });
        } catch (error) {
            throw new Error('Failed to mark route transaction descriptions as synced: ' + error);
        }
    }
}