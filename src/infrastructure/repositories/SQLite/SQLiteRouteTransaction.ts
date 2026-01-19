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
import { PaymentMethod } from "@/src/core/object-values/PaymentMethod";

// Database
import EMBEDDED_TABLES from "@/src/infrastructure/database/embeddedTables";


// DataSources
import { SQLiteDataSource } from "@/src/infrastructure/datasources/SQLiteDataSource";

// Utils
import { TOKENS } from "@/src/infrastructure/di/tokens";

@injectable()
export class SQLiteRouteTransactionRepository implements RouteTransactionRepository {
    constructor(@inject(TOKENS.SQLiteDataSource) private readonly dataSource: SQLiteDataSource) {}

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
            const { id_payment_method } = payment_method

            const db: SQLiteDatabase = await this.dataSource.getClient();

            await db.withExclusiveTransactionAsync(async (tx) => {
                await tx.runAsync(`INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} (id_route_transaction, date, state, cash_received, id_work_day, id_payment_method, id_store) VALUES (?, ?, ?, ?, ?, ?, ?);
                `,
                [
                    id_route_transaction,
                    date,
                    state,
                    cash_received,
                    id_work_day,
                    id_payment_method,
                    id_store,
                ]);

                for (const description of transaction_description) {
                    const {
                        id_route_transaction_description,
                        price_at_moment,
                        comission_at_moment,
                        amount,
                        id_transaction_operation_type,
                        id_product,
                        id_route_transaction
                    } = description

                    await tx.runAsync(`INSERT INTO ${EMBEDDED_TABLES.ROUTE_TRANSACTION_DESCRIPTIONS} 
                        (id_route_transaction_description, 
                        price_at_moment, 
                        comission_at_moment, 
                        amount, 
                        id_transaction_operation_type, 
                        id_product, 
                        id_route_transaction) VALUES (?, ?, ?, ?, ?, ?, ?);
                    `,
                    [
                        id_route_transaction_description,
                        price_at_moment,
                        comission_at_moment,
                        amount,
                        id_transaction_operation_type,
                        id_product,
                        id_route_transaction
                    ]);
                }
            });
        } catch(error) {
            throw new Error("Failed to insert route transaction.");
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
            const { id_payment_method } = payment_method

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
                date,
                state,
                id_work_day,
                id_payment_method,
                id_store,
                id_route_transaction,
            ]);
        });
        } catch (error) {
            throw new Error("Failed to update route transaction.");
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
            throw new Error('Failed to delete route transactions.');
        }
    }

    async listRouteTransactionByStore(store: Store): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            
            const transactions:RouteTransaction[] = [];
            const routeTransactionDescriptions: Map<string, RouteTransactionDescription[]> = new Map();
            const paymentMethods: Map<string, PaymentMethod> = new Map();
            
            // Retrieve all payment methods
            const resultPaymentMethods: PaymentMethod[] = await this.listPaymentMethods();

            // Retrieve all route transaction descriptions
            const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.listRouteTransactionDescriptions();

            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS}`);
            const resultTransactions = transactionsStatement.executeSync<any>();

            // Map payment methods by their ID
            for (const paymentMethod of resultPaymentMethods) {
                paymentMethods.set(paymentMethod.id_payment_method, paymentMethod);
            }

            // Group descriptions by their route transaction ID
            for (const transactionDescription of resultRouteTransactionDescriptions) {
                const descriptions = routeTransactionDescriptions.get(transactionDescription.id_route_transaction) || [];
                descriptions.push(transactionDescription);
                routeTransactionDescriptions.set(transactionDescription.id_route_transaction, descriptions);
            }

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {
                const id_route_transaction:string = transaction[0];
                
                const descriptions = routeTransactionDescriptions.get(id_route_transaction) || [];
                
                const payment_method = paymentMethods.get(transaction.id_payment_method) || new PaymentMethod("", "Unknown");

                transactions.push(
                    new RouteTransaction(
                        transaction[0],
                        transaction[1],
                        transaction[2],
                        transaction[3],
                        transaction[4],
                        transaction[5],
                        payment_method,
                        descriptions
                    )
                );
            }

            return transactions;
        } catch (error) {
            throw new Error("Failed to list route transactions.");
        }
    }

    async listRouteTransactions(): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            const transactions:RouteTransaction[] = [];
            const routeTransactionDescriptions: Map<string, RouteTransactionDescription[]> = new Map();
            const paymentMethods: Map<string, PaymentMethod> = new Map();
            const { id_store } = store;

            // Retrieve all payment methods
            const resultPaymentMethods: PaymentMethod[] = await this.listPaymentMethods();

            // Retrieve all route transaction descriptions
            const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.listRouteTransactionDescriptions();

            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_store = ?;`);
            const resultTransactions = transactionsStatement.executeSync<any>([id_store]);

            // Map payment methods by their ID
            for (const paymentMethod of resultPaymentMethods) {
                paymentMethods.set(paymentMethod.id_payment_method, paymentMethod);
            }

            // Group descriptions by their route transaction ID
            for (const transactionDescription of resultRouteTransactionDescriptions) {
                const descriptions = routeTransactionDescriptions.get(transactionDescription.id_route_transaction) || [];
                descriptions.push(transactionDescription);
                routeTransactionDescriptions.set(transactionDescription.id_route_transaction, descriptions);
            }

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {
                const id_route_transaction:string = transaction[0];
                
                const descriptions = routeTransactionDescriptions.get(id_route_transaction) || [];
                
                const payment_method = paymentMethods.get(transaction.id_payment_method) || new PaymentMethod("", "Unknown");

                transactions.push(
                    new RouteTransaction(
                        transaction[0],
                        transaction[1],
                        transaction[2],
                        transaction[3],
                        transaction[4],
                        transaction[5],
                        payment_method,
                        descriptions
                    )
                );
            }

            return transactions;
        } catch (error) {
            throw new Error("Failed to list route transactions.");
        }
    }

    async retrieveRouteTransactionById(id_route_transactions: string[]): Promise<RouteTransaction[]> {
        try {
            await this.dataSource.initialize();
            const transactions:RouteTransaction[] = [];
            const routeTransactionDescriptions: Map<string, RouteTransactionDescription[]> = new Map();
            const paymentMethods: Map<string, PaymentMethod> = new Map();

            // Retrieve all payment methods
            const resultPaymentMethods: PaymentMethod[] = await this.listPaymentMethods();

            // Retrieve all route transaction descriptions
            const resultRouteTransactionDescriptions: RouteTransactionDescription[] = await this.listRouteTransactionDescriptions();

            const db: SQLiteDatabase = this.dataSource.getClient();
            
            // Retrieve all route transactions
            const transactionsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.ROUTE_TRANSACTIONS} WHERE id_route_transaction IN (${id_route_transactions.map(id => `'${id}'`).join(', ')});`);
            const resultTransactions = transactionsStatement.executeSync<any>();
            
            // Map payment methods by their ID
            for (const paymentMethod of resultPaymentMethods) {
                paymentMethods.set(paymentMethod.id_payment_method, paymentMethod);
            }

            // Group descriptions by their route transaction ID
            for (const transactionDescription of resultRouteTransactionDescriptions) {
                const descriptions = routeTransactionDescriptions.get(transactionDescription.id_route_transaction) || [];
                descriptions.push(transactionDescription);
                routeTransactionDescriptions.set(transactionDescription.id_route_transaction, descriptions);
            }

            // Map descriptions to their respective transactions
            for (const transaction of resultTransactions) {
                const id_route_transaction:string = transaction[0];
                
                const descriptions = routeTransactionDescriptions.get(id_route_transaction) || [];
                
                const payment_method = paymentMethods.get(transaction.id_payment_method) || new PaymentMethod("", "Unknown");

                transactions.push(
                    new RouteTransaction(
                        transaction[0],
                        transaction[1],
                        transaction[2],
                        transaction[3],
                        transaction[4],
                        transaction[5],
                        payment_method,
                        descriptions
                    )
                );
            }

            return transactions;

        } catch (error) {
            throw new Error("Failed to retrieve route transactions by ID.");
        }
    }

    async listPaymentMethods(): Promise<PaymentMethod[]> {
        try {
            await this.dataSource.initialize();
            const paymentMethods: PaymentMethod[] = [];
            const db: SQLiteDatabase = await this.dataSource.getClient();
            const paymentMethodsStatement = await db.prepareAsync(`SELECT * FROM ${EMBEDDED_TABLES.PAYMENT_METHODS}`);
            const resultPaymentMethods = paymentMethodsStatement.executeSync<PaymentMethod>();

            for (const paymentMethod of resultPaymentMethods) {
                paymentMethods.push(paymentMethod);
            }

            return paymentMethods;
        } catch (error) {
            throw new Error("Failed to list payment methods."); 
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
                routeTransactionDescriptions.push(description);
            }

            return routeTransactionDescriptions;
        } catch (error) {
            throw new Error("Failed to list route transaction descriptions.");
        }
    }
}