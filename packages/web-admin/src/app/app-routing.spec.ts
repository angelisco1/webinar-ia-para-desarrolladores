import { TestBed } from '@angular/core/testing'
import { ROUTES, Route } from '@angular/router'
import { AppRoutingModule } from './app-routing.module'
import { ShellComponent } from './components/shell/shell.component'
import { TableListComponent } from './components/table-list/table-list.component'
import { TableFormComponent } from './components/table-form/table-form.component'

describe('rutas de mesas', () => {
  const shellChildren = (): Route[] => {
    TestBed.configureTestingModule({ imports: [AppRoutingModule] })
    const routes = (TestBed.inject(ROUTES) as Route[][]).flat()
    return routes.find(r => r.component === ShellComponent)!.children!
  }

  it.each([
    ['restaurants/:restaurantId/tables', TableListComponent],
    ['restaurants/:restaurantId/tables/new', TableFormComponent],
    ['restaurants/:restaurantId/tables/:id/edit', TableFormComponent]
  ])('%s es hija del shell', (path, component) => {
    expect(shellChildren().find(r => r.path === path)?.component).toBe(component)
  })
})
