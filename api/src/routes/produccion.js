import { Router } from 'express';
import { listarMaterialUsado,   crearMaterialUsado, listarMateriales, listarProdcutos, listarPedido } from '../controllers/produccionController.js';
import { verificarToken, soloRoles } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken, soloRoles('Administrador','Operario'));

// Obtener listado
router.get('/', listarMaterialUsado);

// Crear registro
router.post('/', crearMaterialUsado);

//Seleccionar material y producto
router.get('/inventario', listarMateriales);
router.get('/productos', listarProdcutos);
router.get('/pedidos', listarPedido);

export default router;



