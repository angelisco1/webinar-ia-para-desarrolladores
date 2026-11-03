import { validateDishForm } from './dish-form.validation'

describe('validateDishForm', () => {
  it('marca el nombre vacío', () => {
    expect(validateDishForm({ name: '', price: 5 })).toEqual({ name: true })
  })

  it.each([0, 'abc', -1])('marca el precio inválido %s', price => {
    expect(validateDishForm({ name: 'Plato', price })).toEqual({ price: true })
  })

  it('devuelve vacío con datos válidos', () => {
    expect(validateDishForm({ name: 'Plato', price: '5.5' })).toEqual({})
  })
})
