import { AfterViewInit, Directive, ElementRef, inject } from '@angular/core'

@Directive({ selector: '[appAutofocus]', standalone: false })
export class AutofocusDirective implements AfterViewInit {
  private el = inject<ElementRef<HTMLElement>>(ElementRef)

  ngAfterViewInit(): void {
    this.el.nativeElement.focus()
  }
}
