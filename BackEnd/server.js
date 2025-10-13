const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// Conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",      // tu usuario
  password: "",      // tu contraseña
  database: "gt", // tu base de datos
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la BD:", err.message);
    process.exit(1);
  }
  console.log("Conectado a MySQL");
});

// LOGIN 
app.post("/login", (req, res) => {
  const { Correo, Password } = req.body;

  if (!Correo || !Password) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  const query = "SELECT ID_usuario, Nombre, Rol FROM usuarios WHERE Correo = ? AND Password = ?";
  db.query(query, [Correo, Password], (err, result) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).json({ success: false, message: "Error en el servidor" });
    }

    if (result.length > 0) {
  const user = result[0];
  res.json({
    success: true,
    message: "Inicio de sesión correcto",
    user: {
      id: user.ID_usuario,
      nombre: user.Nombre,
      rol: user.Rol
    }
  });
} else {
      res.json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});

//  Ruta para obtener tareas con nombres de usuarios
app.get("/tareas", (req, res) => {
  const sql = `
    SELECT t.ID_tareas, t.Nombre, t.Descripcion, t.Fecha_inicio, t.Fecha_fin,
           ua.Nombre AS Asignado, uc.Nombre AS Creador
    FROM tareas t
    LEFT JOIN usuarios ua ON t.ID_UserA = ua.ID_usuario
    LEFT JOIN usuarios uc ON t.ID_UserC = uc.ID_usuario;
  `;

  db.query(sql, (err, results) => {
    if (err) {
      console.error("Error al obtener tareas:", err);
      return res.status(500).json({ success: false, message: "Error al obtener tareas" });
    }
    res.json(results);
  });
});

// 🔹 Crear una nueva tarea (CREATE)
app.post("/tareas", (req, res) => {
  const { Nombre, Descripcion, Fecha_inicio, Fecha_fin, Asignado, Creador } = req.body;

  if (!Nombre) {
    return res.status(400).json({ success: false, message: "El campo 'Nombre' es obligatorio" });
  }

  // Buscar IDs de usuarios (Asignado y Creador)
  const findUserId = (nombre, callback) => {
    if (!nombre) return callback(null, null);
    db.query("SELECT ID_usuario FROM usuarios WHERE Nombre = ?", [nombre], (err, result) => {
      if (err) return callback(err);
      callback(null, result.length > 0 ? result[0].ID_usuario : null);
    });
  };

  findUserId(Asignado, (errA, idA) => {
    if (errA) return res.status(500).json({ success: false, message: "Error buscando Asignado" });

    findUserId(Creador, (errC, idC) => {
      if (errC) return res.status(500).json({ success: false, message: "Error buscando Creador" });

      const sql = `
        INSERT INTO tareas (Nombre, Descripcion, Fecha_inicio, Fecha_fin, ID_UserA, ID_UserC)
        VALUES (?, ?, ?, ?, ?, ?)
      `;
      db.query(sql, [Nombre, Descripcion, Fecha_inicio, Fecha_fin, idA, idC], (err, result) => {
        if (err) {
          console.error("Error al insertar tarea:", err);
          return res.status(500).json({ success: false, message: "Error al crear tarea" });
        }
        res.status(201).json({ success: true, message: "Tarea creada correctamente" });
      });
    });
  });
});


// Actualizar una tarea (UPDATE)
app.put("/tareas/:id", (req, res) => {
  const { id } = req.params;
  const { Nombre, Descripcion, Fecha_inicio, Fecha_fin, Asignado, Creador } = req.body;

  const findUserId = (nombre, callback) => {
    if (!nombre) return callback(null, null);
    db.query("SELECT ID_usuario FROM usuarios WHERE Nombre = ?", [nombre], (err, result) => {
      if (err) return callback(err);
      callback(null, result.length > 0 ? result[0].ID_usuario : null);
    });
  };

  findUserId(Asignado, (errA, idA) => {
    if (errA) return res.status(500).json({ success: false, message: "Error buscando Asignado" });

    findUserId(Creador, (errC, idC) => {
      if (errC) return res.status(500).json({ success: false, message: "Error buscando Creador" });

      const sql = `
        UPDATE tareas
        SET Nombre=?, Descripcion=?, Fecha_inicio=?, Fecha_fin=?, ID_UserA=?, ID_UserC=?
        WHERE ID_tareas=?
      `;
      db.query(sql, [Nombre, Descripcion, Fecha_inicio, Fecha_fin, idA, idC, id], (err, result) => {
        if (err) {
          console.error("Error al actualizar tarea:", err);
          return res.status(500).json({ success: false, message: "Error al actualizar tarea" });
        }
        res.json({ success: true, message: "Tarea actualizada correctamente" });
      });
    });
  });
});


// Eliminar una tarea (DELETE)
app.delete("/tareas/:id", (req, res) => {
  const { id } = req.params;
  const sql = "DELETE FROM tareas WHERE ID_tareas = ?";
  db.query(sql, [id], (err, result) => {
    if (err) {
      console.error("Error al eliminar tarea:", err);
      return res.status(500).json({ success: false, message: "Error al eliminar tarea" });
    }
    res.json({ success: true, message: "Tarea eliminada correctamente" });
  });
});


//Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
