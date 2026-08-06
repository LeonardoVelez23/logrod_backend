import { sequelize, Categoria, Producto, Cliente, Empleado } from '../models/index.js';
import bcrypt from 'bcryptjs';

const seed = async () => {
  try {
    console.log('Iniciando la siembra de datos (seeding)...');

    // 1. Crear / Buscar Categorías
    console.log('Creando / verificando categorías...');
    const [catEntradas] = await Categoria.findOrCreate({ where: { nombre: 'Entradas' } });
    const [catPlatosFuertes] = await Categoria.findOrCreate({ where: { nombre: 'Platos Fuertes' } });
    const [catPostres] = await Categoria.findOrCreate({ where: { nombre: 'Postres' } });
    const [catBebidas] = await Categoria.findOrCreate({ where: { nombre: 'Bebidas' } });

    // 2. Definir Productos para todas las categorías
    console.log('Creando / actualizando catálogo de productos...');
    const listaProductos = [
      // ENTRADAS
      {
        codigo: 'P001',
        nombre: 'Empanadas de Carne',
        descripcion: 'Porción de 3 empanadas crocantes de carne sazonada con ají artesanal de la casa.',
        precio: 4.50,
        cantidad_disponible: 30,
        estado: 'disponible',
        categoria_id: catEntradas.id,
        imagen_url: 'https://images.unsplash.com/photo-1626700051175-6818013e1d4f?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P005',
        nombre: 'Tequeños de Queso',
        descripcion: '6 deditos de queso blanco fundido crujientes servidos con salsa tártara especial.',
        precio: 4.00,
        cantidad_disponible: 25,
        estado: 'disponible',
        categoria_id: catEntradas.id,
        imagen_url: 'https://images.unsplash.com/photo-1541529086526-db283c563270?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P006',
        nombre: 'Nachos Supremos',
        descripcion: 'Tortillas crocantes de maíz con queso cheddar fundido, guacamole, frijoles y pico de gallo.',
        precio: 6.50,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catEntradas.id,
        imagen_url: 'https://images.unsplash.com/photo-1513456852971-30c0b8199d4d?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P007',
        nombre: 'Canastitas de Verde con Camarón',
        descripcion: '4 canastitas de plátano verde tostado rellenas de jugosos camarones al ajillo.',
        precio: 5.50,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catEntradas.id,
        imagen_url: 'https://images.unsplash.com/photo-1565557623262-b51c2513a641?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P008',
        nombre: 'Alitas BBQ Artesanales',
        descripcion: '6 alitas jugosas bañadas en salsa barbacoa dulce-ahumada con papas fritas.',
        precio: 6.00,
        cantidad_disponible: 25,
        estado: 'disponible',
        categoria_id: catEntradas.id,
        imagen_url: 'https://images.unsplash.com/photo-1527477396000-e27163b481c2?w=600&auto=format&fit=crop'
      },

      // PLATOS FUERTES
      {
        codigo: 'P002',
        nombre: 'Bandeja Paisa',
        descripcion: 'Tradicional plato paisa con frijoles cargamanto, arroz, carne molida, chicharrón, huevo, chorizo y aguacate.',
        precio: 14.90,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1544025162-d76694265947?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P009',
        nombre: 'Lomo Saltado Criollo',
        descripcion: 'Jugosos trozos de lomo salteados al wok con cebolla, tomate y ají amarillo, servido con papas fritas y arroz.',
        precio: 12.50,
        cantidad_disponible: 25,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1546069901-ba9599a7e63c?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P010',
        nombre: 'Churrasco Politécnico',
        descripcion: 'Corte de res a la plancha con huevo frito, papas fritas crujientes, arroz, ensalada fresca y aguacate.',
        precio: 11.00,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1558030006-450675393462?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P011',
        nombre: 'Seco de Chivo Tradicional',
        descripcion: 'Estofado de chivo marinado en chicha de jora y especias, acompañado de arroz amarillo y maduro frito.',
        precio: 9.50,
        cantidad_disponible: 18,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1604908176997-125f25cc6f3d?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P012',
        nombre: 'Pollo a la Plancha con Champiñones',
        descripcion: 'Pechuga de pollo marinada a la plancha en cremosa salsa de champiñones frescos y hierbas aromáticas.',
        precio: 8.50,
        cantidad_disponible: 30,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1632778149955-e80f8ceca2e8?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P013',
        nombre: 'Hamburguesa Especial Sabor Poli',
        descripcion: '180g de carne artesanal de res, queso cheddar derretido, tocineta crocante, lechuga, tomate y salsa especial.',
        precio: 7.50,
        cantidad_disponible: 35,
        estado: 'disponible',
        categoria_id: catPlatosFuertes.id,
        imagen_url: 'https://images.unsplash.com/photo-1568901346375-23c9450c58cd?w=600&auto=format&fit=crop'
      },

      // POSTRES
      {
        codigo: 'P003',
        nombre: 'Flan de Caramelo Casero',
        descripcion: 'Delicioso y suave flan tradicional bañado en salsa de caramelo dorado artesanal.',
        precio: 3.50,
        cantidad_disponible: 15,
        estado: 'disponible',
        categoria_id: catPostres.id,
        imagen_url: 'https://images.unsplash.com/photo-1528975604071-b4dc52a2d18c?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P014',
        nombre: 'Cheesecake de Frutos Rojos',
        descripcion: 'Suave pastel de queso sobre crocante base de galleta con compota artesanal de moras y frutillas.',
        precio: 4.25,
        cantidad_disponible: 20,
        estado: 'disponible',
        categoria_id: catPostres.id,
        imagen_url: 'https://images.unsplash.com/photo-1533134242443-d4fd215305ad?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P015',
        nombre: 'Volcán de Chocolate',
        descripcion: 'Bizcocho tibio de chocolate amargo con centro líquido caliente y una bola de helado de vainilla.',
        precio: 4.50,
        cantidad_disponible: 15,
        estado: 'disponible',
        categoria_id: catPostres.id,
        imagen_url: 'https://images.unsplash.com/photo-1606313564200-e75d5e30476c?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P016',
        nombre: 'Tres Leches de Maracuyá',
        descripcion: 'Esponjoso bizcocho bañado en mezcla de tres leches enriquecido con toque ácido de maracuyá.',
        precio: 3.75,
        cantidad_disponible: 22,
        estado: 'disponible',
        categoria_id: catPostres.id,
        imagen_url: 'https://images.unsplash.com/photo-1464349095431-e9a21285b5f3?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P017',
        nombre: 'Helado Artesanal de Paila',
        descripcion: 'Copa con dos bolas de helado elaborado tradicionalmente en paila de bronce (Mora y Taxo).',
        precio: 3.00,
        cantidad_disponible: 30,
        estado: 'disponible',
        categoria_id: catPostres.id,
        imagen_url: 'https://images.unsplash.com/photo-1560008511-11c63416e52d?w=600&auto=format&fit=crop'
      },

      // BEBIDAS
      {
        codigo: 'P004',
        nombre: 'Limonada de Coco Frappé',
        descripcion: 'Refrescante limonada batida helada elaborada con pura leche de coco natural.',
        precio: 3.00,
        cantidad_disponible: 50,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1513558161293-cdaf765ed2fd?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P018',
        nombre: 'Jugo Natural de Maracuyá',
        descripcion: 'Jugo 100% de pulpa de maracuyá helada y refrescante.',
        precio: 2.00,
        cantidad_disponible: 40,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1621263764928-df1444c5e859?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P019',
        nombre: 'Chicha Morada Tradicional',
        descripcion: 'Bebida hervida a base de maíz morado, cáscara de piña, manzana, canela y clavo de olor.',
        precio: 2.25,
        cantidad_disponible: 35,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1540420773420-3366772f4999?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P020',
        nombre: 'Cerveza Artesanal Poli IPA',
        descripcion: 'Cerveza artesanal embotellada de la casa con cuerpo notas cítricas y amargor de lúpulo.',
        precio: 4.00,
        cantidad_disponible: 30,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1608270586620-248524c67de9?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P021',
        nombre: 'Café Espresso Doble',
        descripcion: 'Extracto concentrado de grano de café arábigo de tueste medio recién molido.',
        precio: 1.75,
        cantidad_disponible: 60,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1514432324607-a09d9b4aefdd?w=600&auto=format&fit=crop'
      },
      {
        codigo: 'P022',
        nombre: 'Té Helado de Durazno',
        descripcion: 'Infusión helada de té negro con extracto natural de durazno.',
        precio: 2.00,
        cantidad_disponible: 45,
        estado: 'disponible',
        categoria_id: catBebidas.id,
        imagen_url: 'https://images.unsplash.com/photo-1556679343-c7306c1976bc?w=600&auto=format&fit=crop'
      }
    ];

    for (const prodData of listaProductos) {
      const [prod, created] = await Producto.findOrCreate({
        where: { codigo: prodData.codigo },
        defaults: prodData
      });

      if (!created) {
        // Actualizar datos e imagen por si ya existía el registro simple anterior
        await prod.update(prodData);
      }
    }
    console.log(`¡${listaProductos.length} productos sembrados/actualizados correctamente!`);

    // 3. Hashear contraseñas para los usuarios de prueba
    const salt = await bcrypt.genSalt(10);
    const passwordAdmin = await bcrypt.hash('admin123', salt);
    const passwordEmpleado = await bcrypt.hash('empleado123', salt);
    const passwordCliente = await bcrypt.hash('cliente123', salt);

    // 4. Crear Empleados y Administrador si no existen
    console.log('Creando / verificando usuarios de prueba...');
    await Empleado.findOrCreate({
      where: { correo_electronico: 'admin@logrod.com' },
      defaults: {
        identificacion: '1001001001',
        nombres: 'Carlos',
        apellidos: 'Administrador',
        telefono: '3001234567',
        cargo: 'admin',
        turno_trabajo: 'Completo',
        contrasenia: passwordAdmin
      }
    });

    const empleadosIniciales = [
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
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002004',
        nombres: 'Sofía',
        apellidos: 'Ramírez',
        correo_electronico: 'sofia.ramirez@logrod.com',
        telefono: '3113456789',
        cargo: 'mesero',
        turno_trabajo: 'Noche',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002005',
        nombres: 'Jorge',
        apellidos: 'Torres',
        correo_electronico: 'jorge.torres@logrod.com',
        telefono: '3124567890',
        cargo: 'cajero',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002006',
        nombres: 'Laura',
        apellidos: 'Díaz',
        correo_electronico: 'laura.diaz@logrod.com',
        telefono: '3135678901',
        cargo: 'cajero',
        turno_trabajo: 'Tarde',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002007',
        nombres: 'Roberto',
        apellidos: 'Sánchez',
        correo_electronico: 'roberto.sanchez@logrod.com',
        telefono: '3146789012',
        cargo: 'cocinero',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002008',
        nombres: 'María',
        apellidos: 'López',
        correo_electronico: 'maria.lopez@logrod.com',
        telefono: '3157890123',
        cargo: 'cocinero',
        turno_trabajo: 'Tarde',
        contrasenia: passwordEmpleado
      },
      {
        identificacion: '1002002009',
        nombres: 'Pedro',
        apellidos: 'García',
        correo_electronico: 'pedro.garcia@logrod.com',
        telefono: '3168901234',
        cargo: 'chef',
        turno_trabajo: 'Mañana',
        contrasenia: passwordEmpleado
      }
    ];

    for (const empData of empleadosIniciales) {
      await Empleado.findOrCreate({
        where: { correo_electronico: empData.correo_electronico },
        defaults: empData
      });
    }

    // 5. Crear Cliente de prueba si no existe
    await Cliente.findOrCreate({
      where: { correo_electronico: 'cliente@logrod.com' },
      defaults: {
        identificacion: '1003003003',
        nombres: 'Diego',
        apellidos: 'Gomez',
        telefono: '3159876543',
        tipo_cliente: 'Estudiante',
        contrasenia: passwordCliente
      }
    });

    console.log('¡Siembra de datos (seeding) finalizada exitosamente con catálogo completo!');
    process.exit(0);
  } catch (error) {
    console.error('Error al sembrar datos:', error);
    process.exit(1);
  }
};

// Ejecutar siembra de datos
seed();
