import { PriceFormatPipe } from './price-format.pipe'

describe('PriceFormatPipe', () => {
  const pipe = new PriceFormatPipe()

  it('formatea un número con dos decimales y €', () => {
    expect(pipe.transform(12.5)).toBe('12.50 €')
  })

  it('formatea un string numérico', () => {
    expect(pipe.transform('7')).toBe('7.00 €')
  })
})
