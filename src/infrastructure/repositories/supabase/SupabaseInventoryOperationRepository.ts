// Libraries
import { injectable, inject } from 'tsyringe';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Interfaces
import { SyncServerInventoryOperationRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerInventoryOperationRepository';

// Models
import InventoryOperationModel from '@/src/infrastructure/persitence/model/InventoryOperationModel';
import InventoryOperationDescriptionModel from '@/src/infrastructure/persitence/model/InventoryOperationDescriptionModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';
import { SERVER_DATABASE_ENUM } from '@/src/infrastructure/persitence/enums/serverTablesEnum';


@injectable()
export class SupabaseInventoryOperationRepository implements SyncServerInventoryOperationRepository {
    constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) { }

    private get supabase() {
        return this.dataSource.getClient();
    }

    async upsertInventoryOperations(operations: InventoryOperationModel[]): Promise<void> {
        if (!operations || operations.length === 0) return;
        try {
            const records = operations.map((op) => ({
                id_inventory_operation: op.id_inventory_operation,
                sign_confirmation: op.sign_confirmation,
                date: op.date,
                state: op.state,
                audit: op.audit,
                id_inventory_operation_type: op.id_inventory_operation_type,
                id_work_day: op.id_work_day,
            }));

            const { error } = await this.supabase
                .from(SERVER_DATABASE_ENUM.INVENTORY_OPERATIONS)
                .upsert(records, { onConflict: 'id_inventory_operation' });

            if (error) throw new Error(`Error upserting inventory operations: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert inventory operations: ${error.message}`);
        }
    }

    async upsertInventoryOperationDescriptions(descriptions: InventoryOperationDescriptionModel[]): Promise<void> {
        if (!descriptions || descriptions.length === 0) return;
        try {
            
            const records = descriptions.map((d: InventoryOperationDescriptionModel) => ({
                
                id_inventory_operation_description: d.id_inventory_operation_description,
                price_at_moment: d.price_at_moment,
                amount: d.amount,
                created_at: (d as any).created_at ? new Date((d as any).created_at).toISOString() : undefined,
                id_inventory_operation: d.id_inventory_operation,
                id_product: d.id_product,
            }));

            const { error } = await this.supabase
                .from(SERVER_DATABASE_ENUM.INVENTORY_OPERATION_DESCRIPTIONS)
                .upsert(records, { onConflict: 'id_inventory_operation_description' });

            if (error) throw new Error(`Error upserting inventory operation descriptions: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to upsert inventory operation descriptions: ${error.message}`);
        }
    }
}