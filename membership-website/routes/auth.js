const express = require('express');
const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const db = require('../models/db'); // Sesuaikan path dengan konfigurasi database kamu
const router = express.Router();

const JWT_SECRET = process.env.JWT_SECRET || 'supersecretkey';

// Registrasi Pengguna
router.post('/register', async (req, res) => {
    const { username, email, password } = req.body;

    try {
        // Hash password
        const hashedPassword = await bcrypt.hash(password, 10);

        // Simpan pengguna ke database
        const result = await db.query(
            'INSERT INTO users (username, email, password) VALUES (?, ?, ?)',
            [username, email, hashedPassword]
        );

        res.status(201).json({ message: 'Registrasi berhasil', userId: result.insertId });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Registrasi gagal' });
    }
});

// Login Pengguna
router.post('/login', async (req, res) => {
    const { email, password } = req.body;

    try {
        // Periksa email
        const [users] = await db.query('SELECT * FROM users WHERE email = ?', [email]);

        if (users.length === 0) {
            return res.status(404).json({ message: 'Email tidak ditemukan' });
        }

        const user = users[0];

        // Verifikasi password
        const isPasswordValid = await bcrypt.compare(password, user.password);

        if (!isPasswordValid) {
            return res.status(401).json({ message: 'Password salah' });
        }

        // Generate token
        const token = jwt.sign({ id: user.id, username: user.username }, JWT_SECRET, { expiresIn: '1h' });

        res.json({ message: 'Login berhasil', token });
    } catch (error) {
        console.error(error.message);
        res.status(500).json({ message: 'Login gagal' });
    }
});

module.exports = router;
