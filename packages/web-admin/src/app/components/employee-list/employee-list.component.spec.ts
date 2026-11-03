import { NO_ERRORS_SCHEMA, signal } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, RouterLink, convertToParamMap, provideRouter } from '@angular/router'
import { EmployeeStore } from '../../store/employee.store'
import { EmployeeListComponent } from './employee-list.component'

describe('EmployeeListComponent', () => {
  let fixture: ComponentFixture<EmployeeListComponent>
  let store: any

  beforeEach(() => {
    store = { employees: signal([]), load: vi.fn(() => Promise.resolve()) }
    TestBed.configureTestingModule({
      declarations: [EmployeeListComponent],
      imports: [RouterLink],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ restaurantId: 'r1' }) } } },
        { provide: EmployeeStore, useValue: store }
      ]
    })
    fixture = TestBed.createComponent(EmployeeListComponent)
    fixture.detectChanges()
  })

  it('carga los empleados del restaurante de la ruta', () => {
    expect(store.load).toHaveBeenCalledWith('r1')
  })

  it('el enlace "nuevo" apunta al restaurante de la ruta', () => {
    const link = fixture.nativeElement.querySelector('a.btn-primary') as HTMLAnchorElement
    expect(link.getAttribute('href')).toBe('/restaurants/r1/employees/new')
  })
})
