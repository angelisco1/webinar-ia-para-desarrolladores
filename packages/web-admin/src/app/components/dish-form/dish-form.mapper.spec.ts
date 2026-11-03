import { toDishDto, DishFormValue } from './dish-form.mapper'

describe('toDishDto', () => {
  const value: DishFormValue = {
    name: 'Tortilla',
    description: null,
    price: '12.5',
    category: 'principal',
    available: true,
    ingredients: [{ ingredientId: 'i1', quantity: 2 }]
  }

  it('convierte el precio a número', () => {
    expect(toDishDto(value).price).toBe(12.5)
  })

  it('no incluye campos extra y conserva description null', () => {
    const dto = toDishDto({ ...value, id: 'd1', restaurantId: 'r1' } as DishFormValue)
    expect(Object.keys(dto).sort()).toEqual(['available', 'category', 'description', 'ingredients', 'name', 'price'])
    expect(dto.description).toBeNull()
  })
})
