const puppeteer = require("puppeteer");
let bookingUrl = "https://www.booking.com/searchresults.en-gb.html?label=gen173nr-1FCAEoggI46AdIM1gEaMABiAEBmAEJuAEHyAEM2AEB6AEB-AELiAIBqAIDuALb6bmTBsACAdICJGY5OGEwY2U1LTU3MTctNGY5OS1hMGY5LTM3OTUyZjk5YTNlOdgCBuACAQ&sid=c8d0358622b7284081d5871b3b60b3e3&sb=1&sb_lp=1&src=index&src_elem=sb&error_url=https%3A%2F%2Fwww.booking.com%2Findex.en-gb.html%3Flabel%3Dgen173nr-1FCAEoggI46AdIM1gEaMABiAEBmAEJuAEHyAEM2AEB6AEB-AELiAIBqAIDuALb6bmTBsACAdICJGY5OGEwY2U1LTU3MTctNGY5OS1hMGY5LTM3OTUyZjk5YTNlOdgCBuACAQ%26sid%3Dc8d0358622b7284081d5871b3b60b3e3%26sb_price_type%3Dtotal%26%26&ss=Singapore%2C+Singapore&is_ski_area=&checkin_year=2022&checkin_month=5&checkin_monthday=22&checkout_year=2022&checkout_month=5&checkout_monthday=27&group_adults=2&group_children=0&no_rooms=1&b_h4u_keep_filters=&from_sf=1&ss_raw=singapore&ac_position=0&ac_langcode=en&ac_click_type=b&dest_id=-73635&dest_type=city&iata=SIN&place_id_lat=1.29045&place_id_lon=103.85204&search_pageview_id=e26e53ae4ce30295&search_selected=true&search_pageview_id=e26e53ae4ce30295&ac_suggestion_list_length=5&ac_suggestion_theme_list_length=0";
(async () => {
  const browser = await puppeteer.launch({ headless: true });
  const page = await browser.newPage();
  await page.setViewport({ width: 1920, height: 926 });
  await page.goto(bookingUrl);
  // get hotel details
  let hotelData = await page.evaluate(() => {
    let hotels = [];
    // get the hotel elements
    let hotelsElms = document.querySelectorAll(
      "div.sr_property_block[data-hotelid]"
    );
    // get the hotel data
    hotelsElms.forEach((hotelelement) => {
      let hotelJson = {};
      try {
        hotelJson.name = hotelelement.querySelector(
          "span.sr-hotel__name"
        ).innerText;
        hotelJson.reviews = hotelelement.querySelector(
          "span.review-score-widget__subtext"
        ).innerText;
        hotelJson.rating = hotelelement.querySelector(
          "span.review-score-badge"
        ).innerText;
        if (hotelelement.querySelector("strong.price")) {
          hotelJson.price =
            hotelelement.querySelector("strong.price").innerText;
        }
      } catch (exception) {}
      hotels.push(hotelJson);
    });
    return hotels;
  });
  console.dir(hotelData);
})();
