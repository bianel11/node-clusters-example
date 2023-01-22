import os from "os";
import cluster from "cluster";
import animals from "./animals.js";
import express from "express";

if (cluster.isPrimary) {
  primaryCode();
} else {
  workerCode();
}

const html = `
<label for="animales">Eligue los animales a ordenar:</label>
<br></br>
<select name="animales" id="animales" multiple style="height: 200px">
  ${
    // randomize array
    animals
      .sort(() => Math.random() - 0.5)
      .map((item) => `<option value="${item}">${item}</option>`)
  }
</select>

<button>
  Ordenar
</button>
<ol id="lista"></ol>
<script>
  const btn = document.querySelector("button");
  btn.addEventListener("click", () => {
    const animales = document.querySelector("#animales");
    const selected = [...animales.selectedOptions].map((item) => item.value);
    ordenarAnimales(selected);
  });

  async function ordenarAnimales(animales) {
    try {
      const response = await fetch("/", { 
        method: "POST",
        body: JSON.stringify(animales),
        headers: {
          "Content-Type": "application/json",
        },
      });
      const data = await response.json();
      let lista = data.map((item) => "<li>" + item + "</li>").join("");
      document.querySelector("#lista").innerHTML = lista 
    } catch (error) {
      console.log(error);
    }}
</script>
`;

function spawnWorker(i) {
  return new Promise((resolve) => {
    const worker = cluster.fork({ id: i });
    // debe esperar un segundo para que el proceso se inicie
    setTimeout(() => {
      resolve(worker);
    }, 1000);
  });
}

async function primaryCode() {
  const app = express();
  const cpuList = os.cpus();
  const workers = await Promise.all(
    [...Array(cpuList.length).keys()].map((i) => spawnWorker(i))
  );

  let workerOcupados = [];
  app.use(express.json());
  app.use((req, res, next) => {
    if (req.method === "POST" && req.body) {  
      const freeWorkers = workers
        .filter((item, index) => !workerOcupados.includes(item.id))
        .map((item) => item.id);
      const randomIndex = Math.floor(Math.random() * freeWorkers.length);
      const randomCluster = workers[randomIndex];
      workerOcupados.push(randomIndex);
      // Enviar la petición al clúster seleccionado
      const { body } = req;
      const data = { msg: "request", body };
      randomCluster.send(data);
      // Escuchar la respuesta del clúster
      randomCluster.once("message", (text) => {
        workerOcupados = workerOcupados.filter((item) => item !== randomIndex);
        res.send(text);
      });
    } else {
      res.send(html);
    }
  });
  setInterval(() => {
    console.log("workers ocupados: 🔴", workerOcupados);
    console.log(
      "workers libres: 🟢",
      workers
        .filter((item) => !workerOcupados.includes(item.id))
        .map((item) => item.id)
    );
  }, 1000);

  app.listen(3000, () => {
    console.log(`Server running on port 3000 and process ${process.pid}`);
  });
}

function workerCode() {
  process.on("message", ({ body }) => {
    if (body) {
      const animals = body;
      const orderedAnimals = quicksort(animals);
      setTimeout(() => {
        process.send(orderedAnimals);
      }, 1000);
    }
  });
}

function quicksort(arr) {
  if (arr.length <= 1) {
    return arr;
  } else {
    let left = [];
    let right = [];
    let newArray = [];
    let pivot = arr.pop();
    let length = arr.length;

    for (let i = 0; i < length; i++) {
      if (arr[i] <= pivot) {
        left.push(arr[i]);
      } else {
        right.push(arr[i]);
      }
    }

    return newArray.concat(quicksort(left), pivot, quicksort(right));
  }
}
