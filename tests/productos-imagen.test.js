import { beforeEach, describe, expect, it } from 'vitest';
import { Categoria } from '../src/models/index.js';
import { api, auth, crearEmpleado, crearProducto, limpiarBase, login } from './helpers.js';

// Las imágenes viven en los assets de la app móvil; la API solo guarda y
// envía el nombre del archivo (`imagen_codigo`), sin URL ni subida.
describe('Productos: imagen_codigo', () => {
  let token, categoria;

  beforeEach(async () => {
    await limpiarBase();
    token = await login(await crearEmpleado('admin'));
    categoria = await Categoria.create({ nombre: 'Platos Fuertes' });
  });

  const nuevo = (datos = {}) => ({
    codigo: 'P100',
    nombre: 'Bandeja Paisa',
    precio: 14.9,
    categoria_id: categoria.id,
    ...datos
  });

  it('crea un producto con imagen_codigo y lo devuelve sin imagen_url', async () => {
    const res = await api()
      .post('/api/v1/productos')
      .set(auth(token))
      .send(nuevo({ imagen_codigo: 'bandeja_paisa' }));

    expect(res.status).toBe(201);
    expect(res.body.data.imagen_codigo).toBe('bandeja_paisa');
    expect(res.body.data).not.toHaveProperty('imagen_url');
  });

  it('sin imagen_codigo el producto queda con null', async () => {
    const res = await api().post('/api/v1/productos').set(auth(token)).send(nuevo());

    expect(res.status).toBe(201);
    expect(res.body.data.imagen_codigo).toBeNull();
  });

  it.each(['../secreto', 'Con Espacios', 'Mayusculas', 'img.png', 'a'.repeat(61)])(
    'rechaza el código inválido %s',
    async (codigo) => {
      const res = await api()
        .post('/api/v1/productos')
        .set(auth(token))
        .send(nuevo({ imagen_codigo: codigo }));

      expect(res.status).toBe(400);
    }
  );

  it('actualiza y borra el imagen_codigo', async () => {
    const producto = await crearProducto();

    const cambio = await api()
      .put(`/api/v1/productos/${producto.id}`)
      .set(auth(token))
      .send({ imagen_codigo: 'flan_caramelo' });
    expect(cambio.status).toBe(200);
    expect(cambio.body.data.imagen_codigo).toBe('flan_caramelo');

    const borrado = await api()
      .put(`/api/v1/productos/${producto.id}`)
      .set(auth(token))
      .send({ imagen_codigo: '' });
    expect(borrado.status).toBe(200);
    expect(borrado.body.data.imagen_codigo).toBeNull();
  });

  it('el catálogo público envía imagen_codigo', async () => {
    await crearProducto({ imagen_codigo: 'nachos' });

    const res = await api().get('/api/v1/productos');

    expect(res.status).toBe(200);
    expect(res.body.data[0].imagen_codigo).toBe('nachos');
    expect(res.body.data[0]).not.toHaveProperty('imagen_url');
  });

  it('ya no existe la subida de imágenes', async () => {
    const producto = await crearProducto();

    const res = await api()
      .post(`/api/v1/productos/${producto.id}/imagen`)
      .set(auth(token));

    expect(res.status).toBe(404);
  });
});
