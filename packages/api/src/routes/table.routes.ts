import { Router } from 'express'
import { TableController } from '@controllers/table.controller.js'
import { dbConfig } from '@config/database.js'
import { SqliteTableRepository } from '@repositories/table.repository.js'
import { TableService } from '@services/table.service.js'
import { authenticate, authorize } from '@shared/infrastructure/http/middlewares.js'

const tableRepository = new SqliteTableRepository(dbConfig)
const tableService = new TableService(tableRepository)
const tableController = new TableController(tableService)

const router = Router({ mergeParams: true })

const staff = authorize(['admin', 'manager', 'camarero'])

router.get('/', authenticate, staff, tableController.getAll)
router.post('/', authenticate, authorize(['admin']), tableController.create)
router.get('/available', authenticate, tableController.getAvailable)
router.get('/:tableId', authenticate, staff, tableController.getById)
router.put('/:tableId', authenticate, authorize(['admin']), tableController.update)
router.delete('/:tableId', authenticate, authorize(['admin']), tableController.remove)
router.patch('/:tableId/status', authenticate, staff, tableController.changeStatus)
router.post('/:tableId/occupy', authenticate, tableController.occupy)

export default router
