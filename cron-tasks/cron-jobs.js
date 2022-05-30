import cron from "node-cron";
import fs from "fs";
import * as path from "path";
import { exec } from "child_process";

import {
  EVERY_30_SECONDS,
  EVERY_MINUTE,
  EVERY_30_MINUTES,
  EVERY_HOUR,
} from "../cron-tasks/jobsScheduleConstants.js";

function getExtension(filename) {
  var ext = path.extname(filename || "").split(".");
  return ext[ext.length - 1];
}

const runTasks = () => {
  const relativeJobsDirPath = "/jobs";
  const __dirname = path.resolve();
  const directoryPath = path.join(__dirname, "jobs");

  // console.log(directoryPath);

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    files.forEach(function (fileName) {
      if (getExtension(fileName) === "js") {
        cron.schedule(EVERY_30_SECONDS, () => {
          const filePath = directoryPath + "/" + fileName;
          console.log(`[JOB RUN ON] {${filePath}}`);
          // console.log(`relativeDirPath : ${relativeJobsDirPath} directoryPath: ${directoryPath} fileName : ${fileName} filePath: ${filePath}`);
          exec(
            `node ${filePath}`,
            { maxBuffer: 1024 * 1024 },
            (err, stdout, stderr) => {
              if (err) {
                console.log(err);
                return;
              }
              // console.log(fileName);
              // console.log(`stdout: ${stdout}`);
              // console.log(`stderr: ${stderr}`);
            }
          );

          /*
          const scrapperProcess = process.spawn(filePath);

          scrapperProcess.stdout.on("data", function (data) {
            console.log("stdout: " + data);
          });
          scrapperProcess.stderr.on("data", function (data) {
            console.log("stderr: " + data);
          });
          scrapperProcess.on("close", function (code) {
            console.log("scrapperProcess exited with code " + code);
          });
          */
        });

        // console.log(file);
        // console.log(`it worked: [${fileName}]`);
      }
    });
  });
};

runTasks();
