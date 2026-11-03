import { TestBed, ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, Router, convertToParamMap } from '@angular/router'
import { of, throwError, Subject } from 'rxjs'
import { HttpErrorResponse } from '@angular/common/http'
import { TableSelectionComponent } from './table-selection.component'
import { TableService } from '../../core/services/table.service'
import { TableSessionStore } from '../../core/store/table-session.store'
import { Table } from '../../core/models/table.model'

const mk = (id: string, number: number, capacity: number, description: string | null = null): Table => ({
  id, restaurantId: 'r1', number, description, capacity, status: 'libre', createdAt: '', updatedAt: ''
})

describe('TableSelectionComponent', () => {
  let fixture: ComponentFixture<TableSelectionComponent>
  let el: HTMLElement
  let router: { navigate: ReturnType<typeof vi.fn> }
  let session: TableSessionStore
  let tableService: { getAvailable: ReturnType<typeof vi.fn>; occupy: ReturnType<typeof vi.fn> }

  const setGuests = async (value: string) => {
    const input = el.querySelector('input') as HTMLInputElement
    input.value = value
    input.dispatchEvent(new Event('input'))
    await fixture.whenStable()
  }
  const search = async () => {
    ;(el.querySelector('button.search') as HTMLButtonElement).click()
    await fixture.whenStable()
  }

  beforeEach(async () => {
    router = { navigate: vi.fn() }
    tableService = { getAvailable: vi.fn().mockReturnValue(of([])), occupy: vi.fn() }
    await TestBed.configureTestingModule({
      imports: [TableSelectionComponent],
      providers: [
        { provide: TableService, useValue: tableService },
        { provide: Router, useValue: router },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'r1' }) } } }
      ]
    }).compileComponents()
    session = TestBed.inject(TableSessionStore)
    fixture = TestBed.createComponent(TableSelectionComponent)
    el = fixture.nativeElement
    await fixture.whenStable()
  })

  it('busca mesas para 4 personas y pinta una tarjeta por mesa', async () => {
    tableService.getAvailable.mockReturnValue(of([mk('t1', 1, 4, 'Terraza'), mk('t2', 2, 6)]))
    await setGuests('4')
    await search()

    expect(tableService.getAvailable).toHaveBeenCalledWith('r1', 4)
    const cards = el.querySelectorAll('.table-card')
    expect(cards.length).toBe(2)
    expect(cards[0].textContent).toContain('1')
    expect(cards[0].textContent).toContain('Terraza')
    expect(cards[0].textContent).toContain('4')
  })

  it('sin resultados muestra el mensaje', async () => {
    await setGuests('4')
    await search()
    expect(el.textContent).toContain('No hay mesas libres para 4 personas')
  })

  it.each(['', '0', '2.5', '-1'])('personas inválidas (%s) muestran validación y no llaman a la API', async (value) => {
    await setGuests(value)
    await search()
    expect(tableService.getAvailable).not.toHaveBeenCalled()
    expect(el.querySelector('.validation')).not.toBeNull()
  })

  it('Continuar está deshabilitado hasta elegir una mesa', async () => {
    tableService.getAvailable.mockReturnValue(of([mk('t1', 1, 4)]))
    await setGuests('4')
    await search()
    const btn = el.querySelector('button.continue') as HTMLButtonElement
    expect(btn.disabled).toBe(true)

    ;(el.querySelector('.table-card') as HTMLElement).click()
    await fixture.whenStable()
    expect(btn.disabled).toBe(false)
  })

  describe('Continuar', () => {
    const t1 = mk('t1', 1, 4)
    const prepare = async () => {
      tableService.getAvailable.mockReturnValue(of([t1]))
      await setGuests('4')
      await search()
      ;(el.querySelector('.table-card') as HTMLElement).click()
      await fixture.whenStable()
    }
    const cont = async () => {
      ;(el.querySelector('button.continue') as HTMLButtonElement).click()
      await fixture.whenStable()
    }

    it('ocupa la mesa, la guarda en el store y navega a la carta', async () => {
      const occupied = { ...t1, status: 'ocupada' as const }
      tableService.occupy.mockReturnValue(of(occupied))
      await prepare()
      await cont()

      expect(tableService.occupy).toHaveBeenCalledWith('r1', 't1')
      expect(session.table()).toEqual(occupied)
      expect(session.restaurantId()).toBe('r1')
      expect(router.navigate).toHaveBeenCalledWith(['/restaurants', 'r1'])
    })

    it('ante 409 avisa, no guarda mesa y recarga las mesas', async () => {
      tableService.occupy.mockReturnValue(
        throwError(() => new HttpErrorResponse({ status: 409, error: { error: 'TableNotAvailableError' } }))
      )
      await prepare()
      tableService.getAvailable.mockClear()
      await cont()

      expect(el.textContent).toContain('Esa mesa acaba de ser ocupada, elige otra')
      expect(session.table()).toBeNull()
      expect(router.navigate).not.toHaveBeenCalled()
      expect(tableService.getAvailable).toHaveBeenCalledWith('r1', 4)
    })

    it('evita el doble envío mientras carga', async () => {
      tableService.occupy.mockReturnValue(new Subject<Table>())
      await prepare()
      await cont()
      await cont()
      expect(tableService.occupy).toHaveBeenCalledTimes(1)
    })
  })
})
