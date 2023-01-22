import cluster from "node:cluster";
import os from "node:os";
const cpuList = os.cpus();
import http from 'http'
// var http = require('http');
if (cluster.isPrimary) {
    // Fork workers.
    for (var i = 0; i < 2; i++) {
     let worker = cluster.fork();
  
      worker.on('message', function(msg) {
        // we only want to intercept messages that have a chat property
        if (msg.chat) {
          console.log('Worker to master: ', msg.chat);
          worker.send({ chat: 'Ok worker, Master got the message! Over and out!' });
        }
      });
  
    }
  } else {
    process.on('message', function(msg) {
      // we only want to intercept messages that have a chat property
      if (msg.chat) {
        console.log('Master to worker: ', msg.chat);
      }
    });
    // Worker processes have a http server.
    http.Server(function(req, res) {
      res.writeHead(200);
      res.end("hello world\n");
      // Send message to master process
      process.send({ chat: 'Hey master, I got a new request!' });
    }).listen(8000);
  }
  

if (cluster.isPrimary) {
  console.log(`Master ${process.pid} is running`);
  let arr = [5, 2, 9, 1, 5, 6];
  let chunk = Math.ceil(arr.length / cpuList);
  // Divide el array entre los workers
  for (let i = 0; i < cpuList; i++) {
    let start = i * chunk;
    let end = start + chunk;
    let worker = cluster.fork();
    console.log("mandnado", { start, end, arr })
    worker.send({ start, end, arr });
  }

  //Recolecta el resultado de los workers
  let result = [];
  cluster.on("message", (worker, message) => {
    console.log(`Worker ${worker.process.pid} responde ${JSON.stringify(message)}`);
    result = result.concat(message);
  });

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });

  //Ordenar el resultado final
  setTimeout(() => {
    // console.log(result)
    console.log(
      "Final array:"
      //   result.sort((a, b) => a - b)
    );
  }, 5000);
} else if(cluster.isWorker){
    console.log(cluster.eventNames())
    cluster.on('message', (msg) => {
        console.log(msg)
        cluster.send('holaaa');
      });

} else {

    console.log('sa')
  process.on("message", function (message) {
    console.log(`Worker ${process.pid} started ${message}`);
    let arr = message.arr;
    let start = message.start;
    let end = message.end;
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
    // console.log(subArr)
    process.send(subArr);
  });
}
