import { extractApiError } from './api-error'

describe('extractApiError', () => {
  it('devuelve el mensaje de la API', () => {
    expect(extractApiError({ error: { message: 'Nombre duplicado' } }, 'x')).toBe('Nombre duplicado')
  })

  it('devuelve el fallback si no hay mensaje', () => {
    expect(extractApiError({}, 'fallback')).toBe('fallback')
    expect(extractApiError(null, 'fallback')).toBe('fallback')
  })
})
