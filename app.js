// Importar las librerías necesarias
const express = require('express');
const mysql = require('mysql');
const bodyParser = require('body-parser');
const bcrypt = require('bcrypt');

const app = express();

// Middleware para analizar el cuerpo de las solicitudes
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true })); // Para recibir datos de formularios

// Servir archivos estáticos desde la carpeta 'public'
app.use(express.static('public')); // Asegúrate de que esta línea esté aquí

// Conexión a la base de datos MySQL
const connection = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '',
    database: 'crud_nodejs'
});

// Conectar a la base de datos
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err);
        return;
    }
    console.log('Conectado a la base de datos MySQL');
});

// Ruta para crear un nuevo usuario
app.post('/usuarios', (req, res) => {
    const { cedula, nombres, apellidos, telefono, correo, contraseña } = req.body;

    // Encriptar la contraseña antes de guardar en la base de datos
    bcrypt.hash(contraseña, 10, (err, hash) => {
        if (err) {
            return res.status(500).send(err);
        }

        const sql = 'INSERT INTO usuarios (cedula, nombres, apellidos, telefono, correo, contraseña) VALUES (?, ?, ?, ?, ?, ?)';
        const values = [cedula, nombres, apellidos, telefono, correo, hash];

        connection.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            res.json({ id: result.insertId, cedula, nombres, apellidos, telefono, correo });
        });
    });
});

// Ruta para iniciar sesión con validación de contraseña
app.post('/login', (req, res) => {
    const { correo, contraseña } = req.body;
    const sql = 'SELECT * FROM usuarios WHERE correo = ?';

    connection.query(sql, [correo], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.length === 0) {
            return res.status(401).json({ message: 'Correo no registrado' });
        }

        const usuario = result[0];

        // Comparar la contraseña con la almacenada
        bcrypt.compare(contraseña, usuario.contraseña, (err, isMatch) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (isMatch) {
                res.json({ message: 'Inicio de sesión exitoso', usuario });
            } else {
                res.status(401).json({ message: 'Contraseña incorrecta' });
            }
        });
    });
});

// Ruta para crear un nuevo reporte
app.post('/reportes', (req, res) => {
    const { fecha, hora, guarda_entrega, guarda_recibe, novedades_fecha, novedades_hora, novedades_descripcion } = req.body;

    // Validación básica
    if (!fecha || !hora || !guarda_entrega || !guarda_recibe || !novedades_fecha || !novedades_hora || !novedades_descripcion) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const sql = 'INSERT INTO reportes (fecha, hora, guarda_entrega, guarda_recibe, novedades_fecha, novedades_hora, novedades_descripcion) VALUES (?, ?, ?, ?, ?, ?, ?)';
    const values = [fecha, hora, guarda_entrega, guarda_recibe, novedades_fecha, novedades_hora, novedades_descripcion];

    connection.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Reporte creado exitosamente', id: result.insertId });
    });
});

// NUEVA RUTA PARA CREAR REPORTE DE PUESTO DE TRABAJO
app.post('/reporte_puesto', (req, res) => {
    const { nombre_puesto, responsabilidades, horario, ubicacion, supervisor } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!nombre_puesto || !responsabilidades || !horario || !ubicacion || !supervisor) {
        return res.status(400).json({ message: 'Todos los campos son requeridos.' });
    }

    const sql = 'INSERT INTO puestos_trabajo (nombre_puesto, responsabilidades, horario, ubicacion, supervisor) VALUES (?, ?, ?, ?, ?)';
    const values = [nombre_puesto, responsabilidades, horario, ubicacion, supervisor];

    connection.query(sql, values, (err, result) => {
        if (err) {
            console.error(err); // Para depuración
            return res.status(500).json({ message: 'Error al crear el reporte de puesto de trabajo', error: err.message });
        }

        // Respuesta en JSON
        res.status(201).json({
            message: 'Reporte de puesto de trabajo creado exitosamente',
            id: result.insertId
        });
    });
});

// Ruta para crear un nuevo reporte de incidente
app.post('/reporte_incidente', (req, res) => {
    const { fecha_incidente, lugar_incidente, descripcion_incidente, testigos_presentes, acciones_tomadas } = req.body;

    // Validar que todos los campos requeridos estén presentes
    if (!fecha_incidente || !lugar_incidente || !descripcion_incidente) {
        return res.status(400).json({ message: 'Los campos Fecha, Lugar y Descripción son requeridos.' });
    }

    const sql = 'INSERT INTO reporte_incidente (fecha_incidente, lugar_incidente, descripcion_incidente, testigos_presentes, acciones_tomadas) VALUES (?, ?, ?, ?, ?)';
    const values = [fecha_incidente, lugar_incidente, descripcion_incidente, testigos_presentes, acciones_tomadas];

    connection.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json({ message: 'Reporte de incidente creado exitosamente', id: result.insertId });
    });
});


// Rutas GET

// Ruta para obtener todos los usuarios
app.get('/usuarios', (req, res) => {
    const sql = 'SELECT * FROM usuarios';

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Ruta para obtener un usuario por su ID
app.get('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM usuarios WHERE id = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json(results[0]);
    });
});

// Ruta para obtener todos los reportes
app.get('/reportes', (req, res) => {
    const sql = 'SELECT * FROM reportes';

    connection.query(sql, (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        res.json(results);
    });
});

// Ruta para obtener un reporte por su ID
app.get('/reportes/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'SELECT * FROM reportes WHERE id = ?';

    connection.query(sql, [id], (err, results) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (results.length === 0) {
            return res.status(404).json({ message: 'Reporte no encontrado' });
        }
        res.json(results[0]);
    });
});

// Ruta para actualizar un usuario por su ID
app.put('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const { cedula, nombres, apellidos, telefono, correo, contraseña } = req.body;

    // Encriptar la nueva contraseña si se proporciona
    if (contraseña) {
        bcrypt.hash(contraseña, 10, (err, hash) => {
            if (err) {
                return res.status(500).send(err);
            }

            const sql = 'UPDATE usuarios SET cedula = ?, nombres = ?, apellidos = ?, telefono = ?, correo = ?, contraseña = ? WHERE id = ?';
            const values = [cedula, nombres, apellidos, telefono, correo, hash, id];

            connection.query(sql, values, (err, result) => {
                if (err) {
                    return res.status(500).send(err);
                }
                if (result.affectedRows === 0) {
                    return res.status(404).json({ message: 'Usuario no encontrado' });
                }
                res.json({ message: 'Usuario actualizado correctamente' });
            });
        });
    } else {
        // Si no se proporciona una nueva contraseña
        const sql = 'UPDATE usuarios SET cedula = ?, nombres = ?, apellidos = ?, telefono = ?, correo = ? WHERE id = ?';
        const values = [cedula, nombres, apellidos, telefono, correo, id];

        connection.query(sql, values, (err, result) => {
            if (err) {
                return res.status(500).send(err);
            }
            if (result.affectedRows === 0) {
                return res.status(404).json({ message: 'Usuario no encontrado' });
            }
            res.json({ message: 'Usuario actualizado correctamente' });
        });
    }
});

// Ruta para eliminar un usuario por su ID
app.delete('/usuarios/:id', (req, res) => {
    const { id } = req.params;
    const sql = 'DELETE FROM usuarios WHERE id = ?';

    connection.query(sql, [id], (err, result) => {
        if (err) {
            return res.status(500).send(err);
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'Usuario no encontrado' });
        }
        res.json({ message: 'Usuario eliminado correctamente' });
    });
});

// Escuchar en el puerto 3000
const PORT = 3000;

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});