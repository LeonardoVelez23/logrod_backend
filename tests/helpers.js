import bcrypt from 'bcryptjs';
import request from 'supertest';
import app from '../src/app.js';
import {
  sequelize,
  Categoria,
  Producto,
  Cliente,
  Empleado,
  Pedido,
  DetallePedido
} from '../src/models/index.js';

export const api = () => request(app);
export const PASSWORD = 'Clave#123';

export const limpiarBase = () => sequelize.truncate({ cascade: true, restartIdentity: true });

let contador = 0;
const siguiente = () => ++contador;

export const crearCliente = async (datos = {}) => {
  const n = siguiente();
  return Cliente.create({
    identificacion: `13000000${n}`.slice(-10),
    nombres: `Cliente${n}`,
    apellidos: 'Prueba',
    correo_electronico: `cliente${n}@prueba.test`,
    tipo_cliente: 'Estudiante',
    contrasenia: await bcrypt.hash(PASSWORD, 4),
    ...datos
  });
};

export const crearEmpleado = async (cargo, datos = {}) => {
  const n = siguiente();
  return Empleado.create({
    identificacion: `09000000${n}`.slice(-10),
    nombres: `Empleado${n}`,
    apellidos: 'Prueba',
    correo_electronico: `${cargo}${n}@prueba.test`,
    cargo,
    contrasenia: await bcrypt.hash(PASSWORD, 4),
    ...datos
  });
};

export const login = async (usuario) => {
  const res = await api()
    .post('/api/v1/auth/login')
    .send({ email: usuario.correo_electronico, password: PASSWORD });
  if (!res.body.token) throw new Error(`Login falló: ${JSON.stringify(res.body)}`);
  return res.body.token;
};

export const crearProducto = async (datos = {}) => {
  const n = siguiente();
  const categoria = await Categoria.create({ nombre: `Categoria${n}` });
  return Producto.create({
    codigo: `P${n}`,
    nombre: `Producto${n}`,
    precio: 2.5,
    cantidad_disponible: 20,
    estado: 'disponible',
    categoria_id: categoria.id,
    ...datos
  });
};

/** Pedido creado directamente en BD, sin pasar por la API. */
export const crearPedido = async (cliente, { estado = 'solicitado', empleado = null } = {}) => {
  const producto = await crearProducto();
  const pedido = await Pedido.create({
    fecha: '2026-11-11',
    hora: '12:00',
    modalidad: 'en línea',
    estado,
    valor_total: 5,
    cliente_id: cliente.id,
    empleado_id: empleado?.id ?? null
  });
  await DetallePedido.create({
    pedido_id: pedido.id,
    producto_id: producto.id,
    cantidad: 2,
    precio_unitario: 2.5,
    subtotal: 5
  });
  return pedido;
};

export const auth = (token) => ({ Authorization: `Bearer ${token}` });
