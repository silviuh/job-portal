// const axios = require("axios");
// const cheerio = require("cheerio");
// const fs = require("fs");
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";
import { html } from "cheerio/lib/static.js";

const searchUrl = "https://www.romjob.ro/anunturi/locuri-de-munca/";
const prefix = "?" + "pag=";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const replaceExpr = '"';
const regex = new RegExp(replaceExpr, "g");

async function scrapeData() {
  await axios(searchUrl).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    const selectedElem = $(".pagination.radius")
      .children()
      .last()
      .prev()
      .text();
    const numberOfElements = parseInt(selectedElem);

    // for (let i = 1; i <= numberOfElements; i++) {
    for (let i = 1; i <= numberOfElements; i++) {
      await scrapePage(i);
      console.log(`Scrapping...[${i}]`);
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";
  let jobs = [];

  if (pageNumber !== 1) url = searchUrl + prefix + pageNumber;
  else url = searchUrl;

  //   console.log(`URL: [${url}]`);

  await axios(url)
    .then(async (response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      const selectedElem = $(".listing.radius").find("li");

      $(selectedElem).each(async (parentIndex, parentElem) => {
        let jobEmployer = "";
        let jobDescription = "";
        let jobImageURL = "";

        let jobName = $(parentElem)
          .find(".listing-data")
          .first()
          .find("h3")
          .text()
          .trim();

        let jobLocation = $(parentElem)
          .find(".listing-data")
          .find(".article-location")
          .text()
          .trim();

        let jobUrl = $(parentElem)
          .find(".listing-data")
          .find(".large-8.medium-7.columns")
          .children("h3")
          .children("a")
          .attr("href");

        let jobDate = $(parentElem)
          .find(".listing-data")
          .find(".article-date")
          .text();

        if (jobUrl !== undefined) {
          await axios(jobUrl)
            .then(async (response) => {
              const data = response.data;
              const $ = cheerio.load(data);
              jobImageURL = $(".imgZone").find("img").attr("src");
              if (typeof jobImageURL === "undefined")
                jobImageURL =
                  "https://cdn-icons-png.flaticon.com/512/2936/2936630.png";

              jobEmployer = $(".userdata")
                .children("h3")
                .children("a")
                .text()
                .trim();
              jobDescription = $(".article-detail")
                .children("p")
                .children("span")
                .text()
                .trim();
            })
            .catch((error) => {
              console.error(error.message);
            });

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

          let jobInstance = new jobModel(job);
          jobInstance.save(function (err, job) {
            if (err) return console.error(err);
          });
        }
      });

      return jobs;
    })
    .catch((error) => {
      console.error(error).message;
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
