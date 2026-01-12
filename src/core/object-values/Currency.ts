export class Currency {
  constructor(
    public readonly id_denomination: string,
    public readonly value: number,
    public readonly amount: number | null,
    public readonly coin: boolean | null,
    public readonly method: string
  ) {}
}