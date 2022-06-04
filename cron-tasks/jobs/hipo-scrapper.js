// const axios = require("axios");
// const cheerio = require("cheerio");
// const express = require("express");
// const fs = require("fs");
import axios from "axios";
import cheerio from "cheerio";
import fs from "fs";
import db from "../../mongoDB/database.js";
import mongoose from "mongoose";
import jobModel from "../../mongoDB/schemas/job-schema.js";

// const url = "https://www.ejobs.ro/locuri-de-munca";
const pageUrl = "pagina";
let theLastPage = false;

async function scrapeData() {
  const url = "https://www.hipo.ro/locuri-de-munca/cautajob";

  await axios(url).then(async (response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    let selectedElem = $(".page-last").attr("href").trim();
    selectedElem = selectedElem.substring(selectedElem.lastIndexOf("/") + 1);
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
      await scrapePage(i);
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";

  if (pageNumber !== 1)
    url = "https://www.hipo.ro/locuri-de-munca/cautajob" + "/" + pageNumber;
  else url = "https://www.hipo.ro/locuri-de-munca/cautajob";

  const jobs = [];

  //tbl-hipo tbl-results
  await axios(url)
    .then(async (response) => {
      const html_data = response.data;
      const $ = cheerio.load(html_data);
      const baseURL = "https://www.hipo.ro/";
      const selectedElem = $(".tbl-hipo").find("tbody > tr");

      // console.log(selectedElem.text());
      $(selectedElem).each((parentIndex, parentElem) => {
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

        jobUrl = jobUrl.trim();
        // const jobDescription = $(el).fcleind(".JCContentMiddle__Info--Darker > a")[0].text() // TODO
        const jobDate = $(parentElem).find(".cell-date > span").text().trim();

        if (
          !jobUrl.includes("undefined") &&
          jobLocation != "" &&
          jobName != "" &&
          jobEmployer != "" &&
          jobDate != "" &&
          jobUrl != ""
        ) {
          const job = {
            jobName: jobName,
            jobEmployer: jobEmployer, // numele angajatorului am nev de el, as avea nev de el aici, dar tre sa fac un request in plus
            jobLocation: jobLocation,
            jobDate: jobDate,
            jobUrl: jobUrl,
            jobDescription: "",
            jobPageNumber: pageNumber,
          };

          const jobNumber = parentIndex * pageNumber;
          // console.log(`${jobNumber} ${job}`);
          jobs.push(job);
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
