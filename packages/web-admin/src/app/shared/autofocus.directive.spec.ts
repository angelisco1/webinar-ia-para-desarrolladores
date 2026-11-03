import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AutofocusDirective } from './autofocus.directive'

@Component({
  selector: 'app-host',
  standalone: false,
  template: '<input id="a"><input id="b" appAutofocus>'
})
class HostComponent {}

describe('AutofocusDirective', () => {
  it('enfoca el elemento al inicializarse', () => {
    TestBed.configureTestingModule({ declarations: [HostComponent, AutofocusDirective] })
    const fixture = TestBed.createComponent(HostComponent)
    document.body.appendChild(fixture.nativeElement)
    fixture.detectChanges()
    expect(document.activeElement?.id).toBe('b')
  })
})
