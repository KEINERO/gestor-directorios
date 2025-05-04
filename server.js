const express = require('express');
const multer = require('multer');
const fs = require('fs');
const path = require('path');
const cors = require('cors');

const app = express();
const PORT = 3000;

app.use(cors());
app.use(express.urlencoded({ extended: true }));
app.use(express.json());

const BASE_DIR = path.join(__dirname, 'usuarios');

if (!fs.existsSync(BASE_DIR)) {
    fs.mkdirSync(BASE_DIR);
}

// Configuración de multer
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const directorio = path.join(BASE_DIR, req.body.directorio);
        if (!fs.existsSync(directorio)) {
            return cb(new Error('Directorio no existe'));
        }
        cb(null, directorio);
    },
    filename: (req, file, cb) => {
        const filePath = path.join(BASE_DIR, req.body.directorio, file.originalname);
        if (fs.existsSync(filePath)) {
            return cb(new Error('Ya existe un archivo con ese nombre'));
        }
        cb(null, file.originalname);
    }
});
const upload = multer({ storage });

// Crear directorio
app.post('/crear-directorio', (req, res) => {
    const { nombre, apellido, cod } = req.body;
    const nombreDirectorio = `${nombre}_${apellido}_${cod}`;
    const ruta = path.join(BASE_DIR, nombreDirectorio);

    if (fs.existsSync(ruta)) {
        return res.status(400).json({ mensaje: 'El directorio ya existe' });
    }

    fs.mkdirSync(ruta);
    res.json({ mensaje: 'Directorio creado correctamente' });
});

// Subir archivo
app.post('/subir-archivo', upload.single('archivo'), (req, res) => {
    res.json({ mensaje: 'Archivo subido exitosamente' });
});

// Listar directorios
app.get('/listar-directorios', (req, res) => {
    try {
        const directorios = fs.readdirSync(BASE_DIR).filter(item =>
            fs.statSync(path.join(BASE_DIR, item)).isDirectory()
        );
        res.json(directorios);
    } catch (error) {
        res.status(500).json({ mensaje: 'Error al listar directorios' });
    }
});

// ✅ Listar archivos dentro de un directorio
app.get('/listar-archivos/:directorio', (req, res) => {
    const { directorio } = req.params;
    const rutaDirectorio = path.join(BASE_DIR, directorio);

    if (!fs.existsSync(rutaDirectorio)) {
        return res.status(404).json({ error: 'El directorio no existe.' });
    }

    fs.readdir(rutaDirectorio, (err, archivos) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudieron listar los archivos.' });
        }
        res.json(archivos);
    });
});

// Eliminar archivo
app.delete('/eliminar-archivo/:directorio/:archivo', (req, res) => {
    const { directorio, archivo } = req.params;
    const rutaArchivo = path.join(BASE_DIR, directorio, archivo);

    if (!fs.existsSync(rutaArchivo)) {
        return res.status(404).json({ error: 'El archivo no existe.' });
    }

    fs.unlink(rutaArchivo, (err) => {
        if (err) {
            return res.status(500).json({ error: 'No se pudo eliminar el archivo.' });
        }
        res.json({ mensaje: 'Archivo eliminado exitosamente.' });
    });
});

// Middleware de errores
app.use((err, req, res, next) => {
    if (err instanceof multer.MulterError || err.message) {
        return res.status(400).json({ mensaje: err.message });
    }
    next(err);
});

app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
});

