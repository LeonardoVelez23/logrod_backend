/**
 * Términos y condiciones y política de protección de datos (LOPDP, RNF-21).
 *
 * Los consume la app móvil por API (GET /legal y GET /legal/:tipo) y los
 * muestra con sus propios estilos. Al registrarse, el cliente acepta la
 * versión vigente y se guarda en Clientes.legal_version / legal_aceptado_en.
 *
 * Al cambiar cualquier texto, subir VERSION_LEGAL (fecha AAAA-MM-DD): el
 * registro rechaza aceptaciones de una versión anterior.
 *
 * BORRADOR: los datos entre corchetes los debe completar el responsable del
 * restaurante, y el texto debe revisarlo un asesor legal antes de publicar.
 */
export const VERSION_LEGAL = '2026-11-13';

const RESPONSABLE = {
  nombre: 'Sabor Politécnico, restaurante universitario',
  razonSocial: '[Razón social y RUC del responsable]',
  direccion: '[Dirección del restaurante]',
  correo: '[Correo de contacto para protección de datos]'
};

const terminos = {
  tipo: 'terminos',
  titulo: 'Términos y condiciones de uso',
  version: VERSION_LEGAL,
  secciones: [
    {
      titulo: '1. Objeto',
      parrafos: [
        `Estos términos regulan el uso de la aplicación y los servicios digitales de ${RESPONSABLE.nombre} (en adelante, "la plataforma"), que permiten consultar el menú, hacer pedidos, seguir su estado y registrar su pago.`,
        'Al crear una cuenta declaras que leíste y aceptas estos términos y la Política de protección de datos personales.'
      ]
    },
    {
      titulo: '2. Cuenta de usuario',
      parrafos: [
        'Pueden registrarse estudiantes, docentes, personal administrativo y personas externas. Los datos que ingreses deben ser verdaderos y estar actualizados.',
        'Tu contraseña es personal. Eres responsable de las acciones hechas con tu cuenta; si sospechas que alguien más la usa, cámbiala y avísanos.',
        'Podemos suspender cuentas con datos falsos o que hagan un uso indebido de la plataforma.'
      ]
    },
    {
      titulo: '3. Pedidos',
      parrafos: [
        'Los pedidos dependen de la disponibilidad de los productos. El precio que se cobra es el vigente al momento de confirmar el pedido y lo calcula el sistema.',
        'Una vez hecho, el cliente no puede cancelar el pedido desde la aplicación. El personal del restaurante puede cancelarlo; en ese caso se devuelve el stock y, si el pago ya estaba aprobado, se marca como reembolsado.',
        'El pedido se retira en el restaurante en el horario de atención. Puedes seguir su estado (solicitado, confirmado, en preparación, listo, entregado) desde la aplicación.'
      ]
    },
    {
      titulo: '4. Pagos',
      parrafos: [
        'El pago se registra por pedido con los métodos habilitados por el restaurante (efectivo, tarjeta o transferencia).',
        'La plataforma no guarda números de tarjeta ni códigos de seguridad.'
      ]
    },
    {
      titulo: '5. Uso adecuado',
      parrafos: [
        'No está permitido usar la plataforma para fines ilícitos, intentar acceder a cuentas o datos ajenos, interferir con su funcionamiento ni hacer pedidos con datos falsos.'
      ]
    },
    {
      titulo: '6. Disponibilidad y responsabilidad',
      parrafos: [
        'La plataforma funciona durante el horario de atención del restaurante y puede tener interrupciones por mantenimiento o por fallas de los servicios de terceros que usa.',
        'Hacemos lo razonable para que la información del menú, precios y disponibilidad sea correcta; si hay un error, el restaurante te lo informará antes de preparar el pedido.'
      ]
    },
    {
      titulo: '7. Cambios a estos términos',
      parrafos: [
        'Podemos actualizar estos términos. Cada versión lleva su fecha; si hay cambios importantes te pediremos aceptarlos de nuevo.'
      ]
    },
    {
      titulo: '8. Ley aplicable y contacto',
      parrafos: [
        'Estos términos se rigen por las leyes de la República del Ecuador.',
        `Consultas: ${RESPONSABLE.correo}.`
      ]
    }
  ]
};

