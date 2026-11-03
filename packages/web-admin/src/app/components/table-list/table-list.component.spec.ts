import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap, provideRouter } from '@angular/router'
import { of, throwError } from 'rxjs'
import { TableApi } from '../../api/table.api'
import { DialogService } from '../../shared/dialog.service'
import { Table } from '../../models/table.model'
import { TableListComponent } from './table-list.component'

const table = (over: Partial<Table> = {}): Table => ({
  id: 't1', restaurantId: 'r1', number: 1, description: 'Terraza', capacity: 4, status: 'libre',
  createdAt: '', updatedAt: '', ...over
})

describe('TableListComponent', () => {
  let api: any
  let dialog: any

  function setup(): ComponentFixture<TableListComponent> {
    TestBed.configureTestingModule({
      declarations: [TableListComponent],
      schemas: [NO_ERRORS_SCHEMA],
      providers: [
        provideRouter([]),
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ restaurantId: 'r1' }) } } },
        { provide: TableApi, useValue: api },
        { provide: DialogService, useValue: dialog }
      ]
    })
    const fixture = TestBed.createComponent(TableListComponent)
    fixture.detectChanges()
    return fixture
  }

  beforeEach(() => {
    api = { list: vi.fn(() => of([])), remove: vi.fn(() => of(undefined)) }
    dialog = { confirm: vi.fn(() => true), alert: vi.fn() }
  })

  it('renderiza una fila por mesa con número, descripción, capacidad y estado', () => {
    api.list.mockReturnValue(of([table(), table({ id: 't2', number: 2, description: null, capacity: 2, status: 'ocupada' })]))
    const fixture = setup()
    const rows = fixture.nativeElement.querySelectorAll('tbody tr')
    expect(api.list).toHaveBeenCalledWith('r1')
    expect(rows.length).toBe(2)
    expect(rows[0].textContent).toContain('Terraza')
    expect(rows[0].textContent).toContain('4')
    expect(rows[0].textContent).toContain('libre')
    expect(rows[1].textContent).toContain('ocupada')
  })

  it('muestra "Sin mesas" si no hay ninguna', () => {
    const fixture = setup()
    expect(fixture.nativeElement.textContent).toContain('Sin mesas')
  })

  it('muestra el error si falla la carga', () => {
    api.list.mockReturnValue(throwError(() => ({ error: { message: 'boom' } })))
    const fixture = setup()
    expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain('No se pudieron cargar las mesas')
  })

  it('borrar pide confirmación, llama a remove y recarga', () => {
    api.list.mockReturnValue(of([table()]))
    const fixture = setup()
    fixture.componentInstance.deleteTable('t1')
    expect(dialog.confirm).toHaveBeenCalled()
    expect(api.remove).toHaveBeenCalledWith('r1', 't1')
    expect(api.list).toHaveBeenCalledTimes(2)
  })

  it('no borra si se cancela la confirmación', () => {
    dialog.confirm.mockReturnValue(false)
    const fixture = setup()
    fixture.componentInstance.deleteTable('t1')
    expect(api.remove).not.toHaveBeenCalled()
  })

  it('ante un 409 muestra el message del API', () => {
    api.remove.mockReturnValue(throwError(() => ({ status: 409, error: { message: 'La mesa está en uso' } })))
    const fixture = setup()
    fixture.componentInstance.deleteTable('t1')
    fixture.detectChanges()
    expect(fixture.nativeElement.querySelector('.alert-error').textContent).toContain('La mesa está en uso')
  })
})
