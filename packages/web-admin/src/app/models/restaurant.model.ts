export interface Restaurant {
  id: string
  name: string
  address: string
  email: string
  phone: string
  ownerFirstName: string
  ownerLastName: string
  logoUrl: string | null
}

export type RestaurantDto = Omit<Restaurant, 'id'>
