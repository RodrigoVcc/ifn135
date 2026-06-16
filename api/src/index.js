import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import authRoutes      from './routes/auth.js';
import empleadosRoutes from './routes/empleados.js';
import pedidosRuta     from './routes/pedidos.js';
import produccionruta  from './routes/produccion.js';
import inventarioRuta  from './routes/inventario.js';
import productosRuta   from './routes/productos.js';
import materialesRuta  from './routes/materiales.js';
import restockRuta     from './routes/restock.js';
import path from 'path';
import { fileURLToPath } from 'url';

const app = express();
const PORT = process.env.PORT ?? 3000;
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const distPath = path.join(__dirname, '../../web/dist');


app.use(cors({
  origin: process.env.CLIENT_URL ?? 'http://localhost:5173',
  credentials: true,
}));
app.use(express.json());

app.use('/api/auth',      authRoutes);
app.use('/api/empleados', empleadosRoutes);
app.use('/api/pedidos', pedidosRuta);
app.use('/api/produccion', produccionruta);
app.use('/api/inventario', inventarioRuta);
app.use('/api/productos',  productosRuta);
app.use('/api/materiales', materialesRuta);
app.use('/api/restock',    restockRuta);

console.log('DATABASE_URL:', process.env.DATABASE_URL);
app.listen(PORT, '0.0.0.0', () => {
  console.log(`API corriendo en puerto ${PORT}`);
});


app.use(express.static(distPath));

app.get('*', (req, res) => {
  res.sendFile(path.join(distPath, 'index.html'));
});