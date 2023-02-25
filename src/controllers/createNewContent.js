require("dotenv").config();
const { default: fetch } = require("node-fetch");

const data_service_url = process.env.DATA_SERVICE_URL;
const dalle_service_url = process.env.DALLE_SERVICE_URL;
const blogger_service_url = process.env.BLOGGER_SERVICE_URL;

async function makeAFetch(url, method, token, body, item_description) {
  console.log(`starting generation of ${item_description}`);

  const result = await fetch(url, {
    method,
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: JSON.stringify(body),
  });

  const result_json = await result.json();

  if (result.status !== 200) {
    console.log(result_json);
    throw new Error(`could not generate ${item_description}`);
  } else console.log(`${item_description} correctly generated`);

  return result_json;
}

async function createNewContent(req, res) {
  try {
    if (!req?.body?.prompt) {
      return res.status(400).send({ error: "Missing field 'prompt' in body" });
    }

    const { prompt } = req.body;
    const token = req.token;

    res.send({ received: true });

    // * blogger api
    const blogger_result_json = await makeAFetch(
      `${blogger_service_url}/generateText`,
      "POST",
      token,
      { prompt },
      "content text"
    );
    const content_text = blogger_result_json.text;

    // * dalle api
    const dalle_result_json = await makeAFetch(
      `${dalle_service_url}/image`,
      "POST",
      token,
      { prompt },
      "images"
    );
    const img_url = dalle_result_json.url;
    const img_result = await fetch(img_url);
    const img_buffer = await img_result.buffer();
    const img_b64 = img_buffer.toString("base64");

    // * store everything api
    const title = `${prompt}`;
    const body = {
      title,
      content_text,
      img_b64,
    };

    const database_result_json = await makeAFetch(
      `${data_service_url}/db/store`,
      "PUT",
      token,
      body,
      "record in database"
    );

    console.log(`Generade new content with id: ${database_result_json._id}`);
  } catch (e) {
    console.error(e);
  }
}

module.exports = { createNewContent };
