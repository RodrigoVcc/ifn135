import { Router } from 'express';
import { listarRestock, crearRestock, aprobarRestock, rechazarRestock } from '../controllers/restockController.js';
import { verificarToken, soloRoles } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRoles('Administrador', 'Recepcionista'), listarRestock);
router.post('/', soloRoles('Recepcionista'), crearRestock);
router.put('/:id/aprobar', soloRoles('Administrador'), aprobarRestock);
router.put('/:id/rechazar', soloRoles('Administrador'), rechazarRestock);

export default router;
