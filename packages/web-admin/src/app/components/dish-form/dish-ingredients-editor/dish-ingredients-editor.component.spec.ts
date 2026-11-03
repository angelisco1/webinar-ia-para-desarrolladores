import { NO_ERRORS_SCHEMA } from '@angular/core'
import { ComponentFixture, TestBed } from '@angular/core/testing'
import { FormsModule } from '@angular/forms'
import { DishIngredientsEditorComponent } from './dish-ingredients-editor.component'

describe('DishIngredientsEditorComponent', () => {
  let fixture: ComponentFixture<DishIngredientsEditorComponent>
  let emitted: any[]
  const el = () => fixture.nativeElement as HTMLElement

  function setup(selected: any[] = []) {
    TestBed.configureTestingModule({
      declarations: [DishIngredientsEditorComponent],
      imports: [FormsModule],
      schemas: [NO_ERRORS_SCHEMA]
    })
    fixture = TestBed.createComponent(DishIngredientsEditorComponent)
    fixture.componentRef.setInput('all', [{ id: 'i1', name: 'Sal', unit: 'g' }])
    fixture.componentRef.setInput('selected', selected)
    emitted = []
    fixture.componentInstance.selectedChange.subscribe(v => emitted.push(v))
    fixture.detectChanges()
  }

  it('emite la lista con el ingrediente elegido al pulsar +', () => {
    setup()
    const select = el().querySelector('select') as HTMLSelectElement
    select.value = 'i1'
    select.dispatchEvent(new Event('change'))
    const qty = el().querySelector('input[type=number]') as HTMLInputElement
    qty.value = '2'
    qty.dispatchEvent(new Event('input'))
    ;(el().querySelector('.add-ingredient-row .btn') as HTMLElement).click()

    expect(emitted).toEqual([[{ ingredientId: 'i1', quantity: 2 }]])
  })

  it('muestra la chip y emite la lista sin el ingrediente al pulsar la papelera', () => {
    setup([{ ingredientId: 'i1', quantity: 2 }])
    expect(el().querySelector('.ingredient-chip')?.textContent).toContain('Sal (g) — 2')
    ;(el().querySelector('.chip-remove') as HTMLElement).click()

    expect(emitted).toEqual([[]])
  })
})
