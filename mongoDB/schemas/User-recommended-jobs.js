import mongoose from "mongoose";
import validator from "validator";

const recommendedJobs = mongoose.Schema({
  email: String, // String is shorthand for {type: String}
  jobs: [
    {
      _id: String,
      jobLocation: String,
      jobName: String,
      jobEmployer: String,
      jobDate: String,
      jobUrl: String,
      jobDescription: String,
      score: String,
      jobImageURL: String
    }
  ]
});

export default mongoose.model("users_recommended_jobs", recommendedJobs);
