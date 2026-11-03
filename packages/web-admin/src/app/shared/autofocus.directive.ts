import { AfterViewInit, Directive, ElementRef, Input, inject } from '@angular/core'

// Uso: `appAutofocus` (siempre) o `[appAutofocus]="condicion"`
@Directive({ selector: '[appAutofocus]' })
export class AutofocusDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef)

  @Input() appAutofocus: boolean | '' = ''

  ngAfterViewInit(): void {
    if (this.appAutofocus !== false) this.el.nativeElement.focus()
  }
}
