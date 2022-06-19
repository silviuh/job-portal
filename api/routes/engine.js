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

router.post("/start-engine", async (req, res) => {
  let resume = "";
  resume = fs.readFileSync(
    "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/user-resume.txt",
    "utf8"
  );

  try {
    const descriptions = await jobsModel.find(
      {},
      { jobDescription: 1, _id: 1, jobName: 1}
    );

    axios
      .post("http://localhost:8000/get-score", {
        jobPosting: descriptions,
        resume: resume,
        language: "english",
      })
      .then((res) => {
        console.log(`statusCode: ${res.status}`);
        console.log(res);
      })
      .catch((error) => {
        console.error(error);
      });
  } catch (err) {
    console.log(err.message);
  }

  //   let jobPosting = "";
  //   try {
  //     jobPosting = fs.readFileSync("/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/job-posting.txt", "utf8");
  //     resume = fs.readFileSync("/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/user-resume.txt", "utf8");
  //   } catch (err) {
  //     console.error(err);
  //   }
});

export default router;
