import { Router } from 'express';
import { listarEmpleados, listarRoles, crearEmpleado, editarEmpleado, eliminarEmpleado } from '../controllers/empleadosController.js';
import { verificarToken, soloRoles } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken, soloRoles('Administrador'));

router.get('/', listarEmpleados);
router.get('/roles', listarRoles);
router.post('/', crearEmpleado);
router.put('/:id', editarEmpleado);
router.delete('/:id', eliminarEmpleado);

export default router;