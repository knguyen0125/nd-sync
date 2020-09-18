const express = require("express");
const { start, stop } = require("./sync");
const app = express();

app.get("/", (_, res) => {
  res.send("healthy");
});

const server = app.listen("8080", () => {
  console.log("Starting the server... Listening on port 8080");
  start();
});

process.on("SIGINT", (code) => {
  console.log("Stopping the server...");
  stop();
  server.close();
  process.exit(code);
});
