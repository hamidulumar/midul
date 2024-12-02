const { DataTypes } = require('sequelize');
const sequelize = require('../config/database');
const User = require('./User'); // Menghubungkan dengan model User

const Page = sequelize.define('Page', {
    title: {
        type: DataTypes.STRING,
        allowNull: false,
    },
    content: {
        type: DataTypes.TEXT,
        allowNull: false,
    },
    views: {
        type: DataTypes.INTEGER,
        defaultValue: 0,  // Default untuk views adalah 0
    }
});

// Relasi: setiap halaman dibuat oleh satu pengguna
Page.belongsTo(User, { foreignKey: 'userId' });

module.exports = Page;
