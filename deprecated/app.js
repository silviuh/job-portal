const axios = require("axios");
const cheerio = require("cheerio");
const { next } = require("cheerio/lib/api/traversing");
const { SSL_OP_SSLEAY_080_CLIENT_DH_BUG } = require("constants");
const fs = require("fs");

// URL of the page we want to scrape
const url = "https://www.hipo.ro/locuri-de-munca/cautajob";
const pageUrl = "pagina";
let theLastPage = false;

let firstPageData = "";
let firstPageHtml = "";

async function scrapeFirstPageData() {
  firstPageData = await axios.get(url);
  firstPageHtml = cheerio.load(firstPageData);
  console.log(firstPageHtml.html());
}

async function scrapeData(pageCount) {
  try {
    const { data } = await axios.get(url + "/" + pageUrl + pageCount);
    const $ = cheerio.load(data); // curentPage

    // let nextPageUrl2 = '';
    const baseURL = "https://www.ejobs.ro";
    const firstPageUrl = url;
    const listItems = $(".JobList__List li");
    const nextPageAnchorElement = $(".JobListPaginator").children("a");
    const nextButtonElement = $().find("JLPButton--Next"); // this has a href with the url

    const nextPageUrl =
      baseURL + nextPageAnchorElement.attr("href").trim();
    // nextPageUrl2 = baseURL + nextButtonElement.attr("href").trim()
    const jobs = [];
  
    // console.log(nextPageAnchorElement.children());
    // console.log(firstPageUrl);
    // console.log(nextPageUrl);

    // console.log(firstPageHtml.html());
    // console.log($().html());

    if(typeof nextButtonElement !== "undefined") { // ultima pagina nu mai are butonul de pagina urmatoare
      console.log("intra aici");
      theLastPage = true;
      console.log(theLastPage);
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
        baseURL + $(el).find(".JCContentMiddle__Title > a").attr("href").trim();
      // const jobDescription = $(el).find(".JCContentMiddle__Info--Darker > a")[0].text() // TODO
      const jobDate = $(el).find(".JCContentTop__Date").text().trim();

      const job = JSON.stringify({
        jobName: jobName,
        jobEmployer: jobEmployer,
        jobLocation: jobLocation,
        jobDate: jobDate,
        jobUrl: jobUrl,
      });

      jobs.push(job);

      fs.appendFile("mama.json", JSON.stringify(jobs, null, 2), (err) => {
        if (err) {
          console.error(err);
          return;
        }
        console.log("Successfully written data to file");
      });
    });
  } catch (err) {
    console.error(err);
  }
}

// scrapeFirstPageData();
for (i = 0; i < 10; i++ && theLastPage == false) scrapeData(i);
