import { Pipe, PipeTransform } from '@angular/core'

@Pipe({ name: 'priceFormat', standalone: false })
export class PriceFormatPipe implements PipeTransform {
  transform(price: number | string): string {
    return parseFloat(String(price)).toFixed(2) + ' €'
  }
}
