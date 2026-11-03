import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { Table, TableInput } from '../models/table.model'

@Injectable({ providedIn: 'root' })
export class TableApi {
  private http = inject(HttpClient)
  private apiUrl = inject(API_URL)

  private url(restaurantId: string): string {
    return `${this.apiUrl}/restaurants/${restaurantId}/tables`
  }

  list(restaurantId: string): Observable<Table[]> {
    return this.http.get<Table[]>(this.url(restaurantId))
  }

  get(restaurantId: string, id: string): Observable<Table> {
    return this.http.get<Table>(`${this.url(restaurantId)}/${id}`)
  }

  create(restaurantId: string, body: TableInput): Observable<Table> {
    return this.http.post<Table>(this.url(restaurantId), body)
  }

  update(restaurantId: string, id: string, body: TableInput): Observable<Table> {
    return this.http.put<Table>(`${this.url(restaurantId)}/${id}`, body)
  }

  remove(restaurantId: string, id: string): Observable<void> {
    return this.http.delete<void>(`${this.url(restaurantId)}/${id}`)
  }
}
