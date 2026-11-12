'use strict';

/**
 * El antiguo sanitizador XSS guardaba los textos con HTML escapado
 * (`O'Brien` → `O&#x27;Brien`). Ahora se guardan tal cual y cada cliente
 * escapa al mostrar; esta migración restaura los textos ya guardados.
 * `&amp;` va al final para no desescapar dos veces.
 *
 * El `down` no hace nada: no se puede saber qué textos venían escapados.
 */
const ENTIDADES = [
  ['&lt;', '<'],
  ['&gt;', '>'],
  ['&quot;', '"'],
  ['&#x27;', "'"],
  ['&#x2F;', '/'],
  ['&amp;', '&']
];

const EXCLUIDAS = ['contrasenia', 'reset_password_token'];

module.exports = {
  async up(queryInterface) {
    const [columnas] = await queryInterface.sequelize.query(
      `SELECT table_name, column_name
         FROM information_schema.columns
        WHERE table_schema = 'public'
          AND table_name <> 'SequelizeMeta'
          AND data_type IN ('character varying', 'text')`
    );

    for (const { table_name: tabla, column_name: columna } of columnas) {
      if (EXCLUIDAS.includes(columna)) continue;
      const expresion = ENTIDADES.reduce(
        (acc, [entidad, caracter]) => `replace(${acc}, '${entidad}', '${caracter.replace(/'/g, "''")}')`,
        `"${columna}"`
      );
      await queryInterface.sequelize.query(
        `UPDATE "${tabla}" SET "${columna}" = ${expresion} WHERE "${columna}" LIKE '%&%;%'`
      );
    }
  },

  async down() {}
};
