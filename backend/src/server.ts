import { getPool } from "./db/client.js";
import { env } from "./env.js";
import { createApp, startServer } from "./app.js";


const app = createApp();
const server = startServer(app, env.port);

function shutdown(signal: NodeJS.Signals) {
  // On ferme d'abord l'entrée HTTP, puis le pool SQL.
  // Cela évite d'accepter de nouvelles requêtes pendant l'arrêt.
  server.close(async () => {
    await getPool().end();
    process.exit(0);
  });

  console.log(`Signal ${signal} reçu, arrêt du backend en cours...`);
}

process.on("SIGINT", () => shutdown("SIGINT"));
process.on("SIGTERM", () => shutdown("SIGTERM"));
