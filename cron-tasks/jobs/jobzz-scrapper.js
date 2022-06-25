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

async function scrapeData() {
  const url = searchUrl + prefix;

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    const selectedElem = $(".last_page").text().trim();
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
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
        const jobImageURL = $(parentElem).find(".overflow_image").children("img").attr("src");
        console.log(jobImageURL);

        if (typeof jobImageURL === 'undefined')
          jobImageURL = "https://cdn-icons-png.flaticon.com/512/2936/2936630.png";


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

        const job = {
          jobName: jobName,
          jobEmployer: jobEmployer,
          jobLocation: jobLocation,
          jobDate: jobDate,
          jobUrl: jobUrl,
          jobDescription: jobDescription,
          jobPageNumber: pageNumber,
          jobImageURL: jobImageURL
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
