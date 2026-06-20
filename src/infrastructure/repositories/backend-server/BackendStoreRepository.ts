// Libraries
import { injectable, inject } from 'tsyringe';

// DTOs
import StoreDTO from '@/src/application/dto/StoreDTO';

// Entities
import { Store } from '@/src/core/entities/Store';

// Interfaces
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';
import { SyncServerStoreRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerStoreRepository';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Models
import StoreModel from '@/src/infrastructure/persitence/model/StoreModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface RetrieveLocationsByIdsRequestInterface {
    id_locations: string[];
}

interface CreateLocationRequestInterface {
    id_location?: string;
  street: string;
    ext_number: string | null;
  colony: string;
  postal_code: string;
    address_reference: string | null;
    location_name: string;
    latitude: string;
    longitude: string;
    id_creator: string;
    id_client: string|undefined;
    status_location: number;
    id_location_type: string;
    created_at: string;
    updated_at?: string;
    notes?: any[];
}

interface LocationStoreResponseInterface {
    id_location: string;
    street: string;
    ext_number: string | null;
    colony: string;
    postal_code: string;
    address_reference: string | null;
    location_name: string;
    latitude: string;
    longitude: string;
    id_creator: string;
    id_client: string;
    status_location: number;
    id_location_type: string;
    created_at: string;
    updated_at: string;
    notes: any[];
}

interface LocationsCollectionResponseInterface {
    data?: LocationStoreResponseInterface[];
    items?: LocationStoreResponseInterface[];
    collection?: LocationStoreResponseInterface[];
    locations?: LocationStoreResponseInterface[];
}

@injectable()
export class BackendStoreRepository implements StoreRepository, SyncServerStoreRepository {
    constructor(@inject(TOKENS.BackendDataSource) private readonly dataSource: BackendDataSource) {}

    async insertStores(stores: Store[]): Promise<void> {
            try {
                for (const store of stores) {
                    const request: CreateLocationRequestInterface = this.toCreateLocationRequest(store);
                    await this.dataSource.post<LocationStoreResponseInterface, CreateLocationRequestInterface>(
                        '/clients/locations',
                        request
                    );
                }
            } catch (error: any) {
                throw new Error(`Failed to insert stores: ${error.message}`);
            }
    }

    async updateStore(store: Store): Promise<void> {
            // Note (06-20-26): Backend does not expose an update endpoint for locations in this repository.
            return;
    }

    async retrieveStore(id_stores: string[]): Promise<Store[]> {
        try {
                        const request: RetrieveLocationsByIdsRequestInterface = {
                            id_locations: id_stores,
                        };

                        const response = await this.dataSource.post<LocationsCollectionResponseInterface | LocationStoreResponseInterface[], RetrieveLocationsByIdsRequestInterface>(
                            '/clients/locations/ids',
                            request
                        );

                        return this.mapResponseToStores(response);
                } catch (error: any) {
                        throw new Error(`Failed to retrieve stores: ${error.message}`);
        }
    }

    async listStores(): Promise<Store[]> {
        try {
                        const response = await this.dataSource.get<LocationsCollectionResponseInterface | LocationStoreResponseInterface[]>(
                            '/clients/locations'
                        );

                        return this.mapResponseToStores(response);
        } catch (error: any) {
            throw new Error(`Failed to list stores: ${error.message}`);
        }
    }

    async deleteStores(stores: Store[]): Promise<void> {
            // Note (06-20-26): Backend does not expose a delete endpoint for locations in this repository.
      return;
    }

    async upsertStores(stores: StoreModel[]): Promise<void> {
            if (!stores || stores.length === 0) return;

            try {
                // Upsert is handled as insert, per the current backend contract.
                const entities = stores.map((store) => this.toStoreEntityFromModel(store));
                await this.insertStores(entities);
            } catch (error: any) {
                throw new Error(`Failed to upsert stores: ${error.message}`);
            }
    }

        private mapResponseToStores(
            response: LocationsCollectionResponseInterface | LocationStoreResponseInterface[]
        ): Store[] {
            const locations = Array.isArray(response)
                ? response
                : response.data ?? response.items ?? response.collection ?? response.locations ?? [];

            return locations.map((location) => this.toStoreEntity(this.toStoreDTO(location)));
        }

        private toStoreDTO(location: LocationStoreResponseInterface): StoreDTO {
            return {
                id_store: location.id_location,
                street: location.street,
                ext_number: location.ext_number,
                colony: location.colony,
                postal_code: location.postal_code,
                address_reference: location.address_reference,
                store_name: location.location_name,
                latitude: location.latitude,
                longitude: location.longitude,
                creation_date: location.created_at,
                status_store: location.status_location,
                is_new: 0,
            };
        }

        private toStoreEntity(storeDTO: StoreDTO): Store {
            return new Store(
                storeDTO.id_store,
                storeDTO.street,
                storeDTO.ext_number,
                storeDTO.colony,
                storeDTO.postal_code,
                storeDTO.address_reference,
                storeDTO.store_name,
                null,
                null,
                storeDTO.latitude,
                storeDTO.longitude,
                '',
                '',
                new Date(storeDTO.creation_date),
                '',
                storeDTO.status_store,
                storeDTO.is_new,
            );
        }

        private toStoreEntityFromModel(store: StoreModel): Store {
            return new Store(
                store.id_store,
                store.street,
                store.ext_number,
                store.colony,
                store.postal_code,
                store.address_reference,
                store.store_name,
                store.owner_name,
                store.cellphone,
                store.latitude,
                store.longitude,
                store.id_creator,
                '',
                new Date(store.creation_date),
                store.creation_context,
                store.status_store,
                store.is_new,
            );
        }

        private toCreateLocationRequest(store: Store): CreateLocationRequestInterface {
            return {
                id_location: store.id_store,
                street: store.street,
                ext_number: store.ext_number,
                colony: store.colony,
                postal_code: store.postal_code,
                address_reference: store.address_reference,
                location_name: store.store_name ?? '',
                latitude: store.latitude,
                longitude: store.longitude,
                id_creator: store.id_creator,
                id_client: store.id_client,
                status_location: store.status_store,
                id_location_type: '',
                created_at: store.creation_date.toISOString(),
                updated_at: store.creation_date.toISOString(),
                notes: [],
            };
        }
}