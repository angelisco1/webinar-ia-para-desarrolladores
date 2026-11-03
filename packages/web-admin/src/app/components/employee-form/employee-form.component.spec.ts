import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router'
import { of } from 'rxjs'
import { EmployeeApi } from '../../api/employee.api'
import { EmployeeStore } from '../../store/employee.store'
import { EmployeeFormComponent } from './employee-form.component'

describe('EmployeeFormComponent', () => {
  it('crea el empleado en el restaurante de la ruta, lo añade al store y navega', () => {
    const created = { id: 'e1' }
    const api = { create: vi.fn(() => of(created)) }
    const store = { add: vi.fn() }
    const navigate = vi.fn()
    TestBed.configureTestingModule({
      declarations: [EmployeeFormComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ restaurantId: 'r1' }) } } },
        { provide: Router, useValue: { navigate } },
        { provide: EmployeeApi, useValue: api },
        { provide: EmployeeStore, useValue: store }
      ]
    })
    const cmp = TestBed.createComponent(EmployeeFormComponent).componentInstance
    cmp.ngOnInit()
    Object.assign(cmp.employee, { firstName: 'A', lastName: 'B', email: 'a@b.c', password: '123456' })
    cmp.save()

    expect(api.create).toHaveBeenCalledWith(expect.objectContaining({ restaurantId: 'r1', email: 'a@b.c' }))
    expect(store.add).toHaveBeenCalledWith(created)
    expect(navigate).toHaveBeenCalledWith(['/restaurants/r1/employees'])
  })
})
