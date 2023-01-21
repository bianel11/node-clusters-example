import express from "express";
import cluster from "node:cluster";
import os from "node:os";

const cpuList = os.cpus();
const app = express();

if (cluster.isPrimary) {
  console.log("cpu count: " + cpuList.length);
  console.log(`Master ${process.pid} is running`);

  // generar los subprocesos
  cpuList.forEach((_) => {
    cluster.fork();
  });

  cluster.on("exit", () => {
    console.log(`Proceso: ${process.pid} terminado 🔥🔥🔥`);
  });
} else {
  app.get("/", (req, res) => {
    res.send(`Hello World!`);
  });

  app.get("/kill", (req, res) => {
    res.send(`Matando proceso ${process.pid}`);
    process.exit();
  });

  app.listen(3000, () => {
    console.log(`Server running on port 3000 and process ${process.pid}`);
  });
}
