import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import keys from "../../config/keys.js";
import validateRegisterInput from "../validation/register.js";
import validateLoginInput from "../validation/login.js";
import User from "../../mongoDB/schemas/User.js";
import db from "../../mongoDB/database.js";

const router = express.Router();

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const { errors, isValid } = validateRegisterInput(req.body);
  if (!isValid) {
    return res.status(400).json(errors);
  }

  await User.findOne({ email: req.body.email }).then(async (user) => {
    if (user) {
      return res.status(400).json({ email: "Email already exists" });
    } else {
      const currentDate = new Date();
      const newUser = new User({
        name: req.body.name,
        email: req.body.email,
        password: req.body.password,
        resume: req.body.resume,
      });

      bcrypt.genSalt(10, async (_err, salt) => {
        bcrypt.hash(newUser.password, salt, async (err, hash) => {
          if (err) throw err;
          newUser.password = hash;
          await newUser
            .save()
            .then((user) => res.json(user))
            .catch((err) => console.log(err));
        });
      });
    }
  });
});

router.post("/upload-resume", (req, res) => {
  const newpath = __dirname + "/files/";
  const file = req.files.file;
  const filename = file.name;

  console.log(file);
  console.log(filename);
  console.log(`${newpath}${filename}`);

  file.mv(`${newpath}${filename}`, (err) => {
    if (err) {
      res.status(500).send({ message: "File upload failed", code: 200 });
    }
    res.status(200).send({ message: "File Uploaded", code: 200 });
  });
});

// @route POST api/users/login
// @desc Login user and return JWT token
// @access Public
router.post("/login", async (req, res) => {
  // Form validation
  const { errors, isValid } = validateLoginInput(req.body);
  // Check validation
  if (!isValid) {
    return res.status(400).json(errors);
  }
  const email = req.body.email;
  const password = req.body.password;
  // Find user by email

  await User.findOne({ email }).then(async (user) => {
    // Check if user exists
    if (!user) {
      return res.status(404).json({ emailnotfound: "Email not found" });
    }
    // Check password
    bcrypt.compare(password, user.password).then(async (isMatch) => {
      if (isMatch) {
        // User matched
        // Create JWT Payload
        const payload = {
          id: user.id,
          name: user.name,
        };
        // Sign token
        jwt.sign(
          payload,
          keys.secretOrKey,
          {
            expiresIn: 31556926, // 1 year in seconds
          },
          (err, token) => {
            res.json({
              success: true,
              token: "Bearer " + token,
            });
          }
        );

        const currentDate = new Date();
        const findQuerry = { email: user.email };
        const updateQuerry = {
          $set: { last_login_date: currentDate.toLocaleString() },
        };

        await User.findOneAndUpdate(findQuerry, updateQuerry).catch((error) => {
          console.log(error.message);
        });
      } else {
        return res
          .status(400)
          .json({ passwordincorrect: "Password incorrect" });
      }
    });
  });
});

export default router;
