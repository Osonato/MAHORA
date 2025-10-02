const express = require('express');
const app = express();
const port = 3000; // Puedes usar otro puerto si lo prefieres

app.get('/', (req, res) => {
  res.send('¡Hola, Mundo con Express!');
});

app.listen(port, () => {
  console.log(`Aplicación Express escuchando en http://localhost:${port}`);
});