-- Criação do Banco de Dados
CREATE DATABASE IF NOT EXISTS encontre_me;
USE encontre_me;

-- Criação da Tabela de Animais
CREATE TABLE IF NOT EXISTS animais (
    id INT PRIMARY KEY AUTO_INCREMENT,
    nome VARCHAR(100) NOT NULL,
    especie VARCHAR(50) NOT NULL,
    local VARCHAR(200) NOT NULL,
    descricao TEXT,
    status ENUM('perdido', 'achado') NOT NULL,
    foto VARCHAR(255),
    data_cadastro TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

-- Inserindo dados de exemplo
INSERT INTO animais (nome, especie, local, descricao, status) VALUES
('Fred', 'Cachorro', 'Jardim América', 'Caramelo, coleira azul', 'perdido'),
('Mimi', 'Gato', 'Centro', 'Branco com manchas pretas', 'achado'),
('Piu', 'Pássaro', 'Vila Nova', 'Calopsita, canta muito', 'perdido');

-- Consultas de exemplo
SELECT * FROM animais WHERE status = 'perdido';
SELECT * FROM animais WHERE especie = 'Cachorro';
SELECT COUNT(*) FROM animais GROUP BY status;