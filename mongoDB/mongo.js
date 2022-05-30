import mongoose from 'mongoose';
const mongoPath = `mongodb://127.0.0.1:27017/job_platform`;

// export default async function mongo() {
//   await mongoose.connect(mongoPath, {
//     useNewUrlParser: true,
//     useUnifiedTopology: true,
//   });

//   return mongoose;
// }


main().catch(err => console.log(err));

async function main() {
  await mongoose.connect('mongodb://localhost:27017/job_platform');
}
