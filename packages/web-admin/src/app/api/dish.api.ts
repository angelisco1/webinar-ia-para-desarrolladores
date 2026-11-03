import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { Dish, DishDto } from '../models/dish.model'

@Injectable({ providedIn: 'root' })
export class DishApi {
  private http = inject(HttpClient)
  private apiUrl = inject(API_URL)

  private url(restaurantId: string): string {
    return `${this.apiUrl}/restaurants/${restaurantId}/dishes`
  }

  list(restaurantId: string): Observable<Dish[]> {
    return this.http.get<Dish[]>(this.url(restaurantId))
  }

  get(restaurantId: string, id: string): Observable<Dish> {
    return this.http.get<Dish>(`${this.url(restaurantId)}/${id}`)
  }

  create(restaurantId: string, dto: DishDto): Observable<Dish> {
    return this.http.post<Dish>(this.url(restaurantId), dto)
  }

  update(restaurantId: string, id: string, dto: DishDto): Observable<Dish> {
    return this.http.put<Dish>(`${this.url(restaurantId)}/${id}`, dto)
  }

  remove(restaurantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(restaurantId)}/${id}`)
  }
}
