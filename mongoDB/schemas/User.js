import mongoose from "mongoose";
const Schema = mongoose.Schema;
// Create Schema

const reqString = {
  type: String,
  required: true,
};

const UserSchema = new Schema({
  name: {
    type: String,
    required: true,
  },
  email: {
    type: String,
    required: true,
  },
  password: {
    type: String,
    required: true,
  },
  date: {
    type: Date,
    default: Date.now,
  },
  resume: {
    type: String,
    required: true,
  },
  resumePath: {
    type: String,
    required: true,
  },
  last_login_date: {
    type: String,
    // required: true,
  },
});

export default mongoose.model("users", UserSchema);
// export default User;
