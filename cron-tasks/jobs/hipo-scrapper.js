import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

const pageUrl = "pagina";
let theLastPage = false;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

async function scrapeData() {
  const url = "https://www.hipo.ro/locuri-de-munca/cautajob";

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    let selectedElem = $(".page-last").attr("href").trim();
    selectedElem = selectedElem.substring(selectedElem.lastIndexOf("/") + 1);
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
      console.log(`Scrapping...[${i}]`);
      await scrapePage(i);
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";
  let jobs = [];

  if (pageNumber !== 1)
    url = "https://www.hipo.ro/locuri-de-munca/cautajob" + "/" + pageNumber;
  else url = "https://www.hipo.ro/locuri-de-munca/cautajob";

  //tbl-hipo tbl-results
  await axios(url)
    .then(async (response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      const baseURL = "https://www.hipo.ro/";
      const selectedElem = $(".tbl-hipo").find("tbody > tr");
      let jobDescription = "";

      // console.log(selectedElem.text());
      $(selectedElem).each(async (parentIndex, parentElem) => {
        const jobName = $(parentElem).find(".job-title > span").text().trim();
        const jobEmployer = $(parentElem)
          .find(".cell-company > a > span")
          .text()
          .trim();
        const jobLocation = $(parentElem)
          .find(".cell-city > span > a > span")
          .children("span")
          .text()
          .trim();

        let jobUrl =
          baseURL +
          $(parentElem).find(".cell-info").children(".job-title").attr("href");
        jobUrl = encodeURI(jobUrl.trim());

        const jobDate = $(parentElem).find(".cell-date > span").text().trim();

        if (!jobUrl.endsWith("undefined")) {
          await axios(jobUrl)
            .then(async (response) => {
              const data = response.data;
              const $ = cheerio.load(data);
              jobDescription = $("#anunt-content").text().trim();
            })
            .catch((error) => {
              console.error(error.message);
            });
        }

        if (
          !jobUrl.includes("undefined") &&
          jobLocation != "" &&
          jobName != "" &&
          jobEmployer != "" &&
          jobDate != "" &&
          jobUrl != "" &&
          jobDescription != ""
        ) {
          const job = {
            jobName: jobName,
            jobEmployer: jobEmployer,
            jobLocation: jobLocation,
            jobDate: jobDate,
            jobUrl: jobUrl,
            jobDescription: jobDescription,
            jobPageNumber: pageNumber,
          };

          const jobNumber = parentIndex * pageNumber;
          let jobInstance = new jobModel(job);
          jobInstance.save(function (err, job) {
            if (err) return console.error(err);
            // else if (job) console.log(`${job}`);
          });
        }
        // console.log(`[${jobNumber}]:  ${job}`);
      });

      // console.log(jobs);
      // fs.appendFile(
      //   "/Users/silviuh1/workspace/dev/facultate/licenta/training/cron-tasks/jobs/hipo-jobs-listed.json",
      //   JSON.stringify(jobs, null, 2),
      //   (err) => {
      //     if (err) {
      //       console.error(err);
      //       return;
      //     }
      //     // console.log("Successfully written data to file");
      //   }
      // );
      // await jobModel
      //   .insertMany(jobs)
      //   .then((doc) => {
      //     // console.log(doc);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });

      return jobs;
    })
    .catch((error) => {
      console.error(error);
    });
}

const connectToMongoDBandScrape = async () => {
  await db().then(async (mongoose) => {
    try {
      console.log("Connected to mongodb!");
      await scrapeData();
    } finally {
      console.log("Connection closed");
      mongoose.connection.close();
    }
  });
};

connectToMongoDBandScrape();
