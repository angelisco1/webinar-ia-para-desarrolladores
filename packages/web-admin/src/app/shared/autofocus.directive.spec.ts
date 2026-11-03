import { Component } from '@angular/core'
import { TestBed } from '@angular/core/testing'
import { AutofocusDirective } from './autofocus.directive'

@Component({
  selector: 'app-host',
  imports: [AutofocusDirective],
  template: '<input id="a"><input id="b" [appAutofocus]="focus">'
})
class HostComponent {
  focus: boolean | '' = ''
}

describe('AutofocusDirective', () => {
  function create(focus: boolean | '') {
    TestBed.configureTestingModule({ imports: [HostComponent] })
    const fixture = TestBed.createComponent(HostComponent)
    fixture.componentInstance.focus = focus
    document.body.appendChild(fixture.nativeElement)
    fixture.detectChanges()
    return fixture
  }

  it('enfoca el elemento al inicializarse', () => {
    const fixture = create('')
    expect(document.activeElement?.id).toBe('b')
    fixture.nativeElement.remove()
  })

  it('no enfoca si se le pasa false', () => {
    const fixture = create(false)
    expect(document.activeElement?.id).not.toBe('b')
    fixture.nativeElement.remove()
  })
})
