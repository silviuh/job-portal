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
const delay = ms => new Promise(resolve => setTimeout(resolve, ms))

async function scrapeData() {
  const url = searchUrl + prefix;

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    const selectedElem = $(".last_page").text().trim();
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
      await delay(1000);
      await scrapePage(i);
      console.log("Scrapping...");
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";
  const jobs = [];

  if (pageNumber !== 1) url = searchUrl + "_" + pageNumber + prefix;
  else url = searchUrl + prefix;

  await axios(url)
    .then(async (response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      const selectedElem = $("#list_cart_holder").find("a");

      // console.log(selectedElem.text());
      $(selectedElem).each((parentIndex, parentElem) => {
        const jobName = $(parentElem).find(".title").text().trim();
        /*
        const jobEmployer = $(parentElem)
          .find(".cell-company > a > span")
          .text()
          .trim();
        */
        const jobLocation = $(parentElem)
          .find(".location_area")
          .children(".location")
          .text()
          .trim();

        const jobDescription = $(parentElem)
          .find(".info_details")
          .text()
          .trim();

        let jobUrl = "";
        if ($(parentElem).attr("href") !== undefined)
          jobUrl = $(parentElem).attr("href").trim();

        const jobDate = $(parentElem)
          .find(".location_area")
          .children(".date")
          .text()
          .trim();

        //JSON.stringify({
        const job = {
          jobName: jobName,
          jobEmployer: "", // numele angajatorului am nev de el, as avea nev de el aici, dar tre sa fac un request in plus
          jobLocation: jobLocation,
          jobDate: jobDate,
          jobUrl: jobUrl,
          jobDescription: jobDescription,
          jobPageNumber: pageNumber,
        };

        const jobNumber = parentIndex * pageNumber;
        jobs.push(job);
        // console.log(`[${jobNumber}]:  ${job}`);
      });

      // console.log(jobs);
      // fs.appendFile(
      //   "/Users/silviuh1/workspace/dev/facultate/licenta/training/cron-tasks/jobs/jobzz-jobs-listed.json",
      //   JSON.stringify(jobs, null, 2),
      //   (err) => {
      //     if (err) {
      //       console.error(err);
      //       return;
      //     }
      //      console.log("Successfully written data to file");
      //   }
      // );

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

/*
  app.get("/api/jobs", async (req, res) => {
    try {
      const crypto = await scrapeData();
      return res.status(200).json({
        result: crypto,
      });
    } catch (err) {
      return res.status(500).json({
        err: err.toString(),
      });
    }
  });
  
  app.listen(PORT, () =>
    console.log(`The server is active and running on port ${PORT}`)
  );
*/

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
