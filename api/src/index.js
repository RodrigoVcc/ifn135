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

const app = express();
const PORT = process.env.PORT ?? 3000;

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

app.listen(PORT, () => {
  console.log(`API corriendo en http://localhost:${PORT}`);
});
