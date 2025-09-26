const express = require("express");
const fetch = require("node-fetch");

const app = express();
const PORT = 3000;

app.get("/hello/:name", async (req, res) => {
  const name = req.params.name; 

  try {
    const response = await fetch(`http://counter:3000/count/${name}`);
    const data = await response.json();
    res.send(`<h1>Hello ${name}!</h1><p>Counter value: ${data.count}</p>`);
  } catch (err) {
    res.send(`<h1>Error connecting to Counter</h1><p>${err.message}</p>`);
  }
});

app.listen(PORT, () => {
  console.log(`Frontend running on port ${PORT}`);
});
