require("dotenv").config();
const express = require("express");
const cors = require("cors");

// Set up the server
const app = express();
app.use(express.json());
app.use(cors());

// log the requets I get
function requestLogger(req, res, next) {
  console.log(`requested ${req.method} ${req.url}`);
  next();
}
app.use(requestLogger);

// basic api to tell that we're online
app.get("/", (req, res) => {
  res.send({ online: true });
});

app.post("/prompt", async (req, res) => {
  if (!req?.body?.prompt) {
    return res.status(400).send({ error: "Missing field 'prompt' in body" });
  }

  const { prompt } = req.body;

  res.send({ prompt });
});

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`);
});
