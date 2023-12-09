/********************************************************************************
*  WEB322 – Assignment 06
* 
*  I declare that this assignment is my own work in accordance with Seneca's
*  Academic Integrity Policy:
* 
*  https://www.senecacollege.ca/about/policies/academic-integrity-policy.html
* 
*  Name: Nathan Tsang Student ID: 132715228 Date: Dec 8th, 2023
*
*  Published URL: https://wicked-pear-suspenders.cyclic.app
*
********************************************************************************/
const express = require("express");
const path = require("path");
const authData= require("./modules/auth-service")
const legoData = require("./modules/legoSets");
const clientSessions = require('client-sessions');

const app = express();
app.use(express.urlencoded({ extended: true }));

app.use(clientSessions({
  cookieName: 'session',
  secret: 'oijeweoieweo',
  duration: 24 * 60 * 1000, // 2 min
  activeDuration: 1000 * 60 // 1 min
}));

app.use((req, res, next) => {
  res.locals.session = req.session;
  next();
});

const PORT = process.env.PORT || 8080;
app.set('views', path.join(__dirname, 'views'));

app.set("view engine", "ejs");
app.use(express.static("public"));

app.get("/", (req, res) => {
  res.render("home");
});


app.get('/register', (req, res) => {
  console.log("GET register route: Rendering register page");
  res.render('register', { errorMessage: '', successMessage: '' });
});

app.post('/register', (req, res) => {
  const userData = req.body;
  authData.registerUser(userData)
    .then(() => {
      console.log("POST register route: User created successfully");
      res.render('register', { successMessage: 'User created', errorMessage: '' });
    })
    .catch((err) => {
      console.error("POST register route error:", err);
      res.render('register', { errorMessage: err, userName: req.body.userName, successMessage: ''});
    });
});


app.get('/login', (req, res) => {
  const errorMessage = '';
  res.render('login', { userName: '', errorMessage}); 
});

app.post('/login', async (req, res) => {
  try {
    req.body.userAgent = req.get('User-Agent');
    const userData = req.body;
    const user = await authData.checkUser(userData);
    req.session.user = {
      userName: user.userName,
      email: user.email,
      loginHistory: user.loginHistory
    };
    res.redirect('/lego/sets');
  } catch (err) {
    res.render('login', { errorMessage: err, userName: req.body.userName });
  }
});


app.get('/logout', (req, res) => {
  req.session.reset();
  res.redirect('/');
});

app.get('/userHistory', authData.ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.get('/userHistory', authData.ensureLogin, (req, res) => {
  res.render('userHistory');
});

app.get("/about", (req, res) => {
  res.render("about");
});

app.get("/lego/sets", (req, res) => {
  if (req.query.theme) {
    legoData
      .getSetsByTheme(req.query.theme)
      .then((data) => {
        res.render("sets", { sets: data });
      })
      .catch((err) =>
        res.status(404).render("404", {
          message: "No Sets found for a matching theme",
        })
      );
  }

  legoData
    .getAllSets()
    .then((data) => res.render("sets", { sets: data }))
    .catch((err) => {
      console.log(err);
      res.status(404).render("404", {
        message: "I'm sorry, we're unable to find what you're looking for",
      });
    });
});

app.get("/lego/sets/:id", (req, res) => {
  
  legoData
    .getSetByNum(req.params.id)
    .then((data) => res.render("set", { set: data }))
    .catch((err) =>
      res.status(404).render("404", {
        message: "No Sets found for a specific set num",
      })
    );
});


app.post("/lego/addSet", authData.ensureLogin, (req, res) => {
  legoData.addSet(req.body) 
    .then(() => res.redirect("/lego/sets"))
    .catch((err) => {

      console.error(err);

      res.status(500).render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      });
    });
});

app.get("/lego/addSet", authData.ensureLogin, (req, res) => {
  legoData
    .getAllThemes()
    .then((themeData) => res.render("addSet", { themes: themeData }))
    .catch((err) =>
      res.status(404).render("404", {
        message: `${err.message}`,
      })
    );
});


app.get('/lego/editSet/:num', authData.ensureLogin, async (req, res) => {
  try {
    const [set, themes] = await Promise.all([
      legoData.getSetByNum(req.params.num),
      legoData.getAllThemes(),
    ]);

    res.render('editSet', { set, themes });
  } catch (error) {
    res.status(404).render('404', { message: error.message });
  }
});

app.post('/lego/editSet', authData.ensureLogin, async (req, res) => {
  try {
    const setData = {
      name: req.body.name,
      year: req.body.year,
      num_parts: req.body.num_parts,
      img_url: req.body.img_url,
      theme_id: req.body.theme_id,
      set_num: req.body.set_num,
    };

    await legoData.editSet(req.body.set_num, setData);

    res.redirect('/lego/sets');
  } catch (error) {
    res.status(500).render('500', { message: `Error editing set: ${error.message}` });
  }
});


app.get("/lego/deleteSet/:num", authData.ensureLogin, async (req, res) => {
  legoData
    .deleteSet(req.params.num)
    .then(() => res.redirect("/lego/sets"))
    .catch((err) =>
      res.render("500", {
        message: `I'm sorry, but we have encountered the following error: ${err}`,
      })
    );
});


app.use((req, res) => {
  res.status(404).render("404", {
    message: "No view matched for a specific route",
  });
});

legoData.initialize()
  .then(() => authData.initialize())
  .then(() => {
    app.listen(PORT, () => {
      console.log(`Server is running on port ${PORT}`);
    });
  })
  .catch((error) => {
    console.error('Failed to start the server:', error);
  });

