require("dotenv").config();
const express = require("express");
const cors = require("cors");
const { default: fetch } = require("node-fetch");

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

app.post("/prompt", async (req, res) => {
  try {
    if (!req?.body?.prompt) {
      return res.status(400).send({ error: "Missing field 'prompt' in body" });
    }

    const { prompt } = req.body;

    res.send({ received: true });

    const dalle_result = await fetch("http://localhost:2502/image", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify({ prompt }),
    })

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

    const token =
      "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJfaWQiOiI2M2Y0Y2I0NjA5YTQ5ZTQzMjA4ZTU4MTEiLCJlbWFpbCI6InNpbW9uZUBzZGUuaXQiLCJpYXQiOjE2NzY5ODcyNDksImV4cCI6MTY3NzE2MDA0OX0.-E45997sAFbp_JUR7TeGOAQjikel3rB_hvfrbF_9f54";
    const database_result = await fetch("http://localhost:2501/db/generate", {
      method: "PUT",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
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
