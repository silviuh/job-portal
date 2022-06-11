const server = "127.0.0.1:27017";
const database =  "job_platform";

export default {
  server: server,
  database: database,
  mongoURI: `mongodb://${server}/${database}`,
  secretOrKey: "secret",
};
