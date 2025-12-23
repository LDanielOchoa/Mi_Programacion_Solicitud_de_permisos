const fetch = require('node-fetch');

async function testServer() {
  const baseUrl = 'solicitud-permisos.sao6.com.co/api                                                                                                                                                                                                                                                                                                                                                                        /api';

  console.log('🧪 Probando servidor...');

  try {
    // Probar conexión básica
    console.log('1. Probando conexión básica...');
    const response = await fetch(`${baseUrl}/`);
    if (response.ok) {
      console.log('✅ Servidor respondiendo correctamente');
    } else {
      console.log('❌ Servidor no responde correctamente');
    }

    // Probar conexión a la base de datos
    console.log('2. Probando conexión a la base de datos...');
    const dbResponse = await fetch(`${baseUrl}/test-db`);
    if (dbResponse.ok) {
      const dbData = await dbResponse.json();
      console.log('✅ Conexión a la base de datos exitosa');
      console.log('📊 Tablas encontradas:', dbData.tables);
    } else {
      console.log('❌ Error en conexión a la base de datos');
      const errorData = await dbResponse.json();
      console.log('Error:', errorData);
    }

    // Probar endpoint de admin (debería fallar sin autenticación)
    console.log('3. Probando endpoint de admin sin autenticación...');
    const adminResponse = await fetch(`${baseUrl}/api/admin/requests`);
    if (adminResponse.status === 401) {
      console.log('✅ Endpoint protegido correctamente (requiere autenticación)');
    } else {
      console.log(`❌ Endpoint no protegido correctamente. Status: ${adminResponse.status}`);
    }

  } catch (error) {
    console.error('❌ Error al probar servidor:', error.message);
  }
}

testServer(); 