export class Store {
  constructor(
    public readonly id_store: string,
    public readonly street: string,
    public readonly ext_number: string | null,
    public readonly postal_code: string,
    public readonly address_reference: string | null,
    public readonly store_name: string | null,
    public readonly owner_name: string | null,
    public readonly cellphone: string | null,
    public readonly latitude: string,
    public readonly longitude: string,
    public readonly id_creator: string,
    public readonly creation_date: string,
    public readonly status_store: string,
    public readonly update_day_state: number
  ) {}

  // TODO: Implement update_route_day_state(type: string): void
}