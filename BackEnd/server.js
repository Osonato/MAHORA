const express = require("express");
const mysql = require("mysql2");
const cors = require("cors");
const bodyParser = require("body-parser");

const app = express();
app.use(cors());
app.use(bodyParser.json());

// 🔹 Conexión a la base de datos
const db = mysql.createConnection({
  host: "localhost",
  user: "root",      // tu usuario
  password: "",      // tu contraseña
  database: "gt",    // tu base de datos
});

db.connect((err) => {
  if (err) {
    console.error("Error al conectar a la BD:", err.message);
    process.exit(1);
  }
  console.log("Conectado a MySQL");
});

// 🔹 Ruta de login
app.post("/login", (req, res) => {
  const { Correo, Password } = req.body;

  if (!Correo || !Password) {
    return res.status(400).json({ success: false, message: "Faltan datos" });
  }

  const query = "SELECT * FROM usuarios WHERE Correo = ? AND Password = ?";
  db.query(query, [Correo, Password], (err, result) => {
    if (err) {
      console.error("Error en la consulta:", err);
      return res.status(500).json({ success: false, message: "Error en el servidor" });
    }

    if (result.length > 0) {
      res.json({ success: true, message: "Inicio de sesión correcto" });
    } else {
      res.json({ success: false, message: "Credenciales incorrectas" });
    }
  });
});

// 🔹 Ruta para obtener tareas con nombres de usuarios
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

// 🔹 Iniciar servidor
const PORT = 3000;
app.listen(PORT, () => {
  console.log(`Servidor corriendo en http://localhost:${PORT}`);
});
