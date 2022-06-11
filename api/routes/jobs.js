import express, { response } from "express";
import runJobs from "../../cron-tasks/cron-jobs.js";
import jobsModel from "../../mongoDB/schemas/job-schema.js";
import db from "../../mongoDB/database.js";

const app = express();
const router = express.Router();

router.get("/start-jobs", (req, res) => {
  runJobs();
  res.send("Hello World!");
});

router.get("/get-jobs", async (req, res) => {
  let pageNo = parseInt(req.query.pageNo);
  let size = parseInt(req.query.size);
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

  await jobsModel
    .find({}, {}, query)
    .then((data) => {
      response = { error: false, message: data };
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
export default router;
