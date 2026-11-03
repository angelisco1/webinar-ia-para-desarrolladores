import { TestBed } from '@angular/core/testing'
import { signal } from '@angular/core'
import { provideRouter } from '@angular/router'
import { AuthService, AuthStore } from '@resttek/web-shared'
import { ShellComponent } from './shell.component'

describe('ShellComponent', () => {
  function create(role: string) {
    TestBed.configureTestingModule({
      imports: [ShellComponent],
      providers: [
        provideRouter([]),
        { provide: AuthService, useValue: { logout: vi.fn() } },
        { provide: AuthStore, useValue: { user: signal({ role, restaurantId: 'r1' }), userRole: signal(role) } },
      ],
    })
    return TestBed.createComponent(ShellComponent).componentInstance
  }

  it.each([
    ['camarero', true],
    ['manager', true],
    ['cocinero', false],
  ])('canSeeMesas para %s es %s', (role, expected) => {
    expect(create(role).canSeeMesas()).toBe(expected)
  })
})
