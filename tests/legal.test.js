import { beforeEach, describe, expect, it } from 'vitest';
import { Cliente } from '../src/models/index.js';
import { VERSION_LEGAL } from '../src/legal/documentos.js';
import { api, auth, crearEmpleado, limpiarBase, login } from './helpers.js';

const registro = (datos = {}) => ({
  identificacion: '1312345678',
  nombres: 'Ana',
  apellidos: 'Pérez',
  correo_electronico: 'ana@prueba.test',
  tipo_cliente: 'Estudiante',
  contrasenia: 'Segura#2026',
  acepta_terminos: true,
  version_legal: VERSION_LEGAL,
  ...datos
});

describe('Términos y política de datos (LOPDP)', () => {
  beforeEach(limpiarBase);

  describe('API pública', () => {
    it('GET /legal devuelve la versión vigente y los documentos', async () => {
      const res = await api().get('/api/v1/legal');

      expect(res.status).toBe(200);
      expect(res.body.data.version).toBe(VERSION_LEGAL);
      expect(res.body.data.documentos.map((d) => d.tipo)).toEqual(['terminos', 'privacidad']);
    });

    it.each(['terminos', 'privacidad'])('GET /legal/%s devuelve el documento con secciones', async (tipo) => {
      const res = await api().get(`/api/v1/legal/${tipo}`);

      expect(res.status).toBe(200);
      expect(res.body.data).toMatchObject({ tipo, version: VERSION_LEGAL });
      expect(res.body.data.secciones.length).toBeGreaterThan(0);
      for (const seccion of res.body.data.secciones) {
        expect(typeof seccion.titulo).toBe('string');
        expect(seccion.parrafos.length).toBeGreaterThan(0);
      }
    });

    it.each(['otro', 'toString', '__proto__'])('GET /legal/%s → 404', async (tipo) => {
      const res = await api().get(`/api/v1/legal/${tipo}`);
      expect(res.status).toBe(404);
    });
  });

  describe('registro', () => {
    it('guarda la versión aceptada y la fecha', async () => {
      const res = await api().post('/api/v1/clientes').send(registro());

      expect(res.status).toBe(201);
      const cliente = await Cliente.findOne({ where: { correo_electronico: 'ana@prueba.test' } });
      expect(cliente.legal_version).toBe(VERSION_LEGAL);
      expect(cliente.legal_aceptado_en).toBeInstanceOf(Date);
    });

    it.each([
      ['sin aceptar', { acepta_terminos: undefined }],
      ['con acepta_terminos falso', { acepta_terminos: false }],
      ['con "true" en texto', { acepta_terminos: 'true' }]
    ])('se rechaza %s', async (_caso, datos) => {
      const res = await api().post('/api/v1/clientes').send(registro(datos));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('aceptar los términos');
      expect(await Cliente.count()).toBe(0);
    });

    it('se rechaza una versión anterior de los términos', async () => {
      const res = await api().post('/api/v1/clientes').send(registro({ version_legal: '2000-01-01' }));

      expect(res.status).toBe(400);
      expect(res.body.message).toContain('se actualizaron');
      expect(await Cliente.count()).toBe(0);
    });

    it('el personal crea clientes desde el panel sin aceptar por ellos', async () => {
      const token = await login(await crearEmpleado('admin'));
      const { acepta_terminos: _a, version_legal: _v, ...sinAceptar } = registro();

      const res = await api().post('/api/v1/clientes').set(auth(token)).send(sinAceptar);

      expect(res.status).toBe(201);
      const cliente = await Cliente.findByPk(res.body.data.id);
      expect(cliente.legal_version).toBeNull();
    });

    it('un token inválido no se trata como visitante', async () => {
      const res = await api()
        .post('/api/v1/clientes')
        .set(auth('token-falso'))
        .send(registro());

      expect(res.status).toBe(401);
    });
  });
});
