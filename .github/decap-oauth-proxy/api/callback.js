const {
  clearStateCookie,
  exchangeCodeForToken,
  getCallbackUrl,
  readCookie,
  sendCallbackHtml,
  sendText
} = require("./_shared");

module.exports = async function callback(req, res) {
  if (req.method !== "GET") {
    return sendText(res, 405, "Method not allowed");
  }

  const provider = req.query.provider;
  if (provider !== "github") {
    return sendText(res, 400, "Invalid provider");
  }

  const expectedState = readCookie(req, "decap_oauth_state");
  const returnedState = req.query.state;
  if (!expectedState || !returnedState || expectedState !== returnedState) {
    return sendText(res, 400, "Invalid OAuth state");
  }

  const code = req.query.code;
  if (!code) {
    return sendText(res, 400, "Missing OAuth code");
  }

  try {
    const accessToken = await exchangeCodeForToken(code, getCallbackUrl(req));
    clearStateCookie(res);
    sendCallbackHtml(res, "success", accessToken);
  } catch (error) {
    clearStateCookie(res);
    sendCallbackHtml(res, "error", error.message);
  }
};
