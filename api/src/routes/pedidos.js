import { Router } from 'express';
import { listarPedidos, crearPedido , editarPedido, eliminarPedido, crearDetallesPedido, editarDetallesPedido, eliminarDetallesPedido, listarProdcutos} from '../controllers/pedidosController.js';
import { verificarToken, soloRoles } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken);

router.get('/', soloRoles('Administrador','Operario','Recepcionista','Instalador'), listarPedidos);
router.get('/:pedido_id/detalle', soloRoles('Administrador','Operario','Recepcionista','Instalador'), listarProdcutos);

router.post('/', soloRoles('Administrador','Recepcionista'), crearPedido);

router.put('/:id', soloRoles('Administrador','Recepcionista'), editarPedido);

router.delete('/:id', soloRoles('Administrador'), eliminarPedido);

router.post('/:pedido_id/detalle', soloRoles('Administrador','Recepcionista'), crearDetallesPedido);
router.put('/:pedido_id/detalle/:id', soloRoles('Administrador','Recepcionista'), editarDetallesPedido);
router.delete('/:pedido_id/detalle/:id', soloRoles('Administrador'), eliminarDetallesPedido);

export default router;
