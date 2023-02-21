require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");

const data_service_url = process.env.DATA_SERVICE_URL;
const dalle_service_url = process.env.DALLE_SERVICE_URL;

// Set up the server
const app = express();
app.use(express.json({ limit: "16mb" }));
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

async function authenticateToken(req, res, next) {
  const authHeader = req.headers["authorization"];
  const token = authHeader && authHeader.split(" ")[1];

  if (token == null) return res.status(401).json({ error: "No Token given" });

  const login_result = await fetch(`${data_service_url}/db/login`, {
    method: "GET",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
  });
  if (login_result.status !== 200) {
    return res.status(401).send({ error: "Invalid Token" });
  }

  req.token = token;

  const login_result_json = await login_result.json();
  req.user = login_result_json;
  next();
}

app.post("/prompt", authenticateToken, async (req, res) => {
  try {
    if (!req?.body?.prompt) {
      return res.status(400).send({ error: "Missing field 'prompt' in body" });
    }

    const { prompt } = req.body;

    res.send({ received: true });

    const dalle_result = await fetch(`${dalle_service_url}/image`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    });

    if (dalle_result.status === 200) {
      console.log("Images correctly generated");
    } else console.error("Could not generate new images");

    const dalle_result_json = await dalle_result.json();
    const img_url = dalle_result_json.url;

    const img_result = await fetch(img_url);
    const img_buffer = await img_result.buffer();
    const img_b64 = img_buffer.toString("base64");

    const body = {
      title: `${prompt}`,
      // TODO this should be obtained by the chatgpt api
      content_text: "my content text",
      img_b64,
    };

    const database_result = await fetch(`${data_service_url}/db/store`, {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${req.token}`,
      },
      body: JSON.stringify(body),
    });

    if (database_result.status === 200) {
      console.log("Insert correctly done");
    } else console.error("Could not insert new content");
  } catch (e) {
    console.error(e);
  }
});

// Start the server
const port = process.env.PORT;
app.listen(port, () => {
  console.log(`Listening on port http://localhost:${port}`);
});