const privacidad = {
  tipo: 'privacidad',
  titulo: 'Política de protección de datos personales',
  version: VERSION_LEGAL,
  secciones: [
    {
      titulo: '1. Responsable del tratamiento',
      parrafos: [
        `${RESPONSABLE.nombre} (${RESPONSABLE.razonSocial}), con domicilio en ${RESPONSABLE.direccion}, es responsable del tratamiento de tus datos personales conforme a la Ley Orgánica de Protección de Datos Personales del Ecuador (LOPDP) y su reglamento.`,
        `Contacto para temas de datos personales: ${RESPONSABLE.correo}.`
      ]
    },
    {
      titulo: '2. Datos que tratamos',
      parrafos: [
        'Datos de identificación y contacto: número de identificación, nombres, apellidos, correo electrónico, teléfono y tipo de cliente (estudiante, docente, personal administrativo o persona externa).',
        'Datos de uso del servicio: pedidos, productos, fechas, montos, estado y método de pago, y número de referencia cuando aplica.',
        'Datos de seguridad: tu contraseña, que se guarda cifrada de forma irreversible, y los códigos temporales de recuperación.',
        'No tratamos datos sensibles ni guardamos datos de tarjetas de pago.'
      ]
    },
    {
      titulo: '3. Para qué los usamos',
      parrafos: [
        'Crear y administrar tu cuenta, e identificarte al iniciar sesión.',
        'Recibir, preparar y entregar tus pedidos, y registrar su pago.',
        'Enviarte por correo el código para recuperar o cambiar tu contraseña.',
        'Elaborar estadísticas internas de ventas del restaurante, sin identificar a personas.',
        'No usamos tus datos para publicidad ni los vendemos.'
      ]
    },
    {
      titulo: '4. Base legal',
      parrafos: [
        'Tratamos tus datos para ejecutar el servicio que solicitas (cuenta y pedidos) y con el consentimiento que das al registrarte. Puedes retirar tu consentimiento en cualquier momento, lo que implica dejar de usar la cuenta.'
      ]
    },
    {
      titulo: '5. Con quién los compartimos',
      parrafos: [
        'El personal del restaurante accede solo a los datos que necesita para atender tu pedido.',
        'Usamos proveedores que actúan como encargados del tratamiento: alojamiento de la base de datos y del servidor, y envío de correos. Algunos están fuera del Ecuador, por lo que puede haber transferencia internacional de datos, con las garantías que exige la LOPDP.',
        'Solo entregamos datos a autoridades cuando una norma o una orden competente lo exige.'
      ]
    },
    {
      titulo: '6. Cuánto tiempo los conservamos',
      parrafos: [
        'Mientras tu cuenta esté activa. Si pides eliminarla, borraremos o anonimizaremos tus datos, salvo los registros de pedidos y pagos que la ley obligue a conservar, por el plazo que esta establezca.'
      ]
    },
    {
      titulo: '7. Tus derechos',
      parrafos: [
        'Puedes ejercer tus derechos de acceso, rectificación y actualización, eliminación, oposición, portabilidad y suspensión del tratamiento, y a no ser objeto de decisiones basadas únicamente en tratamientos automatizados.',
        `Escríbenos a ${RESPONSABLE.correo} desde el correo de tu cuenta indicando el derecho que quieres ejercer. Responderemos en el plazo que establece la LOPDP.`,
        'Puedes actualizar tus datos de contacto desde tu perfil en la aplicación.',
        'Si consideras que no atendimos tu solicitud, puedes acudir a la Superintendencia de Protección de Datos Personales.'
      ]
    },
    {
      titulo: '8. Seguridad',
      parrafos: [
        'Aplicamos medidas como conexiones cifradas, contraseñas cifradas, control de acceso por rol, códigos de recuperación de un solo uso con vencimiento y acceso a la base de datos solo desde el servidor de la plataforma.'
      ]
    },
    {
      titulo: '9. Menores de edad',
      parrafos: [
        'Si eres menor de 18 años, necesitas la autorización de tu representante legal para crear una cuenta.'
      ]
    },
    {
      titulo: '10. Cambios a esta política',
      parrafos: [
        'Cada versión lleva su fecha. Si hay cambios importantes te pediremos aceptarla de nuevo.'
      ]
    }
  ]
};

export const DOCUMENTOS_LEGALES = { terminos, privacidad };
