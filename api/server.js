import express, { response } from "express";
import runJobs from "../cron-tasks/cron-jobs.js";
import jobsModel from "../mongoDB/schemas/job-schema.js";
import db from "../mongoDB/database.js";
import passport from "passport";
import users from "./routes/users.js";
import passportConfing from "../config/passport.js";

const app = express();
const router = express.Router();
const port = 8080 || process.env.PORT;
const getPagination = (page, size) => {
  const limit = size ? +size : 3;
  const offset = page ? page * limit : 0;
  return { limit, offset };
};

app.use(
  bodyParser.urlencoded({
    extended: false,
  })
);
app.use(bodyParser.json());
app.use(passport.initialize());
app.use("/api", router);
app.listen(port, () => {
  console.log(`Example app listening on port ${port}`);
});

passportConfing(passport);




router.get("/start-jobs", (req, res) => {
  runJobs();
  res.send("Hello World!");
});

router.get("/get-jobs", (req, res) => {
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

  db().then(async (mongoose) => {
    try {
      console.log(`Connected to [job_portal] DB.`);
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
    } finally {
      console.log("Connection closed");
      mongoose.connection.close();
    }
  });
});
