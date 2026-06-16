import { Router } from 'express';
import { listarProductos } from '../controllers/productosController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken);

router.get('/', listarProductos);

export default router;
