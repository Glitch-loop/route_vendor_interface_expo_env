export class Store {
  constructor(
    public readonly id_store: string,
    public readonly street: string,
    public readonly ext_number: string | null,
    public readonly colony: string,
    public readonly postal_code: string,
    public readonly address_reference: string | null,
    public readonly store_name: string | null,
    public readonly owner_name: string | null,
    public readonly cellphone: string | null,
    public readonly latitude: string,
    public readonly longitude: string,
    public readonly id_creator: string,
    public readonly creation_date: string,
    public readonly creation_context: string,
    public readonly status_store: number,
    public readonly is_new: number
  ) {}

  // TODO: Implement update_route_day_state(type: string): void
}