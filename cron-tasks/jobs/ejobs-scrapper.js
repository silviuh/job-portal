import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

const url = "https://www.ejobs.ro/locuri-de-munca";
const pageUrl = "pagina";
let theLastPage = false;

let firstPageData = "";
let firstPageHtml = "";

const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const pagesNumber = 100;
const delayBetweenPageRequests = 2_000;

async function scrapeData(pageCount) {
  let currentPageFullUrl = "";
  if (pageCount < 2) {
    currentPageFullUrl = url;
  } else {
    currentPageFullUrl = url + "/" + pageUrl + pageCount;
  }

  await axios(currentPageFullUrl)
    .then(async (response) => {
      const data = response.data;
      const $ = cheerio.load(data);
      const listItems = $(".JobList__List li");
      const baseURL = "https://www.ejobs.ro";
      const nextButtonElement = $().find("JLPButton--Next");
      const jobs = [];
      $.prototype.exists = function (selector) {
        return this.find(selector).length > 0;
      };

      if (nextButtonElement.exists()) {
        console.log("intra aici");
        theLastPage = true;
        return;
      }

      listItems
        .each(async (idx, el) => {
          const jobName = $(el)
            .find(".JCContentMiddle__Title > a > span")
            .text()
            .trim();
          const jobEmployer = $(el)
            .find(".JCContentMiddle__Info--Darker > a")
            .text()
            .trim();
          const jobLocation = $(el)
            .find(".JCContentMiddle")
            .children("span")
            .text()
            .trim();
          const jobUrl =
            baseURL +
            $(el).find(".JCContentMiddle__Title > a").attr("href").trim();
          const jobDate = $(el).find(".JCContentTop__Date").text().trim();
          let jobDescription = "";

          await axios(jobUrl)
            .then(async (response) => {
              const data = response.data;
              const $ = cheerio.load(data);
              const descriptionTitle = $(".JMDContent__Title");
              jobDescription = "\r\n" + descriptionTitle.next().text() + "/n";
            })
            .catch((error) => {
              console.error(error.message);
            });

          const job = {
            jobName: jobName,
            jobEmployer: jobEmployer, // numele angajatorului am nev de el, as avea nev de el aici, dar tre sa fac un request in plus
            jobLocation: jobLocation,
            jobDate: jobDate,
            jobUrl: jobUrl,
            jobDescription: jobDescription,
            jobPageNumber: pageCount,
          };

          jobs.push(job);

          await jobModel
            .insertOne(job)
            .then((doc) => {
              console.log(doc);
            })
            .catch((err) => {
              console.log(err);
            });

          fs.appendFile(
            "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/cron-tasks/jobs/ejobs-jobs-listed.json",
            JSON.stringify(jobs, null, 2),
            (err) => {
              if (err) {
                // console.error(err.message);
                return;
              }
            }
          );
        })
        .catch((error) => {
          console.error(error.message);
        });

      console.log("GETS HERE");

      // fs.appendFile(
      //   "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/cron-tasks/jobs/ejobs-jobs-listed.json",
      //   JSON.stringify(jobs, null, 2),
      //   (err) => {
      //     if (err) {
      //       console.error(err.message);
      //     }
      //   }
      // );

      // await jobModel
      //   .insertMany(jobs)
      //   .then((doc) => {
      //     console.log(doc);
      //   })
      //   .catch((err) => {
      //     console.log(err);
      //   });

      return jobs;
    })
    .catch((error) => {
      console.log("GETS HERE 2");
      console.error(error.message);
    });
}

const connectToMongoDBandScrape = async () => {
  await db()
    .then(async (mongoose) => {
      try {
        console.log("Connected tÏo mongodb!");
        for (let i = 0; i < pagesNumber; i++ && theLastPage == false) {
          await scrapeData(i).catch((error) => {
            console.error(error.message);
          });
          await delay(delayBetweenPageRequests);
        }
      } finally {
        console.log("Connection closed");
        mongoose.connection.close();
      }
    })
    .catch((error) => {
      console.error(error.message);
    });
};

connectToMongoDBandScrape();
