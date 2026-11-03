import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { Restaurant, RestaurantDto } from '../models/restaurant.model'

@Injectable({ providedIn: 'root' })
export class RestaurantApi {
  private http = inject(HttpClient)
  private apiUrl = inject(API_URL)

  private get url(): string {
    return `${this.apiUrl}/restaurants`
  }

  list(): Observable<Restaurant[]> {
    return this.http.get<Restaurant[]>(this.url)
  }

  get(id: string): Observable<Restaurant> {
    return this.http.get<Restaurant>(`${this.url}/${id}`)
  }

  create(body: RestaurantDto): Observable<Restaurant> {
    return this.http.post<Restaurant>(this.url, body)
  }

  update(id: string, body: RestaurantDto): Observable<Restaurant> {
    return this.http.put<Restaurant>(`${this.url}/${id}`, body)
  }
}
