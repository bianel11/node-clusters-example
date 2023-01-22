/**
 * A simple Node.js cluster example whith sharp image processing
 * Author: @bianel11
 */
import os from "os";
import sharp from "sharp";
import cluster from "node:cluster";

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
}

//function to generate random color whith alpha
function generateRandomColor() {
  let r = Math.floor(Math.random() * 255);
  let g = Math.floor(Math.random() * 255);
  let b = Math.floor(Math.random() * 255);
  let alpha = Math.random();
  return { r, g, b, alpha };
}

function workerCode() {
  sharp({
    create: {
      width: 16000,
      height: 16000,
      channels: 4,
      background: generateRandomColor(),
    },
  })
    .png()
    .toFile(`images/output-${process.pid}.webp`, (err, info) => {
      if (err) {
        console.log(err);
      }
      process.send({
        msg: `Worker ${process.pid} finished ${JSON.stringify(info)}`,
      });
    });
}
