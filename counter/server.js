const express = require("express");
const { MongoClient } = require("mongodb");

const app = express();
const PORT = process.env.PORT || 3000;
// In Kubernetes we'll pass: mongodb://mongo:27017/helloapp
const MONGO_URL = process.env.MONGO_URL || "mongodb://localhost:27017/helloapp";

let col;

(async () => {
  const client = new MongoClient(MONGO_URL);
  await client.connect();
  const db = client.db();            // db from URL (helloapp)
  col = db.collection("visits");
  console.log("connected to mongo");
})().catch(err => { console.error(err); process.exit(1); });

app.get("/count/:name", async (req, res) => {
  const name = req.params.name;
  const doc = await col.findOneAndUpdate(
    { name },
    { $inc: { count: 1 } },
    { upsert: true, returnDocument: "after" }
  );
  res.json({ name, count: doc.value?.count || 1 });
});

app.get("/healthz", (_req, res) => res.send("ok"));
app.get("/readyz",  (_req, res) => res.send("ok"));

app.listen(PORT, () => console.log(`counter on :${PORT}, mongo=${MONGO_URL}`));
