import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface StoreModel extends ReplicationDataInterface {
    id_location: string,
    street: string,
    ext_number: string | null,
    colony: string,
    postal_code: string,
    location_name: string | null,
    latitude: string,
    longitude: string,
    id_creator: string,
    id_client: string,
    id_location_type: string,
    created_at: string,
    updated_at: string,
    address_reference: string | null,
}
