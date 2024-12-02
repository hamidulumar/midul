const { Sequelize } = require('sequelize');

const sequelize = new Sequelize(process.env.DB_URI || 'mysql://root:password@localhost:3306/membership-website', {
    dialect: 'mysql',
    logging: false,
});

module.exports = sequelize;
