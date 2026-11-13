import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest';
import { VERSION_LEGAL } from '../src/legal/documentos.js';

// En este archivo el envío de correo siempre falla (SMTP caído).
vi.mock('../src/services/emailService.js', () => ({
  sendPasswordResetEmail: vi.fn(async () => {
    throw new Error('SMTP no disponible');
  })
}));

const { Cliente, Empleado } = await import('../src/models/index.js');
const { errorHandler } = await import('../src/middlewares/errorHandler.js');
const { opcionesCors } = await import('../src/config/cors.js');
const { escaparHtml } = await import('../src/utils/html.js');
const {
  api,
  auth,
  crearCliente,
  crearEmpleado,
  crearPedido,
  crearProducto,
  limpiarBase,
  login
} = await import('./helpers.js');

const registro = (datos = {}) => ({
  identificacion: '1312345678',
  nombres: 'Ana',
  apellidos: "O'Brien",
  correo_electronico: 'ana@prueba.test',
  tipo_cliente: 'Estudiante',
  contrasenia: 'Segura#2026',
  acepta_terminos: true,
  version_legal: VERSION_LEGAL,
  ...datos
});

describe('Bloque 3: calidad', () => {
  beforeEach(limpiarBase);

  describe('errores HTTP', () => {
    it('un JSON mal formado responde 400, no 200', async () => {
      const res = await api()
        .post('/api/v1/auth/login')
        .set('Content-Type', 'application/json')
        .send('{"email": ');

      expect(res.status).toBe(400);
      expect(res.body.success).toBe(false);
    });

    it('un dato con formato inválido responde 400 sin detalles de la base', async () => {
      const token = await login(await crearEmpleado('admin'));
      const producto = await crearProducto();

      const res = await api()
        .put(`/api/v1/productos/${producto.id}`)
        .set(auth(token))
        .send({ precio: 'abc' });

      expect(res.status).toBe(400);
      expect(res.body.message).not.toMatch(/syntax|numeric|sql|relation/i);
    });

    it('una referencia de pago demasiado larga responde 400, no 500', async () => {
      const cajero = await crearEmpleado('cajero');
      const token = await login(cajero);
      const pedido = await crearPedido(await crearCliente(), { estado: 'confirmado', empleado: cajero });

      const res = await api()
        .post('/api/v1/pagos')
        .set(auth(token))
        .send({
          pedido_id: pedido.id,
          valor: 5,
          metodo_pago: 'transferencia',
          numero_referencia: 'x'.repeat(101)
        });

      expect(res.status).toBe(400);
    });

    it('en producción un error interno no expone su mensaje ni el stack', () => {
      const anterior = process.env.NODE_ENV;
      process.env.NODE_ENV = 'production';
      const res = { statusCode: 200, status: vi.fn().mockReturnThis(), json: vi.fn() };

      errorHandler(new Error('relation "Pagos" does not exist'), {}, res, () => {});

      process.env.NODE_ENV = anterior;
      expect(res.status).toHaveBeenCalledWith(500);
      const cuerpo = res.json.mock.calls[0][0];
      expect(cuerpo.message).toBe('Error interno del servidor');
      expect(cuerpo).not.toHaveProperty('stack');
    });
  });

  describe('textos sin HTML escapado', () => {
    it("se guardan y devuelven tal cual (O'Brien)", async () => {
      const res = await api().post('/api/v1/clientes').send(registro());

      expect(res.status).toBe(201);
      expect(res.body.data.apellidos).toBe("O'Brien");
      const enBase = await Cliente.findOne({ where: { correo_electronico: 'ana@prueba.test' } });
      expect(enBase.apellidos).toBe("O'Brien");
    });

    it('el correo escapa los datos del usuario al armar el HTML', () => {
      expect(escaparHtml('<b>Ana</b> & "O\'Brien"')).toBe(
        '&lt;b&gt;Ana&lt;/b&gt; &amp; &quot;O&#39;Brien&quot;'
      );
    });
  });

  describe('política de contraseñas', () => {
    it.each(['123', 'sinmayus#1', 'SinNumero#', 'SinEspecial1'])(
      'el registro rechaza la contraseña %s',
      async (contrasenia) => {
        const res = await api().post('/api/v1/clientes').send(registro({ contrasenia }));

        expect(res.status).toBe(400);
        expect(await Cliente.count()).toBe(0);
      }
    );

    it('crear un empleado exige la misma política', async () => {
      const token = await login(await crearEmpleado('admin'));

      const res = await api()
        .post('/api/v1/empleados')
        .set(auth(token))
        .send({
          identificacion: '0911111111',
          nombres: 'Luis',
          apellidos: 'Mora',
          correo_electronico: 'luis@prueba.test',
          cargo: 'mesero',
          contrasenia: 'debil'
        });

      expect(res.status).toBe(400);
    });

    it('cambiar la contraseña del perfil exige la política antes de gastar el OTP', async () => {
      const cliente = await crearCliente();
      const token = await login(cliente);

      const res = await api()
        .put(`/api/v1/clientes/${cliente.id}`)
        .set(auth(token))
        .send({ contrasenia: 'debil', otp: '123456' });

      expect(res.status).toBe(400);
      expect(res.body.message).toMatch(/8 caracteres/);
      await cliente.reload();
      expect(cliente.reset_password_attempts ?? 0).toBe(0);
    });
  });

  describe('recuperación de contraseña', () => {
    it('si falla el correo, responde lo mismo que para un correo no registrado', async () => {
      const cliente = await crearCliente();

      const registrado = await api()
        .post('/api/v1/auth/forgot-password')
        .send({ email: cliente.correo_electronico });
      const noRegistrado = await api()
        .post('/api/v1/auth/forgot-password')
        .send({ email: 'nadie@prueba.test' });

      expect(registrado.status).toBe(noRegistrado.status);
      expect(registrado.body).toEqual(noRegistrado.body);
    });
  });

  describe('rol vigente en cada petición', () => {
    it('un cambio de cargo aplica sin volver a iniciar sesión', async () => {
      const empleado = await crearEmpleado('mesero');
      const token = await login(empleado);
      expect((await api().get('/api/v1/pagos').set(auth(token))).status).toBe(403);

      await Empleado.update({ cargo: 'cajero' }, { where: { id: empleado.id } });

      expect((await api().get('/api/v1/pagos').set(auth(token))).status).toBe(200);
    });

    it('un usuario eliminado ya no puede usar su token', async () => {
      const cliente = await crearCliente();
      const token = await login(cliente);
      await cliente.destroy();

      const res = await api().get(`/api/v1/clientes/${cliente.id}`).set(auth(token));

      expect(res.status).toBe(401);
    });
  });

  describe('CORS', () => {
    afterEach(() => vi.restoreAllMocks());

    it('en producción solo acepta los orígenes configurados', () => {
      expect(
        opcionesCors({ nodeEnv: 'production', corsOrigin: 'https://a.app, https://b.app' }).origin
      ).toEqual(['https://a.app', 'https://b.app']);
    });

    it('en producción sin CORS_ORIGIN no acepta ningún origen web', () => {
      vi.spyOn(console, 'warn').mockImplementation(() => {});
      expect(opcionesCors({ nodeEnv: 'production', corsOrigin: undefined }).origin).toBe(false);
    });

    it('en desarrollo sin CORS_ORIGIN acepta cualquiera', () => {
      expect(opcionesCors({ nodeEnv: 'development', corsOrigin: undefined }).origin).toBe('*');
    });
  });

  describe('montos', () => {
    it('los precios llegan como número, no como texto', async () => {
      await crearProducto({ precio: 6 });

      const res = await api().get('/api/v1/productos');

      expect(res.body.data[0].precio).toBe(6);
    });
  });
});
