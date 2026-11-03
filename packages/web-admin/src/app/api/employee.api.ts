import { Injectable, inject } from '@angular/core'
import { HttpClient } from '@angular/common/http'
import { Observable } from 'rxjs'
import { API_URL } from '@resttek/web-shared'
import { Employee, EmployeeDto } from '../models/employee.model'

@Injectable({ providedIn: 'root' })
export class EmployeeApi {
  private http = inject(HttpClient)
  private apiUrl = inject(API_URL)

  list(restaurantId: string): Observable<Employee[]> {
    return this.http.get<Employee[]>(`${this.apiUrl}/restaurants/${restaurantId}/employees`)
  }

  create(employee: EmployeeDto): Observable<Employee> {
    return this.http.post<Employee>(`${this.apiUrl}/employees`, employee)
  }
}
