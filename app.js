import express from "express";
import nunjucks from "nunjucks";
import morgan from "morgan";
import session from "express-session";
import users from "./users.json" assert { type: "json" };
import stuffedAnimalData from "./stuffed-animal-data.json" assert { type: "json" };

const app = express();
const port = "8000";

app.use(morgan("dev"));
app.use(express.urlencoded({ extended: false }));
app.use(express.static("public"));
app.use(
  session({ secret: "ssshhhhh", saveUninitialized: true, resave: false })
);

nunjucks.configure("views", {
  autoescape: true,
  express: app,
});

function getAnimalDetails(animalId) {
  return stuffedAnimalData[animalId];
}

app.get("/", (req, res) => {
  res.render("index.html");
});

app.get("/all-animals", (req, res) => {
  res.render("all-animals.html", { animals: Object.values(stuffedAnimalData) });
});

app.get("/animal-details/:animalId", (req, res) => {
  const animalDetails = getAnimalDetails(req.params.animalId);
  res.render("animal-details.html", { animal: animalDetails });
});

app.get("/add-to-cart/:animalId", (req, res) => {
  const sess = req.session;
  const animalId = req.params.animalId;
  if (!sess.cart) {
    sess.cart = {};
  }
  if (!(animalId in sess.cart)) {
    sess.cart = {};
  }
  sess.cart[animalId] += 1;
  console.log(sess.cart);

  res.redirect("/cart");
});

app.get("/cart", (req, res) => {
  if (!req.session.cart) {
    req.session.cart = {};
  }
  const cart = req.session.cart;
  const animals = [];
  let orderTotal = 0;

  for (const animalId in cart) {
    const animalDetails = getAnimalDetails(animalId);
    const qty = cart[animalId];
    animalDetails.qty = qty;

    const subtotal = qty * animalDetails.price;
    animalDetails.subtotal = subtotal;

    orderTotal = +subtotal;
    animals.push(animalDetails);
  }

  res.render("cart.html", { animals: animals, orderTotal: orderTotal });
});

app.get("/checkout", (req, res) => {
  // Empty the cart.
  req.session.cart = {};
  res.redirect("/all-animals");
});

app.get("/login", (req, res) => {
  res.render("login.html");
});

app.post("/process-login", (req, res) => {
  console.log("hit /process-login");
  console.log(req.body.username);
  console.log(req.body.password);
  for (const user of users) {
    console.log("hit for-loop");
    console.log(user);
    if (
      req.body.username === user.username &&
      req.body.password === user.password
    ) {
      console.log("hit if-statement");
      req.session.username = user.username;
      res.redirect("/all-animals");
      return;
    }
  }
  res.render("login.html", { message: "Invalid username or password" });
});

app.get("/logout", (req, res) => {
  req.session.destroy((err) => {
    if (err) {
      console.log(err);
    }
    res.redirect("/all-animals");
  });
});

app.listen(port, () => {
  console.log(`Server running on http://localhost:${port}...`);
});
