// Libraries
import { injectable, inject } from 'tsyringe';

// Entities
import { Store } from '@/src/core/entities/Store';

// Interfaces
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';

// Infrastructure
import { SupabaseDataSource } from '@/src/infrastructure/datasources/SupabaseDataSource'; 

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';


@injectable()
export class SupabaseStoreRepository implements StoreRepository {
    constructor(@inject(TOKENS.SupabaseDataSource) private readonly dataSource: SupabaseDataSource) { }

    private get supabase() {
        return this.dataSource.getClient();
    }

    async insertStores(stores: Store[]): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('stores')
                .insert(stores);

            if (error) throw new Error(`Error inserting stores: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to insert stores: ${error.message}`);
        }
    }

    async updateStore(store: Store): Promise<void> {
        try {
            const { error } = await this.supabase
                .from('stores')
                .update(store)
                .eq('id_store', store.id_store);

            if (error) throw new Error(`Error updating store: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to update store: ${error.message}`);
        }
    }

    async retrieveStore(id_stores: string[]): Promise<Store[]> {
        try {
            const { data, error } = await this.supabase
                .from('stores')
                .select('*')
                .in('id_store', id_stores);

            if (error) throw new Error(`Error retrieving stores: ${error.message}`);
            return data || [];
        } catch (error: any) {
            throw new Error(`Failed to retrieve stores: ${error.message}`);
        }
    }

    async listStores(): Promise<Store[]> {
        try {
            const { data, error } = await this.supabase
                .from('stores')
                .select('*');

            if (error) throw new Error(`Error listing stores: ${error.message}`);
            return data || [];
        } catch (error: any) {
            throw new Error(`Failed to list stores: ${error.message}`);
        }
    }

    async deleteStores(stores: Store[]): Promise<void> {
        try {
            const storeIds = stores.map(store => store.id_store);

            const { error } = await this.supabase
                .from('stores')
                .delete()
                .in('id_store', storeIds);

            if (error) throw new Error(`Error deleting stores: ${error.message}`);
        } catch (error: any) {
            throw new Error(`Failed to delete stores: ${error.message}`);
        }
    }
}