const express = require('express');
const cors = require('cors');
const bcrypt = require('bcryptjs');
const dotenv = require('dotenv');
const { User } = require('./models');  // Mengimpor model User
const app = express();

dotenv.config();

const PORT = process.env.PORT || 3007;

app.use(cors());
app.use(express.json());

// Route untuk registrasi
app.post('/api/auth/register', async (req, res) => {
    const { username, email, password } = req.body;

    if (!username || !email || !password) {
        return res.status(400).json({ message: "Semua field harus diisi!" });
    }

    // Cek jika email sudah digunakan
    const userExists = await User.findOne({ where: { email } });
    if (userExists) {
        return res.status(400).json({ message: "Email sudah terdaftar!" });
    }

    // Hash password sebelum disimpan
    const hashedPassword = await bcrypt.hash(password, 10);

    // Menyimpan pengguna baru ke database
    const newUser = await User.create({ username, email, password: hashedPassword });
    res.status(201).json({ message: "Registrasi berhasil", user: newUser });
});

// Route untuk login
app.post('/api/auth/login', async (req, res) => {
    const { email, password } = req.body;

    const user = await User.findOne({ where: { email } });
    if (!user) {
        return res.status(401).json({ message: "Email atau password salah" });
    }

    // Memeriksa apakah password cocok
    const isMatch = await bcrypt.compare(password, user.password);
    if (!isMatch) {
        return res.status(401).json({ message: "Email atau password salah" });
    }

    res.status(200).json({ message: "Login berhasil", user });
});

app.get('/api/pages/search', async (req, res) => {
    const { query } = req.query;

    if (!query) {
        return res.status(400).json({ message: 'Query pencarian harus disertakan!' });
    }

    try {
        const pages = await Page.findAll({
            where: {
                [Op.or]: [
                    { title: { [Op.like]: `%${query}%` } },
                    { content: { [Op.like]: `%${query}%` } }
                ]
            }
        });

        if (pages.length === 0) {
            return res.status(404).json({ message: 'Halaman tidak ditemukan' });
        }

        res.status(200).json({ pages });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat mencari halaman', error });
    }
});

app.get('/api/pages', async (req, res) => {
    const { page = 1, limit = 10 } = req.query;
    const offset = (page - 1) * limit;

    try {
        const pages = await Page.findAll({
            limit: parseInt(limit),
            offset: parseInt(offset),
        });

        res.status(200).json({ pages });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil halaman', error });
    }
});

const Like = sequelize.define('Like', {
    pageId: {
        type: DataTypes.INTEGER,
        references: {
            model: Page,
            key: 'id'
        }
    },
    userId: {
        type: DataTypes.INTEGER,
        references: {
            model: User,
            key: 'id'
        }
    }
});

// Relasi: Seorang pengguna bisa memberi like pada banyak halaman
Like.belongsTo(User, { foreignKey: 'userId' });
Like.belongsTo(Page, { foreignKey: 'pageId' });

app.post('/api/pages/:id/like', verifyToken, async (req, res) => {
    const { id } = req.params;
    const userId = req.userId;  // Diambil dari token

    try {
        const page = await Page.findByPk(id);
        if (!page) {
            return res.status(404).json({ message: 'Halaman tidak ditemukan' });
        }

        // Cek apakah pengguna sudah memberi like
        const existingLike = await Like.findOne({ where: { pageId: id, userId } });
        if (existingLike) {
            return res.status(400).json({ message: 'Anda sudah memberi like pada halaman ini' });
        }

        // Membuat like baru
        const like = await Like.create({ pageId: id, userId });
        res.status(200).json({ message: 'Like berhasil diberikan', like });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat memberi like', error });
    }
});
app.get('/api/pages/:id/likes', async (req, res) => {
    const { id } = req.params;

    try {
        const page = await Page.findByPk(id);
        if (!page) {
            return res.status(404).json({ message: 'Halaman tidak ditemukan' });
        }

        const likeCount = await Like.count({ where: { pageId: id } });
        res.status(200).json({ likeCount });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat mengambil jumlah like', error });
    }
});
app.put('/api/pages/:id', verifyToken, async (req, res) => {
    const { id } = req.params;
    const { title, content } = req.body;
    const userId = req.userId;  // Diambil dari token

    try {
        const page = await Page.findByPk(id);
        if (!page) {
            return res.status(404).json({ message: 'Halaman tidak ditemukan' });
        }

        if (page.userId !== userId) {
            return res.status(403).json({ message: 'Anda tidak memiliki izin untuk mengedit halaman ini' });
        }

        page.title = title || page.title;
        page.content = content || page.content;
        await page.save();

        res.status(200).json({ message: 'Halaman berhasil diperbarui', page });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat memperbarui halaman', error });
    }
});
const https = require('https');
const fs = require('fs');

const options = {
    key: fs.readFileSync('path/to/your/private-key.pem'),
    cert: fs.readFileSync('path/to/your/certificate.pem'),
};

https.createServer(options, app).listen(PORT, () => {
    console.log(`Server berjalan di https://localhost:${PORT}`);
});
const jwt = require('jsonwebtoken');

const verifyToken = (req, res, next) => {
    const token = req.headers['authorization'];

    if (!token) {
        return res.status(403).json({ message: 'Token tidak ditemukan!' });
    }

    jwt.verify(token, process.env.JWT_SECRET, (err, decoded) => {
        if (err) {
            return res.status(403).json({ message: 'Token tidak valid!' });
        }
        req.userId = decoded.id;  // Menyimpan ID pengguna dalam request untuk digunakan di route lainnya
        next();
    });
};
app.post('/api/pages', verifyToken, async (req, res) => {
    const { title, content } = req.body;

    try {
        const newPage = await Page.create({
            title,
            content,
            userId: req.userId, // ID pengguna yang telah terverifikasi
        });

        res.status(201).json({ message: 'Halaman berhasil dibuat!', page: newPage });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat membuat halaman', error });
    }
});
const User = sequelize.define('User', {
    username: DataTypes.STRING,
    email: DataTypes.STRING,
    password: DataTypes.STRING,
    role: {
        type: DataTypes.ENUM('user', 'admin'),
        defaultValue: 'user',
    },
});
const checkAdmin = (req, res, next) => {
    if (req.userRole !== 'admin') {
        return res.status(403).json({ message: 'Akses ditolak, hanya admin yang dapat melakukan ini' });
    }
    next();
};
app.delete('/api/pages/:id', verifyToken, checkAdmin, async (req, res) => {
    const { id } = req.params;

    try {
        const page = await Page.findByPk(id);
        if (!page) {
            return res.status(404).json({ message: 'Halaman tidak ditemukan' });
        }

        await page.destroy();
        res.status(200).json({ message: 'Halaman berhasil dihapus' });
    } catch (error) {
        res.status(500).json({ message: 'Terjadi kesalahan saat menghapus halaman', error });
    }
});
const request = require('supertest');
const app = require('../server');

describe('POST /api/auth/register', () => {
    it('should return status 201 if registration is successful', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testUser',
                email: 'test@domain.com',
                password: 'password123',
            });

        expect(res.status).toBe(201);
        expect(res.body.message).toBe('Registrasi berhasil');
    });

    it('should return status 400 if email already exists', async () => {
        const res = await request(app)
            .post('/api/auth/register')
            .send({
                username: 'testUser',
                email: 'test@domain.com',
                password: 'password123',
            });

        expect(res.status).toBe(400);
        expect(res.body.message).toBe('Email sudah terdaftar!');
    });
});

// Mulai server
app.listen(PORT, () => {
    console.log(`Server berjalan di http://localhost:${PORT}`);
});
