const { Sequelize, DataTypes } = require('sequelize');

// Koneksi ke database MySQL
const sequelize = new Sequelize('membership-website', 'root', '', {
    host: 'localhost', // Jika menggunakan host lain, sesuaikan di sini
    dialect: 'mysql',
});

// Definisi model User
const User = sequelize.define('User', {
    username: {
        type: DataTypes.STRING,
        allowNull: false
    },
    email: {
        type: DataTypes.STRING,
        allowNull: false,
        unique: true
    },
    password: {
        type: DataTypes.STRING,
        allowNull: false
    }
});

// Sinkronisasi dengan database
sequelize.sync()
    .then(() => console.log('Database terhubung dan sinkron!'))
    .catch((err) => console.error('Terjadi kesalahan:', err));

module.exports = { sequelize, User };
