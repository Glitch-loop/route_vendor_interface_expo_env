import { ReplicationDataInterface } from "@/src/infrastructure/persitence/data-replication/ReplicationDataInterface";
import RouteTransactionDescriptionServerModel from "@/src/infrastructure/persitence/model/server-models/RouteTransactionDescriptionServerModel";

export default interface RouteTransactionServerModel extends ReplicationDataInterface {
  id_transaction: string,
  cfdi?: string,
  id_invoice_concept?: string,
  received_amount: number,
  created_at: string,
  latitude: string,
  longitude: string,
  id_location: string,
  id_client?: string,
  created_by: string,
  id_work_day: string,
  id_payment_method: string,
  id_payment_schema: string,
  state: string,
  transaction_descriptions: RouteTransactionDescriptionServerModel[],
}
