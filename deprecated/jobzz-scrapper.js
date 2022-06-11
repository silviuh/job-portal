const PORT = 5000;
const axios = require("axios");
const cheerio = require("cheerio");
const express = require("express");
const app = express();
const { next } = require("cheerio/lib/api/traversing");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const fs = require("fs");
const { response } = require("express");

const searchUrl = "https://jobzz.ro/locuri-de-munca-in-romania";
const prefix = ".html";
let theLastPage = false;

async function scrapeData() {
  const url = searchUrl + prefix;

  await axios(url).then((response) => {
    const html_data = response.data;
    const $ = cheerio.load(html_data);
    const selectedElem = $(".last_page").text().trim();
    const numberOfElements = parseInt(selectedElem);

    for (let i = 1; i < numberOfElements; i++) {
      scrapePage(i);
    }
  });
}

async function scrapePage(pageNumber) {
  let url = "";
  const jobs = [];

  if (pageNumber !== 1) url = searchUrl + "_" + pageNumber + prefix;
  else url = searchUrl + prefix;

  await axios(url)
    .then((response) => {
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

        const job = JSON.stringify({
          jobName: jobName,
          jobDescription: jobDescription,
          // jobEmployer: jobEmployer, // numele angajatorului am nev de el, as avea nev de el aici, dar tre sa fac un request in plus
          jobLocation: jobLocation,
          jobDate: jobDate,
          jobUrl: jobUrl,
        });

        const jobNumber = parentIndex * pageNumber;
        jobs.push(job);
        console.log(`[${jobNumber}]:  ${job}`);
      });

      // console.log(jobs);
      fs.appendFile(
        "jobzz-jobs-listed.json",
        JSON.stringify(jobs, null, 2),
        (err) => {
          if (err) {
            console.error(err);
            return;
          }
          console.log("Successfully written data to file");
        }
      );

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

scrapeData();
