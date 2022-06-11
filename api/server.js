import express, { response } from "express";
import runJobs from "../cron-tasks/cron-jobs.js";
import jobsModel from "../mongoDB/schemas/job-schema.js";
import db from "../mongoDB/database.js";
import passport from "passport";
import users from "./routes/users.js";
import jobs from "./routes/jobs.js";
import passportConfing from "../config/passport.js";
import bodyParser from "body-parser";

const app = express();
const port = 8080 || process.env.PORT;
const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

db()
  .then(() => console.log("MongoDB successfully connected"))
  .catch((err) => console.log(err));

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(passport.initialize());
passportConfing(passport);

app.use("/api/users", users);
app.use("/api/jobs", jobs);

app.listen(port, () => {
  console.log(`[JOB PORTAL] app listening on port ${port}`);
});

