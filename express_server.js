var express = require("express");
var app = express();
var cookieSession = require("cookie-session")
app.use(cookieSession({
  name: "session",
  keys: ["topsecret"],
}))
const bodyParser = require("body-parser");
app.use(bodyParser.urlencoded({ extended: true }));
const bcrypt = require('bcrypt');
var morgan = require('morgan');
app.use(morgan('tiny'));
app.set("view engine", "ejs");
var PORT = process.env.PORT || 8080; // default port 8080


//Data 
const users = {
  "fluffy": {
    id: "fluffy",
    email: "fluffybunny@example.com",
    password: bcrypt.hashSync("purple-monkey-dinosaur", 10)
  },
  "bunny": {
    id: "bunny",
    email: "rohit@gmail.com",
    password: bcrypt.hashSync("123", 10)
  }
};

const urlDatabase = {
  "fluffy": {
    "b2xVn2": "http://www.lighthouselabs.ca"
  },
  "bunny": {
    "9sm5xK": "http://www.google.com"
  }
};

// A Separate function to generate random string
function generateRandomString() {
  var text = "";
  var possible = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";
  for (var i = 0; i < 6; i++)
    text += possible.charAt(Math.floor(Math.random() * possible.length));
  return text;
}

//A separate function to check if email is already used to register
function checkDuplicateEmail(email) {
  var didFindDuplicate = false;
  for (var user in users) {
    if (users[user].email === email) {
      didFindDuplicate = true;
      break;
    }
  }
  return didFindDuplicate;
}

// A separate function to check for email and passwords match database
function authenticateUser(email, password) {
  var isAuthenticated = false;
  var result;
  for (var key in users) {
    if ((users[key].email === email) && bcrypt.compareSync(password, users[key].password)) {
      isAuthenticated = true;
      result = key;
      break;
    }
  }
  if (isAuthenticated) {
    return users[result];
  } else {
    return false;
  }
}

app.get("/", (req, res) => {
  let userID = req.session.user_id;
  if (userID) {
    res.redirect("/urls");
  } else {
    res.redirect("/login");
  }
});

app.get("/urls", (req, res) => {
  let templateVars;
  let userID = req.session.user_id; 
  if (userID) {
    console.log('db',urlDatabase[userID])
      templateVars = {
      urls: urlDatabase[userID],
      user: users[userID]
    };
  res.render("urls_index", templateVars);
  } else {
    templateVars = {
      urls: urlDatabase,
      user: false
    };
    res.render("urls_index", templateVars);
  }
});

app.get("/register", (req, res) => {
  return res.render("urls_register");
});

app.post("/register", (req, res) => {
  var result = checkDuplicateEmail(req.body.email);
  if (req.body.email === "" || req.body.password === "") {
    return res.send(401);
  }
  if (result === true) {
    res.send(401)
  } else {
    let user = {
      id: generateRandomString(),
      email: req.body.email,
      password: bcrypt.hashSync(req.body.password, 10)
    }
    users[user.id] = user; 
    req.session.user_id = (user.id);
    return res.redirect("/urls");
  } 
});

app.get("/urls/new", (req, res) => {
  if (req.session.user_id) {
    let templateVars = { user: users[req.session.user_id] };
    return res.render("urls_new", templateVars);
  } else {
    return res.redirect("/login");
  }
});

app.get("/u/:shortURL", (req, res) => {
  let longURL = urlDatabase[req.session.user_id][req.params.shortURL];
  if (!longURL) {
    return res.send(404);
  } else {
    return res.redirect(longURL);
  }
});

app.get("/login", (req, res) => {
  return res.render("urls_login");
});

app.post("/login", (req, res) => {
  var result = authenticateUser(req.body.email, req.body.password);
  //the user credentials matches
  if (result) {
    req.session.user_id = result.id;
    return res.redirect("/urls");
  } else {
    //the user credentials don't match
    return res.send(403);
  }
});

app.post("/logout", (req, res) => {
  delete req.session.user_id;
  req.session = null;
  return res.redirect("/urls");
});

app.post("/urls", (req, res) => {
  let userID = req.session.user_id;
  let newShortURL = generateRandomString();
  urlDatabase[userID][newShortURL] = req.body.longURL;
  return res.redirect(`/urls/`);
});

app.get("/urls/:id", (req, res) => {
  if (req.session.user_id) {
    let templateVars = {
      shortURL: req.params.id,
      urls: urlDatabase[req.session.user_id][req.params.id],
      user: users[req.session.user_id]
    };
    return res.render("urls_show", templateVars);
  } else {
    return  res.redirect("/register");
  }
});

app.post("/urls/:id", (req, res) => {
  urlDatabase[req.session.user_id][req.params.id] = req.body.urls;
  return res.redirect("/urls");
});

// check if the short url belongs to user first ---
app.post("/urls/:id/delete", (req, res) => {
  if (req.session.user_id) {
   delete urlDatabase[req.session.user_id][req.params.id];
    return res.redirect("/urls");
  } else {
    return res.redirect("/login");
  }
});




app.listen(PORT, () => {
  console.log(`Example app listening on port ${PORT}!`);
});