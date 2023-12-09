const mongoose = require('mongoose');
let Schema = mongoose.Schema;
require('dotenv').config(); 
const bcrypt = require('bcryptjs');

mongoose.connect('mongodb+srv://user1:user1password@cluster0.plqbdkr.mongodb.net/?retryWrites=true&w=majority')

const userSchema = new Schema({
  userName: String,
  password: String,
  email: String,
  loginHistory: [{
    dateTime: { type: Date, default: Date.now },
    userAgent: String
  }]
});


  let User;

  function initialize(){
    return new Promise(function (resolve, reject) {
        let db = mongoose.createConnection(process.env.MONGODB);

        db.on('error', (err)=>{
            reject(err);
        });
        db.once('open', ()=>{
           User = db.model("users", userSchema);
           resolve();
        });
    });
  }

function registerUser(userData) {
  return new Promise((resolve, reject) => {
    if (userData.password !== userData.password2) {
      return reject("Passwords do not match");
    }

    bcrypt.hash(userData.password, 10)
      .then((hash) => {
        // Replace the plain text password with the hashed password
        userData.password = hash;
        
        // Save the user with the hashed password to the database
        let newUser = new User(userData);
        return newUser.save();
      })
      .then(() => {
        resolve(); // User registration successful
      })
      .catch((err) => {
        if (err.code === 11000) {
          reject("User Name already taken");
        } else {
          reject(`There was an error encrypting the password: ${err}`);
        }
      });
  });
}
function checkUser(userData) {
  return User.findOne({ userName: userData.userName })
    .then((user) => {
      if (!user) {
        throw `Unable to find user: ${userData.userName}`;
      }

      return bcrypt.compare(userData.password, user.password)
        .then((result) => {
          if (result) {
            return user;
          } else {
            throw `Incorrect Password for user: ${userData.userName}`;
          }
        });
    })
    .catch((err) => {
      throw `Error verifying the user: ${err}`;
    });
}

  
  
  function ensureLogin(req, res, next) {
    if (!req.session.user) {
      res.redirect('/login');
    } else {
      next();
    }
  }

  module.exports = {
    initialize,
    ensureLogin,
    registerUser,
    checkUser
  }