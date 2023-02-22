require("dotenv").config();
const data_service_url = process.env.DATA_SERVICE_URL;

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

module.exports = { authenticateToken };
