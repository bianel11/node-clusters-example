import cluster from "node:cluster";
import os from "node:os";

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

//function that generate 15 random numbers
function generateRandomNumbers() {
  let arr = [];
  for (let i = 0; i < 15; i++) {
    arr.push(Math.floor(Math.random() * 100));
  }
  return arr;
}

async function primaryCode() {
  const cpuList = os.cpus();
  const workers = await Promise.all(
    [...Array(cpuList.length).keys()].map((i) => spawnWorker(i))
  );

  let arr = generateRandomNumbers();
  console.log({ arrLength: arr.length, workersLength: workers.length });

  let chunk = Math.ceil(arr.length / workers.length);
  console.log({ chunk, arr });
  // let workers = [];

  // for (let i = 0; i < numCPUs; i++) {
  //   workers.forEach((worker) => worker.send(`Message #${i}`));
  // }
  let result = [];
  workers.forEach((work, i) => {
    let start = i * chunk;
    let end = start + chunk;
    work.send({ message: { start, end, arr } });
    // let worker = cluster.fork();
    // worker.send({ message: "Hello from master" });

    work.on("message", ({ msg }) => {
      if (msg) {
        console.log(msg);
        result = [...result, ...msg];
        // console.log({ result });
      }
    });
    // workers.push(worker);
  });
   //Ordenar el resultado final
   setTimeout(() => {
    // console.log(result)
    console.log({result});
    console.log(
      "Final array:"
      //   result.sort((a, b) => a - b)
    );
  }, 2000);
  // workers.forEach((work) => {
  //   work.send("Hola mundo");
  // });
}

function workerCode() {
  process.on("message", ({ message }) => {
    if (message) {
      const { start, end, arr } = message;
      let subArr = arr.slice(start, end);

      //Aplicar el algoritmo de ordenamiento de burbuja
      for (let i = 0; i < subArr.length; i++) {
        for (let j = 0; j < subArr.length - i - 1; j++) {
          if (subArr[j] > subArr[j + 1]) {
            let temp = subArr[j];
            subArr[j] = subArr[j + 1];
            subArr[j + 1] = temp;
          }
        }
      }
      process.send({ msg: subArr });
    }
    // console.log(`Received message from master: ${JSON.stringify(message)}`);
  });
  // process.send({ msg: "Hola desde worker" });
}
