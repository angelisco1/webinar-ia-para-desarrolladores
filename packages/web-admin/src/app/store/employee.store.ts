import { Injectable, inject, signal } from '@angular/core'
import { firstValueFrom } from 'rxjs'
import { EmployeeApi } from '../api/employee.api'
import { Employee } from '../models/employee.model'

@Injectable({ providedIn: 'root' })
export class EmployeeStore {
  private api = inject(EmployeeApi)

  private _employees = signal<Employee[]>([])

  readonly employees = this._employees.asReadonly()

  async load(restaurantId: string): Promise<void> {
    this._employees.set([])
    try {
      this._employees.set(await firstValueFrom(this.api.list(restaurantId)))
    } catch (err) {
      console.error(err)
    }
  }

  add(employee: Employee): void {
    this._employees.update(list => [...list, employee])
  }
}
