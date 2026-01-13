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
            // Map Store entities to database schema (excluding route_day_state)
            const storeRecords = stores.map(store => ({
                street: store.street,
                ext_number: store.ext_number,
                colony: store.colony,
                postal_code: store.postal_code,
                address_reference: store.address_reference,
                store_name: store.store_name,
                owner_name: store.owner_name,
                cellphone: store.cellphone,
                latitude: store.latitude,
                longitude: store.longitude,
                creation_date: store.creation_date,
                creation_context: store.creation_context,
                status_store: store.status_store,
                id_creator: store.id_creator
            }));

            const { error } = await this.supabase
                .from('stores')
                .insert(storeRecords);

            if (error) throw new Error(`Error inserting stores: ${ error.message }`);
        } catch (error: any) {
            throw new Error(`Failed to insert stores: ${error.message}`);
        }
    }

    async updateStore(store: Store): Promise<void> {
        try {
            // Map Store entity to database schema (excluding route_day_state and id_store)
            const storeRecord = {
                street: store.street,
                ext_number: store.ext_number,
                colony: store.colony,
                postal_code: store.postal_code,
                address_reference: store.address_reference,
                store_name: store.store_name,
                owner_name: store.owner_name,
                cellphone: store.cellphone,
                latitude: store.latitude,
                longitude: store.longitude,
                creation_date: store.creation_date,
                creation_context: store.creation_context,
                status_store: store.status_store,
                id_creator: store.id_creator
            };

            const { error } = await this.supabase
                .from('stores')
                .update(storeRecord)
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