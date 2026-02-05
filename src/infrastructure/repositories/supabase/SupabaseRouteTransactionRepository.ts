// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SyncServerRouteTransactionRepository } from '../../persitence/interface/server-database/SyncServerRouteTransactionRepository';
import RouteTransactionModel from '@/src/infrastructure/persitence/model/RouteTransactionModel';
import RouteTransactionDescriptionModel from '@/src/infrastructure/persitence/model/RouteTransactionDescriptionModel';


@injectable()
export class SupabaseRouteTransactionRepository implements SyncServerRouteTransactionRepository {
    constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) { }

    private get supabase() {
        return this.dataSource.getClient();
    }

    async upsertRouteTransactions(transactions: RouteTransactionModel[]): Promise<void> {
        if (!transactions || transactions.length === 0) return;
        try {
            const records = transactions.map((t) => ({
                id_route_transaction: t.id_route_transaction,
                date: t.date,
                state: t.state,
                cash_received: t.cash_received,
                id_work_day: t.id_work_day,
                id_payment_method: t.payment_method,
                id_store: t.id_store,
            }));

            const { error } = await this.supabase
                .from('route_transactions')
                .upsert(records, { onConflict: 'id_route_transaction' });

            if (error) throw new Error(`Error upserting route transactions: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert route transactions: ${error.message}`);
        }
    }

    async upsertRouteTransactionDescriptions(descriptions: RouteTransactionDescriptionModel[]): Promise<void> {
        if (!descriptions || descriptions.length === 0) return;
        try {
            const records = descriptions.map((d) => ({
                id_route_transaction_description: d.id_route_transaction_description,
                price_at_moment: d.price_at_moment,
                amount: d.amount,
                created_at: d.created_at instanceof Date ? d.created_at.toISOString() : d.created_at,
                id_product_inventory: d.id_product_inventory,
                id_transaction_operation_type: d.id_transaction_operation_type,
                id_product: d.id_product,
                id_route_transaction: d.id_route_transaction,
            }));

            const { error } = await this.supabase
                .from('route_transaction_descriptions')
                .upsert(records, { onConflict: 'id_route_transaction_description' });

            if (error) throw new Error(`Error upserting route transaction descriptions: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert route transaction descriptions: ${error.message}`);
        }
    }
}