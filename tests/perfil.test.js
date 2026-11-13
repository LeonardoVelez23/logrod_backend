import { beforeEach, describe, expect, it } from 'vitest';
import { FotoPerfil } from '../src/models/index.js';
import { api, auth, crearCliente, crearEmpleado, limpiarBase, login, PASSWORD } from './helpers.js';

// JPEG mínimo (cabecera FF D8 FF) y un PNG de 1×1.
const JPEG = Buffer.from([0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00]);
const PNG = Buffer.from(
  'iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==',
  'base64'
);

describe('Perfil del cliente (RF-06)', () => {
  let ana, token;

  beforeEach(async () => {
    await limpiarBase();
    ana = await crearCliente({ telefono: '0987654321' });
    token = await login(ana);
  });

  const subir = (imagen) =>
    api().put('/api/v1/perfil/foto').set(auth(token)).send({ imagen });

  it('GET /perfil devuelve sus datos sin secretos y sin foto', async () => {
    const res = await api().get('/api/v1/perfil').set(auth(token));

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({
      id: ana.id,
      correo_electronico: ana.correo_electronico,
      foto_actualizada_en: null
    });
    expect(JSON.stringify(res.body)).not.toMatch(/contrasenia|reset_password/);
  });

  it('PUT /perfil actualiza sus datos', async () => {
    const res = await api()
      .put('/api/v1/perfil')
      .set(auth(token))
      .send({ nombres: 'Ana María', telefono: '', tipo_cliente: 'Docente' });

    expect(res.status).toBe(200);
    expect(res.body.data).toMatchObject({ nombres: 'Ana María', telefono: null, tipo_cliente: 'Docente' });
  });

  it('cambiar la contraseña desde el perfil exige el OTP', async () => {
    const res = await api().put('/api/v1/perfil').set(auth(token)).send({ contrasenia: 'Nueva#2026' });

    expect(res.status).toBe(400);
    expect(res.body.message).toContain('OTP');
  });

  it('solo para clientes', async () => {
    const tokenAdmin = await login(await crearEmpleado('admin'));
    const res = await api().get('/api/v1/perfil').set(auth(tokenAdmin));
    expect(res.status).toBe(403);
  });

  describe('foto', () => {
    it('sube, consulta, reemplaza y quita la foto', async () => {
      const subida = await subir(JPEG.toString('base64'));
      expect(subida.status).toBe(200);
      expect(subida.body.data.foto_actualizada_en).toBeTruthy();

      const perfil = await api().get('/api/v1/perfil').set(auth(token));
      expect(perfil.body.data.foto_actualizada_en).toBeTruthy();

      await subir(PNG.toString('base64'));
      const foto = await api().get('/api/v1/perfil/foto').set(auth(token));
      expect(foto.status).toBe(200);
      expect(foto.body.data.tipo).toBe('image/png');
      expect(foto.body.data.imagen).toBe(PNG.toString('base64'));
      expect(await FotoPerfil.count()).toBe(1);

      const quitar = await api().delete('/api/v1/perfil/foto').set(auth(token));
      expect(quitar.status).toBe(200);
      const sinFoto = await api().get('/api/v1/perfil/foto').set(auth(token));
      expect(sinFoto.status).toBe(404);
    });

    it('rechaza lo que no es JPEG, PNG o WebP', async () => {
      const res = await subir(Buffer.from('<svg onload=alert(1)>').toString('base64'));
      expect(res.status).toBe(400);
      expect(await FotoPerfil.count()).toBe(0);
    });

    it('rechaza texto que no es base64', async () => {
      const res = await subir('esto no es base64!');
      expect(res.status).toBe(400);
    });

    it('rechaza imágenes de más de 600 KB', async () => {
      const grande = Buffer.concat([JPEG, Buffer.alloc(610 * 1024)]);
      const res = await subir(grande.toString('base64'));
      expect(res.status).toBe(400);
      expect(res.body.message).toContain('600 KB');
    });

    it('cada cliente solo ve su foto', async () => {
      await subir(JPEG.toString('base64'));
      const otro = await login(await crearCliente());

      const res = await api().get('/api/v1/perfil/foto').set(auth(otro));

      expect(res.status).toBe(404);
    });

    it('se incluye en Mis datos y se borra al eliminar la cuenta', async () => {
      await subir(JPEG.toString('base64'));

      const datos = await api().get('/api/v1/privacidad/mis-datos').set(auth(token));
      expect(datos.body.data.foto_perfil.imagen_base64).toBe(JPEG.toString('base64'));

      const eliminar = await api()
        .delete('/api/v1/privacidad/mi-cuenta')
        .set(auth(token))
        .send({ contrasenia: PASSWORD });
      expect(eliminar.status).toBe(200);
      expect(await FotoPerfil.count()).toBe(0);
    });
  });
});
