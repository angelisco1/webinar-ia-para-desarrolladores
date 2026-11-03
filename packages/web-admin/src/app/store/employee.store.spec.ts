import { TestBed } from '@angular/core/testing'
import { Subject, of } from 'rxjs'
import { EmployeeApi } from '../api/employee.api'
import { Employee } from '../models/employee.model'
import { EmployeeStore } from './employee.store'

describe('EmployeeStore', () => {
  const e1 = { id: 'e1' } as Employee
  const e2 = { id: 'e2' } as Employee
  let api: { list: any }
  let store: EmployeeStore

  beforeEach(() => {
    api = { list: vi.fn(() => of([e1])) }
    TestBed.configureTestingModule({ providers: [{ provide: EmployeeApi, useValue: api }] })
    store = TestBed.inject(EmployeeStore)
  })

  it('load vacía la lista antes de cargar y la rellena después', async () => {
    await store.load('r1')
    expect(store.employees()).toEqual([e1])
    const subject = new Subject<Employee[]>()
    api.list.mockReturnValue(subject)
    const p = store.load('r2')
    expect(store.employees()).toEqual([])
    subject.next([e2])
    subject.complete()
    await p
    expect(api.list).toHaveBeenLastCalledWith('r2')
    expect(store.employees()).toEqual([e2])
  })

  it('add añade al final', async () => {
    await store.load('r1')
    store.add(e2)
    expect(store.employees()).toEqual([e1, e2])
  })
})
