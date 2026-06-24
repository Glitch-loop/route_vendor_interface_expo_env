import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";

export default interface RouteTransactionServerModel extends ReplicationDataInterface {
  id_transaction: string,
  cfdi: string,
  received_amount: number,
  id_invoice_concept: string,
  created_at: string,
  latitude: string,
  longitude: string,
  id_location: string,
  id_client: string,
  id_work_day: string,
  id_payment_method: string,
  id_payment_schema: string,
}
