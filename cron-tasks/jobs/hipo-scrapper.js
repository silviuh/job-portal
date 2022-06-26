import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

const pageUrl = "pagina";
let theLastPage = false;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const replaceExpr = '"';
const regex = new RegExp(replaceExpr, "g");

async function scrapeData() {
  const url = "https://www.hipo.ro/locuri-de-munca/cautajob";

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    let selectedElem = $(".page-last").attr("href").trim();
    selectedElem = selectedElem.substring(selectedElem.lastIndexOf("/") + 1);
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; 40 < numberOfElements; i++) {
      console.log(`Scrapping...[${i}]`);
      await scrapePage(i);
      await delay(5_000);
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
        let jobImageURL = "";
        let jobName = $(parentElem).find(".job-title > span").text().trim();
        let jobEmployer = $(parentElem)
          .find(".cell-company > a > span")
          .text()
          .trim();
        let jobLocation = $(parentElem)
          .find(".cell-city > span > a > span")
          .children("span")
          .text()
          .trim();

        let jobUrl =
          baseURL +
          $(parentElem).find(".cell-info").children(".job-title").attr("href");
        jobUrl = encodeURI(jobUrl.trim());

        let jobDate = $(parentElem).find(".cell-date > span").text().trim();

        if (!jobUrl.endsWith("undefined")) {
          await axios(jobUrl)
            .then(async (response) => {
              const data = response.data;
              const $ = cheerio.load(data);
              jobDescription = $("#anunt-content").text().trim();
              jobImageURL = $(".companie-logo")
                .children("a")
                .children("img")
                .attr("src");
              if (typeof jobImageURL === "undefined")
                jobImageURL =
                  "https://cdn-icons-png.flaticon.com/512/2936/2936630.png";
            })
            .catch((error) => {
              console.error(error.message);
            });
        }

        if (typeof jobName !== "undefined")
          jobName = String(jobName).replace(regex, "");
        if (typeof jobEmployer !== "undefined")
          jobEmployer = String(jobEmployer).replace(regex, "");
        if (typeof jobLocation !== "undefined")
          jobLocation = String(jobLocation).replace(regex, "");
        if (typeof jobDate !== "undefined")
          jobDate = String(jobDate).replace(regex, "");
        if (typeof jobUrl !== "undefined")
          jobUrl = String(jobUrl).replace(regex, "");
        if (typeof jobDescription !== "undefined")
          jobDescription = String(jobDescription).replace(regex, "");
        if (typeof jobImageURL !== "undefined")
          jobImageURL = String(jobImageURL).replace(regex, "");

        const jobNumber = parentIndex * pageNumber;
        const job = {
          jobName: jobName,
          jobEmployer: jobEmployer,
          jobLocation: jobLocation,
          jobDate: jobDate,
          jobUrl: jobUrl,
          jobDescription: jobDescription,
          jobPageNumber: pageNumber,
          jobImageURL: jobImageURL,
        };

        if (
          job.jobName !== "" &&
          job.jobEmployer !== "" &&
          job.jobLocation !== "" &&
          job.jobDate !== "" &&
          job.jobUrl !== "" &&
          job.jobDescription !== "" &&
          job.jobImageURL !== ""
        ) {
          let jobInstance = new jobModel(job);
          jobInstance.save(function (err, job) {
            if (err) return console.error(err);
            // else if (job) console.log(`${job}`);
          });
        }
      });

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
