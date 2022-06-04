import cron from "node-cron";
import fs from "fs";
import * as path from "path";
import { exec } from "child_process";

import {
  EVERY_30_SECONDS,
  EVERY_MINUTE,
  EVERY_30_MINUTES,
  EVERY_HOUR,
  EVERY_12_HOUR,
  EVERY_DAY,
} from "../cron-tasks/jobsScheduleConstants.js";

function getExtension(filename) {
  var ext = path.extname(filename || "").split(".");
  return ext[ext.length - 1];
}

export default () => {
  const relativeJobsDirPath = "/cron-tasks/jobs";
  let __dirname = path.resolve(path.dirname(""));
  __dirname = __dirname.substring(0, __dirname.lastIndexOf("/"));
  const directoryPath = path.join(__dirname, relativeJobsDirPath);
  //const directoryPath = "/Users/silviuh1/workspace/dev/facultate/licenta/job-portal/cron-tasks/jobs";

  fs.readdir(directoryPath, function (err, files) {
    if (err) {
      return console.log("Unable to scan directory: " + err);
    }

    files.forEach(function (fileName) {
      if (getExtension(fileName) === "js") {
        cron.schedule(EVERY_30_SECONDS, () => {
          const filePath = directoryPath + "/" + fileName;
          console.log(`[JOB RUN ON] {${filePath}}`);

          exec(
            `node ${filePath}`,
            { maxBuffer: 1024 * 1024 },
            (err, stdout, stderr) => {
              if (err) {
                console.log(err);
                return;
              }

              console.log(`stdout: ${stdout}`);
              console.log(`stderr: ${stderr}`);
            }
          );
        });

        // console.log(file);
        // console.log(`it worked: [${fileName}]`);
      }
    });
  });
};

// runTasks();
