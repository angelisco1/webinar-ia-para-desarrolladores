import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { Ingredient } from '../models/ingredient.model'

@Injectable({ providedIn: 'root' })
export class IngredientApi {
  private http = inject(HttpClient)
  private apiUrl = inject(API_URL)

  list(restaurantId: string): Observable<Ingredient[]> {
    return this.http.get<Ingredient[]>(`${this.apiUrl}/restaurants/${restaurantId}/ingredients`)
  }
}
