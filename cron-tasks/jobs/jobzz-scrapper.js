// const axios = require("axios");
// const cheerio = require("cheerio");
// const fs = require("fs");
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

const searchUrl = "https://jobzz.ro/locuri-de-munca-in-romania";
const prefix = ".html";
let theLastPage = false;
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const replaceExpr = '"';
const regex = new RegExp(replaceExpr, "g");

async function scrapeData() {
  const url = searchUrl + prefix;

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    const selectedElem = $(".last_page").text().trim();
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
      await delay(5_000);
      await scrapePage(i);
      console.log(`Scrapping...[${i}]`);
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";
  let jobs = [];

  if (pageNumber !== 1) url = searchUrl + "_" + pageNumber + prefix;
  else url = searchUrl + prefix;

  await axios(url)
    .then(async (response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      const selectedElem = $("#list_cart_holder").find("a");

      $(selectedElem).each(async (parentIndex, parentElem) => {
        let jobEmployer = "";
        let jobImageURL = $(parentElem)
          .find(".overflow_image")
          .children("img")
          .attr("src");

        if (typeof jobImageURL === "undefined")
          jobImageURL =
            "https://cdn-icons-png.flaticon.com/512/2936/2936630.png";

        let jobName = $(parentElem).find(".title").text().trim();
        let jobLocation = $(parentElem)
          .find(".location_area")
          .children(".location")
          .text()
          .trim();

        let jobDescription = $(parentElem).find(".info_details").text().trim();

        let jobUrl = "";
        if ($(parentElem).attr("href") !== undefined)
          jobUrl = $(parentElem).attr("href");

        let jobDate = $(parentElem)
          .find(".location_area")
          .children(".date")
          .text()
          .trim();

        await axios(jobUrl)
          .then(async (response) => {
            const data = response.data;
            const $ = cheerio.load(data);
            jobDescription = $("#description").children("#paragraph").text();
            jobEmployer = $(".account_right").children("h2").text();
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

        const jobNumber = parentIndex * pageNumber;
        jobs.push(job);
        let jobInstance = new jobModel(job);

        jobInstance.save(function (err, job) {
          if (err) return console.error(err);
        });
      });

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
      console.error(error.message);
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
