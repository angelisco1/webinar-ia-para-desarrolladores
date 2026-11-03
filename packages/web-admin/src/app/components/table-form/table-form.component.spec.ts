import { NO_ERRORS_SCHEMA } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TableApi } from '../../api/table.api'
import { TableFormComponent } from './table-form.component'

describe('TableFormComponent', () => {
  let api: any
  let navigate: any

  function setup(params: Record<string, string> = { restaurantId: 'r1' }): TableFormComponent {
    TestBed.configureTestingModule({
      declarations: [TableFormComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap(params) } } },
        { provide: Router, useValue: { navigate } },
        { provide: TableApi, useValue: api }
      ]
    })
    const cmp = TestBed.createComponent(TableFormComponent).componentInstance
    cmp.ngOnInit()
    return cmp
  }

  beforeEach(() => {
    navigate = vi.fn()
    api = { create: vi.fn(() => of({})), update: vi.fn(() => of({})), get: vi.fn() }
  })

  it.each([
    [{ number: null, capacity: 4 }],
    [{ number: 0, capacity: 4 }],
    [{ number: 1, capacity: 0 }],
    [{ number: 1, capacity: null }]
  ])('con datos inválidos %j muestra el error sin llamar a la API', data => {
    const cmp = setup()
    Object.assign(cmp.table, data)
    cmp.save()
    expect(cmp.error).toBeTruthy()
    expect(api.create).not.toHaveBeenCalled()
  })

  it('en modo crear llama a create y navega al listado', () => {
    const cmp = setup()
    Object.assign(cmp.table, { number: 3, description: 'Barra', capacity: 2 })
    cmp.save()
    expect(api.create).toHaveBeenCalledWith('r1', { number: 3, description: 'Barra', capacity: 2, status: 'libre' })
    expect(navigate).toHaveBeenCalledWith(['/restaurants/r1/tables'])
  })

  it('en modo editar carga la mesa y llama a update', () => {
    api.get.mockReturnValue(of({ id: 't1', number: 1, description: 'Terraza', capacity: 4, status: 'ocupada' }))
    const cmp = setup({ restaurantId: 'r1', id: 't1' })
    expect(api.get).toHaveBeenCalledWith('r1', 't1')
    expect(cmp.table.number).toBe(1)
    cmp.table.capacity = 6
    cmp.save()
    expect(api.update).toHaveBeenCalledWith('r1', 't1', { number: 1, description: 'Terraza', capacity: 6, status: 'ocupada' })
    expect(navigate).toHaveBeenCalledWith(['/restaurants/r1/tables'])
  })

  it('un 409 de número duplicado muestra el mensaje del API y no navega', () => {
    api.create.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'Ya existe una mesa con ese número' } })))
    const cmp = setup()
    Object.assign(cmp.table, { number: 1, capacity: 4 })
    cmp.save()
    expect(cmp.error).toBe('Ya existe una mesa con ese número')
    expect(cmp.loading).toBe(false)
    expect(navigate).not.toHaveBeenCalled()
  })
})
