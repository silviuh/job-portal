// const axios = require("axios");
// const cheerio = require("cheerio");
// const fs = require("fs");

import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

// URL of the page we want to scrape
const url = "https://www.ejobs.ro/locuri-de-munca";
const pageUrl = "pagina";
let theLastPage = false;

let firstPageData = "";
let firstPageHtml = "";

/*
async function scrapeFirstPageData() {
  firstPageData = await axios.get(url);
  firstPageHtml = cheerio.load(firstPageData);
  console.log(firstPageHtml.html());
}
*/

async function scrapeData(pageCount) {
  let currentPageFullUrl = "";
  if (pageCount < 2) {
    currentPageFullUrl = url;
  } else {
    currentPageFullUrl = url + "/" + pageUrl + pageCount;
  }

  // console.log(currentPageFullUrl);

  await axios(currentPageFullUrl)
    .then(async (response) => {
      const data = response.data;
      const $ = cheerio.load(data);
      const listItems = $(".JobList__List li");
      const baseURL = "https://www.ejobs.ro";
      const nextButtonElement = $().find("JLPButton--Next"); // this has a href with the url
      const jobs = [];
      $.prototype.exists = function (selector) {
        return this.find(selector).length > 0;
      };

      /*
      const firstPageUrl = url;
      let nextPage Url2 = '';
      const nextPageAnchorElement = $(".JobListPaginator").children("a");

      const nextPageUrl = baseURL + nextPageAnchorElement.attr("href").trim();
      nextPageUrl2 = baseURL + nextButtonElement.attr("href").trim()

      console.log(nextPageAnchorElement.children());
      console.log(firstPageUrl);
      console.log(nextPageUrl);

      console.log(firstPageHtml.html());
      console.log($().html());
      */

      // console.log("[nexbutton: " + nextButtonElement.attr("href"));

      // if (nextButtonElement.attr("href") === "undefined") {
      if (nextButtonElement.exists()) {
        // ultima pagina nu mai are butonul de pagina urmatoare
        console.log("intra aici");
        theLastPage = true;
        return;
      }

      listItems.each((idx, el) => {
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
        // const jobDescription = $(el).find(".JCContentMiddle__Info--Darker > a")[0].text() // TODO
        const jobDate = $(el).find(".JCContentTop__Date").text().trim();

        const job = {
          jobName: jobName,
          jobEmployer: "", // numele angajatorului am nev de el, as avea nev de el aici, dar tre sa fac un request in plus
          jobLocation: jobLocation,
          jobDate: jobDate,
          jobUrl: jobUrl,
          jobDescription: "",
          jobPageNumber: pageCount,
        };
        jobs.push(job);

        // fs.appendFile(
        //   "/Users/silviuh1/workspace/dev/facultate/licenta/training/cron-tasks/jobs/ejobs-jobs-listed.json",
        //   JSON.stringify(jobs, null, 2),
        //   (err) => {
        //     if (err) {
        //       console.error(err);
        //       return;
        //     }
        //     // console.log("Successfully written data to file");
        //   }
        // );
      });

      await jobModel
        .insertMany(jobs)
        .then((doc) => {
          // console.log(doc);
        })
        .catch((err) => {
          console.log(err);
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
      for (let i = 0; i < 15; i++ && theLastPage == false) await scrapeData(i);
    } finally {
      console.log("Connection closed");
      mongoose.connection.close();
    }
  });
};

connectToMongoDBandScrape();
