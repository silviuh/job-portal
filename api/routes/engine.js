import express, { response } from "express";
import runJobs from "../../cron-tasks/cron-jobs.js";
import jobsModel from "../../mongoDB/schemas/job-schema.js";
import recommendedJobsModel from "../../mongoDB/schemas/User-recommended-jobs.js";

import db from "../../mongoDB/database.js";
import bodyparser from "body-parser";
import axios from "axios";
import fs from "fs";

const router = express.Router();
// app.use(bodyparser.json());
// app.use(bodyparser.urlencoded({ extended: false }));

router.get("/get-sorted-jobs-with-paginaton", async (req, res) => {
  let pageNo = parseInt(req.query.pageNo);
  let size = parseInt(req.query.size);
  let email = req.query.email; // trimit jwt din fe si dau decode

  console.log("[get-sorted-jobs-with-paginaton] EMAIL: " + email);
  console.log("[get-sorted-jobs-with-paginaton] PAGE NO: " + pageNo);
  console.log("[get-sorted-jobs-with-paginaton]] SIZE :" + size);

  let query = {};
  let response = {};

  if (pageNo < 0 || pageNo === 0) {
    response = {
      error: true,
      message: "invalid page number, should start with 1",
    };
    return res.json(response);
  }

  query.skip = size * (pageNo - 1);
  query.limit = size;

  await recommendedJobsModel
    .aggregate([
      { $match: { email: email } },
      { $unwind: "$jobs" },
      { $skip: size * (pageNo - 1) },
      { $limit: size },
      { $project: { jobs: 1, _id: 0 } },
      // { $group: { _id: "$jobs" } },
      // { $project: { _id: 0 } },
    ])
    .then((data) => {
      let newArray = [];
      for (let i = 0; i < data.length; i++) newArray.push(data[i]["jobs"]);

      console.log("[get-sorted-jobs-with-paginaton]" + " " + newArray.length);
      if (newArray.length === 0)
        response = { error: false, message: newArray, isEmpty: "yes" };
      else response = { error: false, message: newArray };
      const str = "\\";

      res.json(JSON.stringify(response, null, "").replace(str, ""));
    })
    .catch((error) => {
      response = {
        error: true,
        message: error.message,
      };
      res.json(JSON.stringify(response, null, "  "));
    });
});

router.get("/get-sorted-jobs", async (req, response) => {
  let resume = "";
  resume = fs.readFileSync(
    "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/user-resume.txt",
    "utf8"
  );

  try {
    const jobs = await jobsModel.find(
      {}
      //   { jobDescription: 1, _id: 1, jobName: 1, jobLocation: 1 }
    );

    await axios
      .post("http://localhost:8000/get-score", {
        jobPosting: jobs,
        resume: resume,
        language: "english",
      })
      .then((res) => {
        const str = "\\";
        console.log(`A request has been made: statusCode: ${res.status}`);

        const axiosResponse = {
          error: false,
          message: res.data.container_data,
        };

        response.json(JSON.stringify(axiosResponse, null, "").replace(str, ""));
        // response.json(axiosResponse);
      })
      .catch((error) => {
        console.log(error.message);
        const axiosErrorResponse = {
          error: true,
          message: error.message,
        };
        response.json(JSON.stringify(axiosErrorResponse, null, "  "));
      });
  } catch (err) {
    console.log(err.message);
  }
});

export default router;
