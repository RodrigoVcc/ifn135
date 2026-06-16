//Al igual que este hay que eliminarlo
import { Router } from 'express';
import { listarMateriales } from '../controllers/materialesController.js';
import { verificarToken } from '../middleware/auth.js';

const router = Router();

router.use(verificarToken);

router.get('/', listarMateriales);

export default router;
