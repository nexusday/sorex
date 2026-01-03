const express = require('express');
const path = require('path');
const app = express();
const PORT = process.env.PORT || 3000;


app.use(express.static(path.join(__dirname, 'public')));
app.use(express.static(__dirname));


app.get('*', (req, res) => {
    res.sendFile(path.join(__dirname, 'index.html'));
});


app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send('Algo salió mal');
});


app.listen(PORT, () => {
    console.log(`Servidor ejecutándose en http://localhost:${PORT}/`);
    console.log('Presiona Ctrl+C para salir');
});
