import express from "express";
import path from "path";
import mongoose from "mongoose";
import cookieParser from "cookie-parser";
import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

const is_authenticate = async (req, res, next) => {
  const { token } = req.cookies;
  if (token) {
    const decoded = jwt.verify(token, "sjwshqkjsdqkqq");
    req.user = await User.findById(decoded._id);
    next();
  } else {
    return res.redirect("/login");
  }
};

const formschema = mongoose.Schema({
  name: String,
  email: String,
});

const userschema = mongoose.Schema({
  name: String,
  email: String,
  password: String,
});
const User = mongoose.model("user", userschema);
const Message = mongoose.model("message", formschema);

mongoose
  .connect("mongodb://localhost:27017/", {
    dbname: "Backend",
  })
  .then(() => console.log("data base connected"))
  .catch((e) => console.log(e));

const app = express();

app.use(express.static(path.join(path.resolve(), "public")));
app.use(express.urlencoded({ extended: true }));
app.use(cookieParser());

app.set("view engine", "ejs");

app.get("/", is_authenticate, (req, res) => {
  res.render("logout", { name: req.user.name });
});

app.get("/login", (req, res) => {
  res.render("login");
});

app.get("/add", (req, res) => {
  Message.create({ name: "Akay", email: "akayjimahan@gmail.com" }).then(() => {
    res.send("nice");
  });
});

app.post("/register", async (req, res) => {
  const { name, email, password } = req.body;

  let user = await User.findOne({ email });
  if (user) {
    return res.redirect("/login");
  }
  const hashedpassword=await bcrypt.hash(password,10);

  user = await User.create({
    name,
    email,
    password:hashedpassword,
  });

  const token = jwt.sign({ _id: user._id }, "sjwshqkjsdqkqq");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.redirect("/");
});

app.post("/login", async (req, res) => {
  const { email, password } = req.body;
  let user = await User.findOne({ email });
  if (!user) {
    return res.redirect("/register");
  }

  const ismatch =await  bcrypt.compare(password,user.password);
  if (!ismatch) {
    return res.render("login", { email, message: "Incorrect Password" });
  }

  const token = jwt.sign({ _id: user._id }, "sjwshqkjsdqkqq");

  res.cookie("token", token, {
    httpOnly: true,
    expires: new Date(Date.now() + 10 * 1000),
  });

  res.redirect("/");
});

app.get("/logout", (req, res) => {
  res.cookie("token", null, {
    httpOnly: true,
    expires: new Date(Date.now()),
  });
  res.redirect("/");
});

app.get("/register", (req, res) => {
  res.render("register");
});

app.listen(5001, () => {
  console.log("server is running");
});
