/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('content', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    content: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: ''
    }
  }, {
    tableName: 'content'
  });
};
