const express = require('express');
const mysql = require('mysql2');
const cors = require('cors');
const multer = require('multer');
const path = require('path');
const fs = require('fs');

const app = express();
const PORT = 3000;

// Middleware
app.use(cors());
app.use(express.json({ limit: '10mb' }));
app.use(express.urlencoded({ extended: true, limit: '10mb' }));
app.use('/uploads', express.static('uploads'));

// Criar pasta uploads se não existir
if (!fs.existsSync('uploads')) {
    fs.mkdirSync('uploads');
}

// Configuração do Multer para upload de fotos
const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, 'uploads/');
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

const upload = multer({
    storage: storage,
    limits: { fileSize: 5 * 1024 * 1024 }, // 5MB
    fileFilter: (req, file, cb) => {
        const allowedTypes = ['image/jpeg', 'image/png', 'image/gif', 'image/webp'];
        if (allowedTypes.includes(file.mimetype)) {
            cb(null, true);
        } else {
            cb(new Error('Formato não suportado. Use JPG, PNG, GIF ou WebP.'));
        }
    }
});

// Configuração do Banco de Dados MySQL
const db = mysql.createConnection({
    host: 'localhost',
    user: 'root',
    password: '', // Deixe vazio se não tiver senha
    database: 'encontre_me',
    port: 3306
});

// Conectar ao MySQL
db.connect((err) => {
    if (err) {
        console.error('❌ Erro ao conectar ao MySQL:', err);
        return;
    }
    console.log('✅ Conectado ao MySQL!');
    
    // Criar tabela se não existir
    const createTable = `
        CREATE TABLE IF NOT EXISTS animais (
            id INT PRIMARY KEY AUTO_INCREMENT,
            nome VARCHAR(100) NOT NULL,
            especie VARCHAR(50) NOT NULL,
            local VARCHAR(200) NOT NULL,
            descricao TEXT,
            status ENUM('perdido', 'achado') NOT NULL,
            foto VARCHAR(255),
            data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
        )
    `;
    db.query(createTable, (err) => {
        if (err) {
            console.error('❌ Erro ao criar tabela:', err);
        } else {
            console.log('✅ Tabela "animais" criada/verificada!');
        }
    });
});

// --- ROTAS DA API ---

// Rota para listar todos os animais
app.get('/api/animais', (req, res) => {
    const sql = 'SELECT * FROM animais ORDER BY data_cadastro DESC';
    db.query(sql, (err, results) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json(results);
    });
});

// Rota para cadastrar animal com foto
app.post('/api/animais', upload.single('foto'), (req, res) => {
    const { nome, especie, local, descricao, status } = req.body;
    const foto = req.file ? req.file.filename : null;
    
    if (!nome || !local) {
        return res.status(400).json({ error: 'Nome e local são obrigatórios!' });
    }
    
    const sql = `
        INSERT INTO animais (nome, especie, local, descricao, status, foto) 
        VALUES (?, ?, ?, ?, ?, ?)
    `;
    const values = [nome, especie, local, descricao, status, foto];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        res.json({ 
            id: result.insertId, 
            message: 'Animal cadastrado com sucesso!',
            foto: foto
        });
    });
});

// Rota para atualizar animal
app.put('/api/animais/:id', upload.single('foto'), (req, res) => {
    const { id } = req.params;
    const { nome, especie, local, descricao, status, fotoExistente } = req.body;
    const foto = req.file ? req.file.filename : (fotoExistente || null);
    
    const sql = `
        UPDATE animais 
        SET nome = ?, especie = ?, local = ?, descricao = ?, status = ?, foto = ?
        WHERE id = ?
    `;
    const values = [nome, especie, local, descricao, status, foto, id];
    
    db.query(sql, values, (err, result) => {
        if (err) {
            return res.status(500).json({ error: err.message });
        }
        if (result.affectedRows === 0) {
            return res.status(404).json({ error: 'Animal não encontrado' });
        }
        res.json({ message: 'Animal atualizado com sucesso!' });
    });
});

// Rota para excluir animal
app.delete('/api/animais/:id', (req, res) => {
    const { id } = req.params;
    
    // Buscar foto para deletar do disco
    const selectSql = 'SELECT foto FROM animais WHERE id = ?';
    db.query(selectSql, [id], (err, results) => {
        if (err) return res.status(500).json({ error: err.message });
        
        const foto = results[0]?.foto;
        if (foto) {
            const filePath = path.join(__dirname, 'uploads', foto);
            if (fs.existsSync(filePath)) {
                fs.unlinkSync(filePath);
            }
        }
        
        const deleteSql = 'DELETE FROM animais WHERE id = ?';
        db.query(deleteSql, [id], (err, result) => {
            if (err) return res.status(500).json({ error: err.message });
            if (result.affectedRows === 0) {
                return res.status(404).json({ error: 'Animal não encontrado' });
            }
            res.json({ message: 'Animal excluído com sucesso!' });
        });
    });
});

// Iniciar servidor
app.listen(PORT, () => {
    console.log(`🚀 Servidor rodando em http://localhost:${PORT}`);
    console.log(`📸 Uploads salvos em: uploads/`);
});