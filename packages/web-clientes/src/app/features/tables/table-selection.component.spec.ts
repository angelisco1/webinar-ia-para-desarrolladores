import { TestBed, ComponentFixture } from '@angular/core/testing'
import { ActivatedRoute, convertToParamMap } from '@angular/router'
import { of } from 'rxjs'
import { TableSelectionComponent } from './table-selection.component'
import { TableService } from '../../core/services/table.service'
import { Table } from '../../core/models/table.model'

const mk = (id: string, number: number, capacity: number, description: string | null = null): Table => ({
  id, restaurantId: 'r1', number, description, capacity, status: 'libre', createdAt: '', updatedAt: ''
})

describe('TableSelectionComponent', () => {
  let fixture: ComponentFixture<TableSelectionComponent>
  let el: HTMLElement
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
    tableService = { getAvailable: vi.fn().mockReturnValue(of([])), occupy: vi.fn() }
    await TestBed.configureTestingModule({
      imports: [TableSelectionComponent],
      providers: [
        { provide: TableService, useValue: tableService },
        { provide: ActivatedRoute, useValue: { snapshot: { paramMap: convertToParamMap({ id: 'r1' }) } } }
      ]
    }).compileComponents()
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
})
