/** @format */

require("dotenv").config();
const Sequelize = require("sequelize");
// const themeData = [
// ];
// const setData = [
// ];

// set up sequelize to point to our postgres database
let sequelize = new Sequelize(
  process.env.DB_DATABASE,
  process.env.DB_USER,
  process.env.DB_PASSWORD,
  {
    host: process.env.DB_HOST,
    dialect: "postgres",
    port: 5432,
    dialectOptions: {
      ssl: { rejectUnauthorized: false },
    },
  }
);

// Defining models
const Theme = sequelize.define('Theme', {
  id: {
    type: Sequelize.INTEGER,
    primaryKey: true,
    autoIncrement: true
  },
  name: Sequelize.STRING
});

const Set = sequelize.define('Set', {
  set_num: {
    type: Sequelize.STRING,
    primaryKey: true
  },
  name: Sequelize.STRING,
  year: Sequelize.INTEGER,
  num_parts: Sequelize.INTEGER,
  theme_id: Sequelize.INTEGER,
  img_url: Sequelize.STRING
});



Set.belongsTo(Theme, { foreignKey: "theme_id" });
// Theme.hasMany(Set, { foreignKey: "theme_id" });

function initialize() {
  // Sync all models with the database
  return sequelize.sync()
  .then(() => {
    // Successfully synchronized with the database
    console.log('Database synced successfully');
    // Resolve the promise here if needed
  })
  .catch((error) => {
    // Failed to synchronize with the database
    console.error('Error syncing database:', error);
    // Reject the promise if needed
  });
}

function getAllSets() {
  // Retrieve all sets with their associated themes
  return Set.findAll({
    include: [Theme]
  });
}

function getSetByNum(setNum) {
  // Retrieve a single set by its set number
  return Set.findOne({
    where: { set_num: setNum },
    include: [Theme]
  }).then((set) => {
    if (!set) {
      throw new Error('Unable to find requested set');
    }
    return set;
  });
}

function getSetsByTheme(theme) {
  // Retrieve all sets with a specific theme
  return Set.findAll({
    include: [Theme],
    where: {
      '$Theme.name$': {
        [Sequelize.Op.iLike]: `%${theme}%`,
      },
    },
  }).then((sets) => {
    if (!sets || sets.length === 0) {
      throw new Error('Unable to find requested sets');
    }
    return sets;
  });
}

// legoSets.js
function addSet(setData) {
  return Set.create(setData);
}

function getAllThemes() {
  return new Promise((resolve, reject) => {
    Theme.findAll()
      .then(themes => {
        resolve(themes);
      })
      .catch(error => {
        reject(error);
      });
  });
}


function editSet(set_num, setData) {
  return new Promise(async (resolve, reject) => {
    try {
      const existingSet = await Set.findOne({
        where: { set_num },
      });

      if (!existingSet) {
        reject(new Error('Set not found'));
        return;
      }

      await existingSet.update(setData);

      resolve();
    } catch (error) {
      reject(new Error(error.errors[0].message));
    }
  });
}


function deleteSet(set_num) {
  return new Promise((resolve, reject) => {
    Set.destroy({
      where: {
        set_num: set_num,
      },
    })
      .then(() => {
        resolve();
      })
      .catch((err) => {
        reject(err.message);
      });
  });
}

module.exports = {
  initialize,
  getAllSets,
  getSetByNum,
  getSetsByTheme,
  addSet,
  getAllThemes,
  editSet,
  deleteSet,
};

// sequelize
//   .sync()
//   .then( async () => {
//     try{
//       await Theme.bulkCreate(themeData);
//       await Set.bulkCreate(setData); 
//       console.log("-----");
//       console.log("data inserted successfully");
//     }catch(err){
//       console.log("-----");
//       console.log(err.message);

//       // NOTE: If you receive the error:

//       // insert or update on table "Sets" violates foreign key constraint "Sets_theme_id_fkey"

//       // it is because you have a "set" in your collection that has a "theme_id" that does not exist in the "themeData".   

//       // To fix this, use PgAdmin to delete the newly created "Themes" and "Sets" tables, fix the error in your .json files and re-run this code
//     }

//     process.exit();
//   })
//   .catch((err) => {
//     console.log('Unable to connect to the database:', err);
//   });