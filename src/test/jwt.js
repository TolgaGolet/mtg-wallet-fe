/** An unsigned JWT for tests, with `sub` and an `exp` that many seconds from now. */
export function fakeJwt(sub, expiresInSeconds = 3600) {
  const encode = (obj) =>
    btoa(JSON.stringify(obj))
      .replace(/=+$/, "")
      .replace(/\+/g, "-")
      .replace(/\//g, "_");
  const exp = Math.floor(Date.now() / 1000) + expiresInSeconds;
  return `${encode({ alg: "HS256" })}.${encode({ sub, exp })}.sig`;
}
