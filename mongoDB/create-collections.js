try {
  const connection = db.getSiblingDB("job_platform");
  connection.createCollection("Companies");
  connection.createCollection("Jobs");
} catch (error) {
  print(error);
}
