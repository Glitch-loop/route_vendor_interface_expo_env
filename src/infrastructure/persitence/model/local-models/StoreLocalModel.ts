import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface StoreLocalModel extends ReplicationDataInterface {
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
    id_client: string,
    id_location_type: string,
    creation_date: string,
    creation_context: string,
    status_store: number,
}
