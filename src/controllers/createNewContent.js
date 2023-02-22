require("dotenv").config();
const { default: fetch } = require("node-fetch");

const data_service_url = process.env.DATA_SERVICE_URL;
const dalle_service_url = process.env.DALLE_SERVICE_URL;

async function createNewContent(req, res) {
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
}

module.exports = { createNewContent };
