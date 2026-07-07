const {
  GITHUB_AUTHORIZE_URL,
  createState,
  getCallbackUrl,
  getRepoScope,
  requiredEnv,
  sendText,
  setStateCookie
} = require("./_shared");

module.exports = function auth(req, res) {
  if (req.method !== "GET") {
    return sendText(res, 405, "Method not allowed");
  }

  const provider = req.query.provider;
  if (provider !== "github") {
    return sendText(res, 400, "Invalid provider");
  }

  try {
    const state = createState();
    const params = new URLSearchParams({
      response_type: "code",
      client_id: requiredEnv("GITHUB_OAUTH_ID"),
      redirect_uri: getCallbackUrl(req),
      scope: getRepoScope(),
      state
    });

    setStateCookie(res, state);
    res.statusCode = 302;
    res.setHeader("Location", `${GITHUB_AUTHORIZE_URL}?${params.toString()}`);
    res.end();
  } catch (error) {
    sendText(res, 500, error.message);
  }
};
