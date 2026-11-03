import { DISH_CATEGORIES } from './dish.model'

describe('DISH_CATEGORIES', () => {
  it('etiqueta cada categoría', () => {
    expect(DISH_CATEGORIES.principal).toBe('Principal')
  })

  it('mantiene el orden de las categorías', () => {
    expect(Object.keys(DISH_CATEGORIES)).toEqual(['entrante', 'principal', 'postre', 'bebida'])
  })
})
