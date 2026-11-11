import { beforeEach, describe, expect, it } from 'vitest';
import { Empleado } from '../src/models/index.js';
import { api, auth, crearEmpleado, limpiarBase, login } from './helpers.js';

describe('Empleados: escalada de privilegios', () => {
  let admin, mesero, otroMesero, tokenMesero;

  beforeEach(async () => {
    await limpiarBase();
    admin = await crearEmpleado('admin');
    mesero = await crearEmpleado('mesero', { turno_trabajo: 'mañana' });
    otroMesero = await crearEmpleado('mesero');
    tokenMesero = await login(mesero);
  });

  it('un mesero no puede cambiarse el cargo a admin', async () => {
    const res = await api()
      .put(`/api/v1/empleados/${mesero.id}`)
      .set(auth(tokenMesero))
      .send({ cargo: 'admin' });

    expect(res.status).toBe(403);
    await mesero.reload();
    expect(mesero.cargo).toBe('mesero');
  });

  it('un mesero no puede cambiarse el turno', async () => {
    const res = await api()
      .put(`/api/v1/empleados/${mesero.id}`)
      .set(auth(tokenMesero))
      .send({ turno_trabajo: 'noche' });

    expect(res.status).toBe(403);
  });

  it('un mesero sí puede editar sus datos aunque reenvíe su mismo cargo', async () => {
    const res = await api()
      .put(`/api/v1/empleados/${mesero.id}`)
      .set(auth(tokenMesero))
      .send({ nombres: 'Nuevo', cargo: 'mesero', turno_trabajo: 'mañana' });

    expect(res.status).toBe(200);
    expect(res.body.data.nombres).toBe('Nuevo');
  });

  it('el admin sí puede cambiar el cargo de un empleado', async () => {
    const res = await api()
      .put(`/api/v1/empleados/${mesero.id}`)
      .set(auth(await login(admin)))
      .send({ cargo: 'cajero' });

    expect(res.status).toBe(200);
    expect((await Empleado.findByPk(mesero.id)).cargo).toBe('cajero');
  });

  it('un mesero no puede ver el perfil de otro empleado', async () => {
    const res = await api().get(`/api/v1/empleados/${otroMesero.id}`).set(auth(tokenMesero));
    expect(res.status).toBe(403);
  });

  it('un mesero puede ver su propio perfil', async () => {
    const res = await api().get(`/api/v1/empleados/${mesero.id}`).set(auth(tokenMesero));
    expect(res.status).toBe(200);
  });
});
