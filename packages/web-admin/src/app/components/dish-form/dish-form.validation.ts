export interface DishFormErrors {
  name?: true
  price?: true
}

export function validateDishForm(value: { name: string; price: string | number }): DishFormErrors {
  const errors: DishFormErrors = {}
  if (!value.name) errors.name = true
  const price = Number(value.price)
  if (!value.price || isNaN(price) || price <= 0) errors.price = true
  return errors
}
