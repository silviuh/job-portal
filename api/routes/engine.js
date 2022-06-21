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

router.get("/get-sorted-jobs", async (req, response) => {
  let resume = "";
  resume = fs.readFileSync(
    "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/user-resume-romana.txt",
    "utf8"
  );

  try {
    const jobs = await jobsModel.find(
      {}
      //   { jobDescription: 1, _id: 1, jobName: 1, jobLocation: 1 }
    );

    //TODO SCOATE AWAIT URILE DE LA RES.JSOn
    await axios
      .post("http://localhost:8000/get-score", {
        jobPosting: jobs,
        resume: resume,
        language: "english",
      })
      .then((res) => {
        console.log(`statusCode: ${res.status}`);
        const str = "\\";

        const axiosResponse = {
          error: false,
          message: res.data.container_data,
          //   message: JSON.stringify(res.data.container_data, null, "").replace(str, "")
        };

        // response.json(JSON.stringify(axiosResponse, null, "").replace(str, ""));
        response.json(axiosResponse);
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
