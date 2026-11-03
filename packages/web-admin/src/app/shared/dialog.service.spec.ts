import { TestBed } from '@angular/core/testing'
import { DOCUMENT } from '@angular/common'
import { DialogService } from './dialog.service'

describe('DialogService', () => {
  it('confirm y alert delegan en window del documento', () => {
    const view = { confirm: vi.fn(() => true), alert: vi.fn() }
    TestBed.configureTestingModule({ providers: [{ provide: DOCUMENT, useValue: { defaultView: view } }] })
    const dialog = TestBed.inject(DialogService)

    expect(dialog.confirm('x')).toBe(true)
    expect(view.confirm).toHaveBeenCalledWith('x')
    dialog.alert('y')
    expect(view.alert).toHaveBeenCalledWith('y')
  })
})
