import express from "express";
import bcrypt from "bcryptjs";
import jwt from "jsonwebtoken";
import keys from "../../config/keys.js";
import validateRegisterInput from "../validation/register.js";
import validateUpdateInput from "../validation/update.js";
import validateLoginInput from "../validation/login.js";
import isFileValid from "../validation/register.js";
import User from "../../mongoDB/schemas/User.js";
import db from "../../mongoDB/database.js";
import formidable from "formidable";
import fs from "fs";
import path from "path";
import { dirname } from "path";
import { Server } from "http";
import axios from "axios";

const router = express.Router();
const __dirname = path.resolve(path.dirname(""));
const resumeDirNamePrefix = "resumes";

// @route POST api/users/register
// @desc Register user
// @access Public
router.post("/register", async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    const reqBody = {
      name: fields.name,
      email: fields.email,
      password: fields.password,
      password2: fields.password2,
      resume: fields.resume,
    };

    const { errors, isValid } = validateRegisterInput(reqBody);

    console.log(isValid);

    if (!isValid) {
      console.log(errors);
      return res.status(400).json(errors);
    }

    const oldPath = files.fileObj.filepath;
    const newDirPath = path.join(__dirname, resumeDirNamePrefix, fields.name); // every user will have his directory for resume

    if (!fs.existsSync(newDirPath)) {
      fs.mkdirSync(newDirPath, { recursive: true });
    }

    const rawData = fs.readFileSync(oldPath);
    const newPath = newDirPath + "/" + fields.fileName;

    fs.writeFile(newPath, rawData, function (err) {
      if (err) console.log(err);
      // return res.send("Successfully uploaded");
    });

    await User.findOne({ email: reqBody.email }).then(async (user) => {
      if (user) {
        return res.status(400).json({ email: "Email already exists" });
      } else {
        const currentDate = new Date();
        const newUser = new User({
          name: reqBody.name,
          email: reqBody.email,
          password: reqBody.password,
          resume: reqBody.resume,
          resumePath: newPath,
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

        axios
          .post("http://localhost:8000/register-job-for-user", {
            email: newUser.email,
            resumePath: newUser.resumePath,
          })
          .then((res) => {
            const str = "\\";
            return res.status;
          })
          .catch((error) => {
            console.log(error.message);
            return error.message;
          });
      }
    });
  });
});

router.post("/update", async (req, res) => {
  const form = new formidable.IncomingForm();

  form.parse(req, async function (err, fields, files) {
    let newPath = "";
    const reqBody = {
      email: fields.email,
      password: fields.password,
      password2: fields.password2,
    };

    const { errors, isValid } = validateUpdateInput(reqBody);
    if (!isValid) {
      console.log(errors);
      return res.status(400).json(errors);
    }

    await User.findOne({ email: reqBody.email }).then(async (user) => {
      if (user) {
        if (files) {
          if (fs.existsSync(user.resumePath)) {
            fs.unlinkSync(user.resumePath);
          }

          const oldPath = files.fileObj.filepath;
          const newDirPath = path.join(
            __dirname,
            resumeDirNamePrefix,
            user.name
          );

          if (!fs.existsSync(newDirPath)) {
            fs.mkdirSync(newDirPath, { recursive: true });
          }

          const rawData = fs.readFileSync(oldPath);
          newPath = newDirPath + "/" + fields.fileName;

          fs.writeFile(newPath, rawData, function (err) {
            if (err) console.log(err);
          });
        }
      } else {
        return res.status(400).json({ email: "Email does not exists" });
      }
    });

    const filter = { email: reqBody.email };
    const update = { resumePath: newPath };
    let doc = await User.findOneAndUpdate(filter, update, {
      new: true,
    });

    if (reqBody.password) {
      bcrypt.genSalt(10, async (_err, salt) => {
        bcrypt.hash(reqBody.password, salt, async (err, hash) => {
          if (err) throw err;
          const filter = { email: reqBody.email };
          const update = { password: hash };

          let doc = await User.findOneAndUpdate(filter, update, {
            new: true,
          });
          console.log(doc);
        });
      });
    }
  });

  return res.status(200).json({data: "User has updated succesfully"});
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

        axios
          .post("http://localhost:8000/preprocess-jobs-for-users", {
            email: user.email,
            resumePath: user.resumePath,
          })
          .then((res) => {
            const str = "\\";
            return res.status;
          })
          .catch((error) => {
            console.log(error.message);
            return error.message;
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
