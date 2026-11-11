import { beforeEach, describe, expect, it, vi } from 'vitest';

// Captura el OTP en vez de enviar el correo.
const correos = vi.hoisted(() => []);
vi.mock('../src/services/emailService.js', () => ({
  sendPasswordResetEmail: vi.fn(async (to, otp) => correos.push({ to, otp }))
}));

const { Cliente } = await import('../src/models/index.js');
const { OTP_MAX_ATTEMPTS } = await import('../src/services/otpService.js');
const { api, auth, crearCliente, limpiarBase } = await import('./helpers.js');

const NUEVA = 'NuevaClave#1';

describe('Recuperación de contraseña con OTP', () => {
  let cliente;

  const pedirOtp = async () => {
    await api().post('/api/v1/auth/forgot-password').send({ email: cliente.correo_electronico });
    return correos.at(-1).otp;
  };
  const restablecer = (otp, email = cliente.correo_electronico) =>
    api().post('/api/v1/auth/reset-password').send({ email, otp, newPassword: NUEVA });

  beforeEach(async () => {
    await limpiarBase();
    correos.length = 0;
    cliente = await crearCliente();
  });

  it('genera un OTP de 6 dígitos y guarda solo su hash', async () => {
    const otp = await pedirOtp();
    await cliente.reload();

    expect(otp).toMatch(/^\d{6}$/);
    expect(cliente.reset_password_token).not.toContain(otp);
    expect(cliente.reset_password_token).toMatch(/^[0-9a-f]{64}$/);
  });

  it('con el OTP correcto cambia la contraseña y lo invalida', async () => {
    const otp = await pedirOtp();

    expect((await restablecer(otp)).status).toBe(200);
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: cliente.correo_electronico, password: NUEVA });
    expect(login.status).toBe(200);

    // No se puede reutilizar.
    expect((await restablecer(otp)).status).toBe(400);
  });

  it(`tras ${OTP_MAX_ATTEMPTS} intentos fallidos el OTP correcto ya no sirve`, async () => {
    const otp = await pedirOtp();
    const malo = otp === '000000' ? '111111' : '000000';

    for (let i = 0; i < OTP_MAX_ATTEMPTS; i++) {
      expect((await restablecer(malo)).status).toBe(400);
    }

    expect((await restablecer(otp)).status).toBe(400);
  });

  it('un OTP vencido no sirve', async () => {
    const otp = await pedirOtp();
    await Cliente.update(
      { reset_password_expires: new Date(Date.now() - 1000) },
      { where: { id: cliente.id } }
    );

    expect((await restablecer(otp)).status).toBe(400);
  });

  it('pedir un OTP nuevo invalida el anterior', async () => {
    const primero = await pedirOtp();
    const segundo = await pedirOtp();

    if (primero !== segundo) expect((await restablecer(primero)).status).toBe(400);
    expect((await restablecer(segundo)).status).toBe(200);
  });

  it('el OTP de un cliente no sirve para otra cuenta', async () => {
    const otro = await crearCliente();
    const otp = await pedirOtp();

    expect((await restablecer(otp, otro.correo_electronico)).status).toBe(400);
  });

  it('cambiar la contraseña desde el perfil también exige el OTP vigente', async () => {
    const login = await api()
      .post('/api/v1/auth/login')
      .send({ email: cliente.correo_electronico, password: 'Clave#123' });
    const otp = await pedirOtp();

    const sinOtp = await api()
      .put(`/api/v1/clientes/${cliente.id}`)
      .set(auth(login.body.token))
      .send({ contrasenia: NUEVA, otp: '999999' === otp ? '888888' : '999999' });
    const conOtp = await api()
      .put(`/api/v1/clientes/${cliente.id}`)
      .set(auth(login.body.token))
      .send({ contrasenia: NUEVA, otp });

    expect(sinOtp.status).toBe(400);
    expect(conOtp.status).toBe(200);
    await cliente.reload();
    expect(cliente.reset_password_token).toBeNull();
  });
});
