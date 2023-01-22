import express from "express";
import cluster from "node:cluster";
import os from "node:os";
import fileUpload from "express-fileupload";
import sharp from "sharp";

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
  const app = express();
  const cpuList = os.cpus();

  //   const storage = multer.memoryStorage();
  //   const upload = multer({ storage: storage });

  const workers = await Promise.all(
    [...Array(cpuList.length).keys()].map((i) => spawnWorker(i))
  );

  let workerOcupados = [];

  app.use(
    fileUpload({
      limits: { fileSize: 50 * 1024 * 1024 },
    })
  );
  //   Middleware de enrutamiento
  app.use((req, res, next) => {
    if (req.method === "POST" && req.files) {
      // Seleccionar un clúster al azar
      const freeWorkers = workers
        .filter((item, index) => !workerOcupados.includes(item.id))
        .map((item) => item.id);
    
      const randomIndex = Math.floor(Math.random() * freeWorkers.length);
      const randomCluster = workers[randomIndex];
      workerOcupados.push(randomIndex);

      // console.log(workerOcupados)

      // Enviar la petición al clúster seleccionado
      const { files } = req;

      const buffer = files["file"].data;
      const data = { msg: "request", buffer };
      // console.log(data)
      randomCluster.send(data);
      // Escuchar la respuesta del clúster
      randomCluster.once("message", (msg) => {
        const newBuffer = Buffer.from(msg.file);
        // const {   res2 } = msg;
        // const { status, body } = res;
        workerOcupados = workerOcupados.filter((item) => item !== randomIndex);

        const fileName = "hello_world.png";
        const fileType = "image/png";
        res.writeHead(200, {
          "Content-Disposition": `attachment; filename="${fileName}"`,
          "Content-Type": fileType,
        });
        res.end(newBuffer);
        //   res.send(newBuffer);
      });
    } else {
      // response with html form to upload file
      res.set("Content-Type", "text/html");
      res.send(
        Buffer.from(`
        <form action="/" method="post" enctype="multipart/form-data">
            <input type="file" name="file" />
            <input type="submit" value="Upload" />
        </form>
      `)
      );
    }
  });

  setInterval(() => {
    console.log("workers ocupados: 🔴", workerOcupados);
    console.log("workers libres: 🟢", workers.filter((item) => !workerOcupados.includes(item.id)).map((item) => item.id));
  }, 1000);

  app.listen(3000, () => {
    console.log(`Server running on port 3000 and process ${process.pid}`);
  });
}

function workerCode() {
  process.on("message", async (event) => {
    const { msg, buffer } = event;
    if (msg === "request") {
      const newBuffer = Buffer.from(buffer);
      //   console.log(newBuffer);
      //   console.log(buffer);
      const img = sharp(newBuffer, { unlimitedMemory: true });
      //   console.log(img);
      img.grayscale();
      img.resize(20000, 10000);
      //   console.log(await img.toBuffer());
      process.send({
        msg: `Worker ${process.pid} finished )}`,
        file: await img.toBuffer(),
      });
      //   img.toFile(`./images/output-${process.pid}.png`, (err, info) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //     });
      //   });
      //   await sharp(buffer.data).grayscale().toFile("test.jpg");
      //   console.log(img);
      //   img.toFile(`./images/output-${process.pid}.gif`, (err, info) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //     process.send({
      //       msg: `Worker ${process.pid} finished ${JSON.stringify(info)}`,
      //     });
      //   });
      //   img.toBuffer((err, buffer) => {
      //     if (err) {
      //       console.log(err);
      //     }
      //     process.send({ res: buffer });
      //   });
      // Procesar la petición y enviar la respuesta al proceso principal
      //   const req = msg.req;
      //   const res = {};
      //   res.status = 200;
      //   res.body = "Hello World";
      //   setTimeout(() => {
      //     process.send({ res: "response " + process.pid });
      //   }, 1000);
    }
  });
}
