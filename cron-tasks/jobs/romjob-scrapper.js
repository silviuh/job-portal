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

        const jobName = $(parentElem)
          .find(".listing-data")
          .first()
          .find("h3")
          .text()
          .trim();

        const jobLocation = $(parentElem)
          .find(".listing-data")
          .find(".article-location")
          .text()
          .trim();

        const jobUrl = $(parentElem)
          .find(".listing-data")
          .find(".large-8.medium-7.columns")
          .children("h3")
          .children("a")
          .attr("href");

        const jobDate = $(parentElem)
          .find(".listing-data")
          .find(".article-date")
          .text();

        if (jobUrl !== undefined) {
          await axios(jobUrl)
            .then(async (response) => {
              const data = response.data;
              const $ = cheerio.load(data);
              jobEmployer = $(".userdata")
                .children("h3")
                .children("a")
                .text()
                .trim();
              jobDescription = $(".article-detail")
                .children("p")
                .children("span")
                .text().trim();
            })
            .catch((error) => {
              console.error(error.message);
            });

          const job = {
            jobName: jobName,
            jobEmployer: jobEmployer,
            jobLocation: jobLocation,
            jobDate: jobDate,
            jobUrl: jobUrl,
            jobDescription: jobDescription,
            jobPageNumber: pageNumber,
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
