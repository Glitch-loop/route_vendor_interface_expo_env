// Libraries
import { injectable, inject } from 'tsyringe';

// Entities
import { Store } from '@/src/core/entities/Store';

// Interfaces
import { StoreRepository } from '@/src/core/interfaces/StoreRepository';
import { SyncServerStoreRepository } from '@/src/infrastructure/persitence/interface/server-database/SyncServerStoreRepository';

// Infrastructure
import { BackendDataSource } from '@/src/infrastructure/datasources/BackendDatasource';

// Models
import StoreServerModel from '@/src/infrastructure/persitence/model/server-models/StoreServerModel';

// Utils
import { TOKENS } from '@/src/infrastructure/di/tokens';

interface RetrieveLocationsByIdsRequestInterface {
    id_locations: string[];
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

interface LocationStoreRequestInterface {
    id_location: string;
    street: string;
    ext_number: string;
    colony: string;
    postal_code: string;
    address_reference: string | undefined;
    location_name: string;
    latitude: string;
    longitude: string;
    id_creator: string;
    id_client: string | undefined;
    id_location_type: string;
    created_at: string;
    updated_at: string;
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
    // Note (06-20-26): Backend does not expose an update endpoint for locations in this repository.
    return;
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
      // const response = await this.dataSource.get<LocationStoreResponseInterface[]>(
      //   '/clients/locations'
      // );
      const listedStores:LocationStoreResponseInterface[] = await this.recursiveListStore(undefined);
      
      
      return this.mapResponseToStores(listedStores);
    } catch (error: any) {
      throw new Error(`Failed to list stores: ${error.message}`);
    }
  }

  async deleteStores(stores: Store[]): Promise<void> {
    // Note (06-20-26): Backend does not expose a delete endpoint for locations in this repository.
    return;
  }

  async upsertStores(stores: StoreServerModel[]): Promise<void> {
    if (!stores || stores.length === 0) return;

    try {
      // Upsert is handled as insert, per the current backend contract.
      for (const store of stores) {

        /*
          Note for the correct request for this endpoint (14-07-26) (PATCH)

          - To indicate there is not address reference, it has to be set as undefined.
          - If not possible to indicate to which client a location belongs let the interfaces as null.
        
          
        */
        const body: LocationStoreRequestInterface = {
            id_location: store.id_location,
            street: store.street,
            ext_number: store.ext_number === null ? '' : store.ext_number,
            colony: store.colony,
            postal_code: store.postal_code,
            address_reference: store.address_reference === null ? undefined : store.address_reference,
            location_name: store.location_name === null ? 'Nombre no disponible durnate sincronizacion' :  store.location_name,
            latitude: store.latitude,
            longitude: store.longitude,
            id_creator: store.id_creator,
            id_client: store.id_client === '' ? undefined : store.id_client,
            id_location_type: store.id_location_type,
            created_at: store.created_at,
            updated_at: store.updated_at,
          }

        await this.dataSource.post<unknown, LocationStoreRequestInterface>(
          '/clients/locations',
          body
        );
      }
  
    } catch (error: any) {
      throw new Error(`Failed to upsert stores: ${error.message}`);
    }
  }

  private async recursiveListStore(next_item: string|undefined): Promise<LocationStoreResponseInterface[]> {
    const listedStores:LocationStoreResponseInterface[] = [];
    let urlToRequest:string = `/clients/locations?status_location=1,-1&limit=500&next_item=${next_item}`
    try {
      if(next_item === undefined) {
        urlToRequest = `/clients/locations?status_location=1,-1&limit=500`
      } else {
        urlToRequest = `/clients/locations?status_location=1,-1&limit=500&next_item=${next_item}`
      }

      const response = await this.dataSource.get<LocationStoreResponseInterface[]>(
        urlToRequest
      );

      if (response.meta === undefined) {
        return response.data;
      } else {
        if (response.meta.has_next_page === false) {
          return response.data;
        } else {
          return listedStores.concat(
            await this.recursiveListStore(response.meta.next_item)
          );
        }
      }
      
    } catch (error: any) {
      throw new Error(`Failed to list stores: ${error.message}`);
    }
  }

  private mapResponseToStores(
      response: LocationsCollectionResponseInterface | LocationStoreResponseInterface[]
  ): Store[] {
      const locations = Array.isArray(response)
          ? response
          : response.data ?? response.items ?? response.collection ?? response.locations ?? [];

      return locations.map((location) => (
        new Store(
          location.id_location,
          location.street,
          location.ext_number,
          location.colony,
          location.postal_code,
          location.address_reference,
          location.location_name,
          null, // Note (06-21-26): No provided by the server
          null, // Note (06-21-26): No provided by the server
          location.latitude,
          location.longitude,
          location.id_creator,
          location.id_client,
          location.id_location_type,
          new Date(location.created_at),
          'On route', 
          location.status_location,
          0 // By default this is False.
        )
      ));
  }
}