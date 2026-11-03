import { Injectable, inject } from '@angular/core'
import { DOCUMENT } from '@angular/common'

// Envuelve los diálogos nativos para poder sustituirlos en tests
@Injectable({ providedIn: 'root' })
export class DialogService {
  private view = inject(DOCUMENT).defaultView

  confirm(message: string): boolean {
    return this.view?.confirm(message) ?? false
  }

  alert(message: string): void {
    this.view?.alert(message)
  }
}
