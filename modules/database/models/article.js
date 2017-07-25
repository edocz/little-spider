/* jshint indent: 2 */

module.exports = function(sequelize, DataTypes) {
  return sequelize.define('article', {
    id: {
      type: DataTypes.INTEGER(11),
      allowNull: false,
      primaryKey: true,
      autoIncrement: true
    },
    title: {
      type: DataTypes.STRING(255),
      allowNull: false,
      defaultValue: '',
      unique: true
    },
    content: {
      type: DataTypes.TEXT,
      allowNull: false,
      defaultValue: ''
    },
		link: {
			type: DataTypes.STRING(255),
			allowNull: false,
			defaultValue: '',
			unique: true
		},
		pubDate: {
			type: DataTypes.DATE,
			allowNull: false
		}
  }, {
    tableName: 'article'
  });
};
