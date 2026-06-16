import { Router } from 'express';
import { listarInventario, crearInventario, editarInventario,
    eliminarInventario, listarInventarioProductos, crearProductos,
    editarProducto, eliminarProducto, listarCategorias, listarUnidades } from '../controllers/inventarioController.js';
import { verificarToken, soloRoles } from '../middleware/auth.js';


const router = Router();

router.use(verificarToken);

router.get('/', soloRoles('Administrador','Operario','Recepcionista'), listarInventario);
router.post('/', soloRoles('Administrador'), crearInventario);
router.put('/:id', soloRoles('Administrador'), editarInventario);
router.delete('/:id', soloRoles('Administrador'), eliminarInventario);
router.get('/categorias', soloRoles('Administrador','Operario'), listarCategorias);
router.get('/unidades', soloRoles('Administrador','Operario'), listarUnidades);

router.get('/productos', soloRoles('Administrador','Operario'), listarInventarioProductos);
router.post('/productos', soloRoles('Administrador','Operario'), crearProductos);
router.put('/productos/:id', soloRoles('Administrador','Operario'), editarProducto);
router.delete('/productos/:id', soloRoles('Administrador'), eliminarProducto);

export default router;
