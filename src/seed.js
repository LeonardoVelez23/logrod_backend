import { sequelize, Categoria, Producto, Cliente, Empleado } from './models/index.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    console.log('Iniciando la siembra de datos (seeding)...');

    // Verificar si ya hay datos en categorías para evitar duplicar
    const categoriaCount = await Categoria.count();
    if (categoriaCount > 0) {
      console.log('La base de datos ya contiene datos. Saltando seeding para evitar duplicados.');
      process.exit(0);
    }

    // 1. Crear Categorías
    console.log('Creando categorías...');
    const catEntradas = await Categoria.create({ nombre: 'Entradas' });
    const catPlatosFuertes = await Categoria.create({ nombre: 'Platos Fuertes' });
    const catPostres = await Categoria.create({ nombre: 'Postres' });
    const catBebidas = await Categoria.create({ nombre: 'Bebidas' });

    // 2. Crear Productos
    console.log('Creando productos...');
    await Producto.bulkCreate([
      {
        codigo: 'P001',
        nombre: 'Empanadas de Carne',
        descripcion: 'Porción de 3 empanadas crocantes con ají de la casa',
        precio: 4.50,
        cantidad_disponible: 30,
        estado: 'disponible',
        categoria_id: catEntradas.id
      },
      {
        codigo: 'P002',
        nombre: 'Bandeja Paisa',
        descripcion: 'Tradicional plato paisa con frijol, arroz, carne molida, chicharrón, huevo, chorizo y aguacate',
        precio: 14.90,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id
      },
      {
        codigo: 'P003',
        nombre: 'Flan de Caramelo',
        descripcion: 'Delicioso flan casero bañado en salsa de caramelo',
        precio: 3.50,
        cantidad_disponible: 15,
        estado: 'disponible',
        categoria_id: catPostres.id
      },
      {
        codigo: 'P004',
        nombre: 'Limonada de Coco',
        descripcion: 'Refrescante limonada frappé elaborada con leche de coco natural',
        precio: 3.00,
        cantidad_disponible: 50,
        estado: 'disponible',
        categoria_id: catBebidas.id
      }
    ]);

    // Hashear contraseñas para los usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash('admin123', salt);
    const passwordEmpleado = await bcrypt.hash('empleado123', salt);
    const passwordCliente = await bcrypt.hash('cliente123', salt);

    // 3. Crear Empleados (incluyendo uno con cargo de administrador)
    console.log('Creando empleados y administrador...');
    const admin = await Empleado.create({
      identificacion: '1001001001',
      nombres: 'Carlos',
      apellidos: 'Administrador',
      correo_electronico: 'admin@logrod.com',
      telefono: '3001234567',
      cargo: 'admin',
      turno_trabajo: 'Completo',
      contrasenia: passwordAdmin
    });

    const passwordEmpleado2 = await bcrypt.hash('empleado123', salt);

    await Empleado.bulkCreate([
      {
        identificacion: '1002002002',
        nombres: 'Ana',
        apellidos: 'Vera',
        correo_electronico: 'empleado@logrod.com',
        telefono: '3007654321',
        cargo: 'mesero',
        turno_trabajo: 'Tarde',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002003',
        nombres: 'Luis',
        apellidos: 'Morales',
        correo_electronico: 'luis.morales@logrod.com',
        telefono: '3102345678',
        cargo: 'mesero',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002004',
        nombres: 'Sofía',
        apellidos: 'Ramírez',
        correo_electronico: 'sofia.ramirez@logrod.com',
        telefono: '3113456789',
        cargo: 'mesero',
        turno_trabajo: 'Noche',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002005',
        nombres: 'Jorge',
        apellidos: 'Torres',
        correo_electronico: 'jorge.torres@logrod.com',
        telefono: '3124567890',
        cargo: 'cajero',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002006',
        nombres: 'Laura',
        apellidos: 'Díaz',
        correo_electronico: 'laura.diaz@logrod.com',
        telefono: '3135678901',
        cargo: 'cajero',
        turno_trabajo: 'Tarde',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002007',
        nombres: 'Roberto',
        apellidos: 'Sánchez',
        correo_electronico: 'roberto.sanchez@logrod.com',
        telefono: '3146789012',
        cargo: 'cocinero',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002008',
        nombres: 'María',
        apellidos: 'López',
        correo_electronico: 'maria.lopez@logrod.com',
        telefono: '3157890123',
        cargo: 'cocinero',
        turno_trabajo: 'Tarde',
        contrasenia: passwordEmpleado2
      },
      {
        identificacion: '1002002009',
        nombres: 'Pedro',
        apellidos: 'García',
        correo_electronico: 'pedro.garcia@logrod.com',
        telefono: '3168901234',
        cargo: 'chef',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado2
      }
    ]);

    // 4. Crear Clientes
    console.log('Creando clientes...');
    const cliente = await Cliente.create({
      identificacion: '1003003003',
      nombres: 'Diego',
      apellidos: 'Gomez',
      correo_electronico: 'cliente@logrod.com',
      telefono: '3159876543',
      tipo_cliente: 'Estudiante',
      contrasenia: passwordCliente
    });

    console.log('¡Siembra de datos finalizada exitosamente!');
    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
};

// Ejecutar siembra de datos
seed();
