import express, { response } from "express";
import runJobs from "../../cron-tasks/cron-jobs.js";
import jobsModel from "../../mongoDB/schemas/job-schema.js";
import db from "../../mongoDB/database.js";
import bodyparser from "body-parser";
import axios from "axios";
import fs from "fs";

const router = express.Router();
// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded({ extended: false }));

router.post("/start-engine", (req, res) => {
  let jobPosting = "";
  let resume = "";

  try {
    jobPosting = fs.readFileSync("/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/job-posting.txt", "utf8");
    resume = fs.readFileSync("/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/user-resume.txt", "utf8");
  } catch (err) {
    console.error(err);
  }

  axios
    .post("http://localhost:8000/get-score", {
      jobPosting: jobPosting,
      resume: resume,
      language: "english"
    })
    .then((res) => {
      console.log(`statusCode: ${res.status}`);
      console.log(res);
    })
    .catch((error) => {
      console.error(error);
    });

  //   //   const { array } = req.body;
  //   //   console.log(array);

  //   // Calculate sum
  //   var sum = 0;
  //   //   for (var i = 0; i < array.length; i++) {
  //   //     if (isNaN(array[i])) {
  //   //       continue;
  //   //     }
  //   //     sum += array[i];
  //   //   }
  //   //   console.log(sum);

  //   // Return json response
  //   res.json({ result: sum });
});

router.get("/mami", (req, res) => {
  // runJobs();
  res.send("Hello World!");
});
export default router;
