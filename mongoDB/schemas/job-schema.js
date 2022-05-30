import mongoose from "mongoose";
import validator from "validator";

const reqJobName = {
  type: String,
  required: true,
  // unique: true
};

const reqString = {
  type: String,
  required: true,
};

const reqURL = {
  type: String,
  // validate: (value) => {
  //   return validator.isUrl(value)
  // }
  required: true,
  // unique: true
};

const jobSchema = mongoose.Schema({
  jobName: reqJobName,
  jobEmployer: String,
  jobLocation: reqString,
  jobDate: reqString,
  jobUrl: reqURL,
  jobDescription: String,
  jobPageNumber: Number
});

export default mongoose.model("job", jobSchema);
