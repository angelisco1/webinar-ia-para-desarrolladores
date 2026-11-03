import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { Table, UpdateTableStatusDto } from '../models/table.model'
import { environment } from '../../../../environments/environment'

@Injectable({ providedIn: 'root' })
export class TableService {
  private readonly http = inject(HttpClient)

  getAll(restaurantId: string): Observable<Table[]> {
    return this.http.get<Table[]>(`${environment.apiUrl}/restaurants/${restaurantId}/tables`)
  }

  updateStatus(restaurantId: string, tableId: string, dto: UpdateTableStatusDto): Observable<Table> {
    return this.http.patch<Table>(
      `${environment.apiUrl}/restaurants/${restaurantId}/tables/${tableId}/status`,
      dto
    )
  }
}
