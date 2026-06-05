const target = process.env.SMOKE_URL;

if (!target) {
  console.error("Set SMOKE_URL to your deployed Vercel URL.");
  process.exit(1);
}

const baseUrl = target.replace(/\/$/, "");
const routes = ["/login", "/signup", "/terms", "/privacy", "/consent"];
const requiredHeaders = [
  "x-frame-options",
  "x-content-type-options",
  "referrer-policy",
  "permissions-policy",
  "strict-transport-security",
];

for (const route of routes) {
  const response = await fetch(`${baseUrl}${route}`, {
    redirect: "manual",
  });

  if (response.status < 200 || response.status >= 400) {
    throw new Error(`${route} returned ${response.status}`);
  }

  console.log(`${route}=ok`);
}

const headersResponse = await fetch(`${baseUrl}/login`);
const missing = requiredHeaders.filter(
  (header) => !headersResponse.headers.has(header),
);

if (missing.length) {
  throw new Error(`Missing security headers: ${missing.join(", ")}`);
}

console.log("security_headers=ok");
console.log("deployed_smoke=ok");
