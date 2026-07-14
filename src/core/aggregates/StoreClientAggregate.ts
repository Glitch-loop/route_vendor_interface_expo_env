// Entities
import { Store } from "@/src/core/entities/Store";

export class StoreClientAggregate {
  private _rootStore: Store | null;

  constructor(_storeClient: Store | null) {      
    if(_storeClient !== null) {
      this._rootStore = new Store(
        _storeClient.id_store,
        _storeClient.street,
        _storeClient.ext_number,
        _storeClient.colony,
        _storeClient.postal_code,
        _storeClient.address_reference,
        _storeClient.store_name,
        _storeClient.owner_name,
        _storeClient.cellphone,
        _storeClient.latitude,
        _storeClient.longitude,
        _storeClient.id_creator,
        _storeClient.id_client,
        _storeClient.id_location_type,
        _storeClient.creation_date,
        _storeClient.creation_context,
        _storeClient.status_store,
        _storeClient.is_new,
      )
    } else {
      this._rootStore = null;
    }
  }

  registerNewClient(
    _id_store: string,
    _street: string,
    _ext_number: string | null,
    _colony: string,
    _postal_code: string,
    _address_reference: string | null,
    _store_name: string | null,
    _owner_name: string | null,
    _cellphone: string | null,
    _latitude: string,
    _longitude: string,
    _id_creator: string,
    _id_client: string,
    _id_location_type: string,
    _creation_date: Date,
    _creation_context: string,
  ) {
    const state:number = -1; // User is registered has prospect client
    this._rootStore = new Store(
      _id_store,
      _street,
      _ext_number,
      _colony,
      _postal_code,
      _address_reference,
      _store_name,
      _owner_name,
      _cellphone,
      _latitude,
      _longitude,
      _id_creator,
      _id_client,
      _id_location_type,
      _creation_date,
      _creation_context,
      state,
      1 // is_new
    );
  }

  confirmClientRegistration(_dateOfTransaction: Date): boolean {
    if (this._rootStore === null) {
      throw new Error("There is not an store client in the root for perfomring the prospect of client confirmation.");
    }

    const { creation_date, status_store } = this._rootStore;

    const sellingDateUTC = Date.UTC(
      _dateOfTransaction.getUTCFullYear(),
      _dateOfTransaction.getUTCMonth(),
      _dateOfTransaction.getUTCDate()
    );

    const storeDateUTC = Date.UTC(
      creation_date.getUTCFullYear(),
      creation_date.getUTCMonth(),
      creation_date.getUTCDate()
    );    

    const oneDayInMilliseconds = 24 * 60 * 60 * 1000;
    const dayDifference = (sellingDateUTC - storeDateUTC) / oneDayInMilliseconds;

    if (dayDifference >= 1 && status_store === -1) {
      this._rootStore = new Store(
      this._rootStore.id_store,
      this._rootStore.street,
      this._rootStore.ext_number,
      this._rootStore.colony,
      this._rootStore.postal_code,
      this._rootStore.address_reference,
      this._rootStore.store_name,
      this._rootStore.owner_name,
      this._rootStore.cellphone,
      this._rootStore.latitude,
      this._rootStore.longitude,
      this._rootStore.id_creator,
      this._rootStore.id_client,
      this._rootStore.id_location_type,
      this._rootStore.creation_date,
      this._rootStore.creation_context,
      1,
      this._rootStore.is_new
    );

      return true;
    } else {
      return false;
    }
  }

  getStoreClient(): Store {
    if (this._rootStore === null) {
      throw new Error("There is not an store client in the root.");
    }

    return new Store(
      this._rootStore.id_store,
      this._rootStore.street,
      this._rootStore.ext_number,
      this._rootStore.colony,
      this._rootStore.postal_code,
      this._rootStore.address_reference,
      this._rootStore.store_name,
      this._rootStore.owner_name,
      this._rootStore.cellphone,
      this._rootStore.latitude,
      this._rootStore.longitude,
      this._rootStore.id_creator,
      this._rootStore.id_client,
      this._rootStore.id_location_type,
      this._rootStore.creation_date,
      this._rootStore.creation_context,
      this._rootStore.status_store,
      this._rootStore.is_new
    );
  }

}