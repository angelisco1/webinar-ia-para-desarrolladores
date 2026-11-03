import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { RestaurantApi } from '../api/restaurant.api'
import { Restaurant } from '../models/restaurant.model'

@Injectable({ providedIn: 'root' })
export class RestaurantStore {
  private api = inject(RestaurantApi)

  private _restaurants = signal<Restaurant[]>([])
  private _loading = signal(false)

  readonly restaurants = this._restaurants.asReadonly()
  readonly loading = this._loading.asReadonly()

  async load(): Promise<void> {
    this._loading.set(true)
    try {
      this._restaurants.set(await firstValueFrom(this.api.list()))
    } catch (err) {
      console.error(err)
    } finally {
      this._loading.set(false)
    }
  }
}
