import os from "os";
import cluster from "cluster";
import animals from "./animals.js";

if (cluster.isPrimary) {
  primaryCode();
} else {
  workerCode();
}

function spawnWorker(i) {
  return new Promise((resolve) => {
    const worker = cluster.fork({ id: i });
    worker.on("message", (text) => {
      resolve(worker);
    });
  });
}

async function primaryCode() {
  const cpuList = os.cpus();
  const workers = await Promise.all(
    [...Array(cpuList.length).keys()].map((i) => spawnWorker(i))
  );
  workers.forEach((work) => {
    work.on("message", ({ msg }) => {
      if (msg) {
        console.log(msg);
      }
    });
  });

  let chunk = Math.ceil(animals.length / workers.length);
  console.log(chunk);
  workers.forEach((work, i) => {
    // send the chunk to the worker

    let start = i * chunk;
    let end = start + chunk;

    work.send({ message: { start, end, arr: animals } });
  });
}

function workerCode() {
  process.on("message", ({ message }) => {
    let { start, end, arr } = message;
    let result = arr.slice(start, end);
    process.send({ msg: result });
  });
}
