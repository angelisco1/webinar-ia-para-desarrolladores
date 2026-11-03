import { CategoryLabelPipe } from './category-label.pipe'

describe('CategoryLabelPipe', () => {
  const pipe = new CategoryLabelPipe()

  it('devuelve la etiqueta de la categoría', () => {
    expect(pipe.transform('postre')).toBe('Postre')
  })

  it('devuelve el valor tal cual si la categoría es desconocida', () => {
    expect(pipe.transform('otra')).toBe('otra')
  })
})
