import mongoose from "mongoose";

const server = "127.0.0.1:27017";
const database = "job_platform";

class Database {
  constructor() {
    // this._connect();
  }

  _connect() {
    mongoose
      .connect(`mongodb://${server}/${database}`)
      .then(() => {
        console.log("Database connection successful");
      })
      .catch((err) => {
        console.error("Database connection error");
      });
  }

  _close() {
    mongoose.closeConnection();
  }
}

// export default new Database();

export default async () => {
  await mongoose.connect(`mongodb://${server}/${database}`, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });

  return mongoose;
}


