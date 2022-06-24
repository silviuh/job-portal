import mongoose from "mongoose";
import validator from "validator";

const recommendedJobs = mongoose.Schema({
  email: String, // String is shorthand for {type: String}
  jobs: [
    {
      jobLocation: String,
      jobName: String,
      jobEmployer: String,
      jobDate: String,
      jobUrl: String,
      jobDescription: String,
      score: String,
    }
  ]
});

export default mongoose.model("users_recommended_jobs", recommendedJobs);
