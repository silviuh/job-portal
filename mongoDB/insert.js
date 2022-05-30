import JobModel from "./schemas/job-schema.js";
import db from "./database.js";
import mongoose from "mongoose";
import jobModel from "./schemas/job-schema.js";

// database._connect();

// job
//   .save()
//   .then((doc) => {
//     console.log(doc);
//   })
//   .catch((err) => {
//     console.error(err);
//   })
//   .finally(() => {
//     database.close();
//   });

const connectToMongoDB = async () => {
  await db().then(async (mongoose) => {
    try {
      console.log("Connected to mongodb!");
      const job = {
        jobName: "BLA BLA Insights Internship",
        jobEmployer: "Endava Romania",
        jobLocation: "BUCURESTI",
        jobDate: "29.05.2022",
        jobUrl:
          "BL https://www.hipo.ro//locuri-de-munca/locuri_de_munca/187761/JTI-Romania/Endava-Interhsip",
        jobDescription: "",
      };

      //INSERT ONE DOCUMENT
      //   await new jobModel(job)
      //     .save()
      //     .then((doc) => {
      //       console.log(doc);
      //     })
      //     .catch((err) => {
      //       console.error(err);
      //     });

      //INSERT MANY DOCUMENTS
      await jobModel
        .insertMany([
          {
            jobName: "MAKA 1 BLA Insights Internship",
            jobEmployer: "Endava Romania",
            jobLocation: "BUCURESTI",
            jobDate: "29.05.2022",
            jobUrl:
              "BLSDSD https://www.hipo.ro//locuri-de-munca/locuri_de_munca/187761/JTI-Romania/Endava-Interhsip",
            jobDescription: "",
          },
          {
            jobName: "MAKA 2 BLA Insights Internship",
            jobEmployer: "Endava Romania",
            jobLocation: "BUCURESTI",
            jobDate: "29.05.2022",
            jobUrl:
              "BLDSDSD https://www.hipo.ro//locuri-de-munca/locuri_de_munca/187761/JTI-Romania/Endava-Interhsip",
            jobDescription: "",
          },
          {
            jobName: "MAKA 3 BLA Insights Internship",
            jobEmployer: "Endava Romania",
            jobLocation: "BUCURESTI",
            jobDate: "29.05.2022",
            jobUrl:
              "BLDWD https://www.hipo.ro//locuri-de-munca/locuri_de_munca/187761/JTI-Romania/Endava-Interhsip",
            jobDescription: "",
          },
        ])
        .then((doc) => {
          console.log(doc);
        });
    } finally {
      mongoose.connection.close();
    }
  });
};

connectToMongoDB();
