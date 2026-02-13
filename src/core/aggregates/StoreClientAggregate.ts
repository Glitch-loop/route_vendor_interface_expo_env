// Entities
import { Store } from "@/src/core/entities/Store";

export class StoreClientAggregate {
    private storeClient: Store[] | null;

    constructor(storeClient: Store[] | null) {
        this.storeClient = storeClient;
    }

    registerNewClient(
        id_store: string,
        street: string,
        ext_number: string | null,
        colony: string,
        postal_code: string,
        address_reference: string | null,
        store_name: string | null,
        owner_name: string | null,
        cellphone: string | null,
        latitude: string,
        longitude: string,
        id_creator: string,
        creation_date: string,
        creation_context: string,
    ) {
        if (!this.storeClient) this.storeClient = [];

        const state:number = 1; // Active

        const newStoreClient = new Store(
            id_store,
            street,
            ext_number,
            colony,
            postal_code,
            address_reference,
            store_name,
            owner_name,
            cellphone,
            latitude,
            longitude,
            id_creator,
            creation_date,
            creation_context,
            state,
            1 // is_new
        );

        this.storeClient.push(newStoreClient);
    }
    
    getStoreClients(): Store[] {
        if (!this.storeClient) {
            throw new Error("No store clients registered.");
        }
        return this.storeClient;
    }

}