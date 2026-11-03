import { Injectable, signal } from '@angular/core'
import { Table } from '../models/table.model'

@Injectable({ providedIn: 'root' })
export class TableSessionStore {
  private readonly _table = signal<Table | null>(null)
  private readonly _restaurantId = signal<string | null>(null)

  readonly table = this._table.asReadonly()
  readonly restaurantId = this._restaurantId.asReadonly()

  select(restaurantId: string, table: Table): void {
    this._restaurantId.set(restaurantId)
    this._table.set(table)
  }

  clear(): void {
    this._restaurantId.set(null)
    this._table.set(null)
  }

  hasTableFor(restaurantId: string): boolean {
    return this._table() !== null && this._restaurantId() === restaurantId
  }
}
