import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { DishApi } from '../api/dish.api'
import { Dish } from '../models/dish.model'

@Injectable({ providedIn: 'root' })
export class DishStore {
  private api = inject(DishApi)

  private _dishes = signal<Dish[]>([])
  private _loading = signal(false)
  private _error = signal<string | null>(null)
  private loadedRestaurantId: string | null = null

  readonly dishes = this._dishes.asReadonly()
  readonly loading = this._loading.asReadonly()
  readonly error = this._error.asReadonly()

  async load(restaurantId: string): Promise<void> {
    this._loading.set(true)
    this._error.set(null)
    try {
      this._dishes.set(await firstValueFrom(this.api.list(restaurantId)))
      this.loadedRestaurantId = restaurantId
    } catch {
      this._error.set('No se pudieron cargar los platos.')
    } finally {
      this._loading.set(false)
    }
  }

  findById(restaurantId: string, id: string): Dish | undefined {
    if (restaurantId !== this.loadedRestaurantId) return undefined
    return this._dishes().find(d => d.id == id)
  }
}
