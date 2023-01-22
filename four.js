import os from "os";
import express from "express";
import cluster from "cluster";
import { ApolloServer } from "apollo-server-express";

const numCPUs = os.cpus().length;

// Define el esquema de GraphQL y los resolvers
const typeDefs = `
  type Query {
    hello: String
  }
`;
const resolvers = {
  Query: {
    hello: () => "Hello, world!",
  },
};

if (cluster.isPrimary) {
  // Inicia varios trabajadores
  for (let i = 0; i < numCPUs; i++) {
    cluster.fork();
  }

  cluster.on("exit", (worker, code, signal) => {
    console.log(`worker ${worker.process.pid} died`);
  });
} else {
  // Código del trabajador
  const app = express();

  const server = new ApolloServer({ typeDefs, resolvers });
  await server.start();
  server.applyMiddleware({ app });

  app.listen({ port: 4000 }, () => {
    console.log(
      `Server ready at http://localhost:4000${server.graphqlPath} and worker ${process.pid}`
    );
  });
}
