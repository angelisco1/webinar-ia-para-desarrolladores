import { addIngredient, removeIngredient, ingredientLabel } from './dish-ingredients'

describe('dish-ingredients', () => {
  it('añade un ingrediente sin mutar la lista original', () => {
    const list = []
    expect(addIngredient(list, 'i1', 2)).toEqual([{ ingredientId: 'i1', quantity: 2 }])
    expect(list).toEqual([])
  })

  it('ignora duplicados y cantidades no positivas', () => {
    const list = [{ ingredientId: 'i1', quantity: 2 }]
    expect(addIngredient(list, 'i1', 5)).toEqual(list)
    expect(addIngredient(list, 'i2', 0)).toEqual(list)
  })

  it('quita por ingredientId', () => {
    const list = [{ ingredientId: 'i1', quantity: 2 }, { ingredientId: 'i2', quantity: 1 }]
    expect(removeIngredient(list, 'i1')).toEqual([{ ingredientId: 'i2', quantity: 1 }])
  })

  it('genera la etiqueta del ingrediente', () => {
    const all = [{ id: 'i1', name: 'Sal', unit: 'g' }]
    expect(ingredientLabel(all, 'i1')).toBe('Sal (g)')
    expect(ingredientLabel(all, 'zz')).toBe('zz')
  })
})
