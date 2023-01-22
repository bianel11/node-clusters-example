/**
 * A simple Node.js cluster example with Express 
 * Author: @bianel11
 */
import express from "express";
import cluster from "node:cluster";
import os from "node:os";

const cpuList = os.cpus();
const app = express();

if (cluster.isPrimary) {
  console.log("cpu count: " + cpuList.length);
  console.log(`Master ${process.pid} is running`);

  // generate workers
  cpuList.forEach((_) => {
    cluster.fork();
  });

  cluster.on("exit", () => {
    console.log(`Process: ${process.pid} dead 🔥🔥🔥`);
  });
} else {
  app.get("/", (req, res) => {
    res.send(`Hello World!`);
  });

  app.get("/kill", (req, res) => {
    res.send(`Kill ${process.pid} process`);
    process.exit();
  });

  app.listen(3000, () => {
    console.log(`Server running on port 3000 and process ${process.pid}`);
  });
}
