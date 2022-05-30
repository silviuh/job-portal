import connectToDB from "./mongo.js";
import mongo from "./mongo.js";

const connectToMongoDB = async () => {
  await mongo().then((mongoose) => {
    try {
      console.log('Connected to mongodb!')
    } finally {
      mongoose.connection.close()
    }
  })
}

connectToMongoDB()