const delay = (ms) => new Promise((resolve) => setTimeout(resolve, ms));

for (let i = 0; i < 100; i++) {
  await delay(3000);
  console.log("ceva" + "/n");
}
