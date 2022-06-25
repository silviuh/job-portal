// const axios = require("axios");
// const cheerio = require("cheerio");
// const fs = require("fs");
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

const searchUrl = "https://www.linkedin.com/jobs/search/?location=romania";
const prefix = "&start=";
const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));
const replaceExpr = '"';
const regex = new RegExp(replaceExpr, "g");

async function scrapeData() {
  const url = searchUrl + prefix;

  await axios(searchUrl).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    // jobs-search-results__list list-style-none pt lista
    // class="artdeco-pagination__pages artdeco-pagination__pages--number"

    const paginationList = $(".artdeco-pagination__pages");
    const jobsList = $(".jobs-search-results__list");
    const header = $(".jobs-search-results-list__title-heading--pre-orchestra");

    console.log(header.html());
    // console.log(paginationList);

    $(jobsList).each((index, el) => {
      console.log("gets here");
      console.log(el);
    });

    // console.log(html_data);
    // const selectedElem = $('[aria-label="paginare"]').children('.pv5.artdeco-pagination.ember-view"');
    // const selectedElem = $(
    //   ".artdeco-pagination__pages.artdeco-pagination__pages--number"
    // ).children().last().children("button").children("span").html();
    //   ".artdeco-pagination__pages.artdeco-pagination__pages--number"
    // )
    //   .last()
    //   .children("button")
    //   .children("span").text();
    //   .find(".artdeco-pagination__pages.artdeco-pagination__pages--number")
    //   .children()
    //   .last()
    //   .text();
    // const numberOfElements = parseInt(selectedElem);

    // console.log(selectedElem);

    // for (let i = 1; i < numberOfElements; i++) {
    //   await scrapePage(i);
    //   console.log(`Scrapping...[${i}]`);
    // }
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
        const jobName = $(parentElem).find(".title").text().trim();
        const jobLocation = $(parentElem)
          .find(".location_area")
          .children(".location")
          .text()
          .trim();

        let jobDescription = $(parentElem).find(".info_details").text().trim();

        let jobUrl = "";
        if ($(parentElem).attr("href") !== undefined)
          jobUrl = $(parentElem).attr("href");

        const jobDate = $(parentElem)
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
