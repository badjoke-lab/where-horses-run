import fs from "node:fs";
import { spawnSync } from "node:child_process";
import { fileURLToPath } from "node:url";

const contractPath = fileURLToPath(
  new URL("../data/generated/m6-seo-sitemap-metadata-final.json", import.meta.url),
);

function fail(message) {
  console.error(`[m6-seo-final] ${message}`);
  process.exit(1);
}

function expectEqual(actual, expected, label) {
  if (JSON.stringify(actual) !== JSON.stringify(expected)) {
    fail(`${label} mismatch: expected ${JSON.stringify(expected)}, got ${JSON.stringify(actual)}`);
  }
}

function run(label, script) {
  console.log(`[m6-seo-final] ${label}`);
  const npm = process.platform === "win32" ? "npm.cmd" : "npm";
  const result = spawnSync(npm, ["run", script], { stdio: "inherit" });
  if (result.error) {
    fail(`${label} could not start: ${result.error.message}`);
  }
  if (result.status !== 0) {
    fail(`${label} failed with exit code ${result.status ?? "unknown"}`);
  }
}

function normalizePathname(pathname) {
  if (pathname === "/") return pathname;
  return pathname.replace(/\/+$/, "");
}

if (!fs.existsSync(contractPath)) {
  fail(`missing contract: ${contractPath}`);
}

const contract = JSON.parse(fs.readFileSync(contractPath, "utf8"));

expectEqual(contract.schema_version, "1.0.0", "schema_version");
expectEqual(contract.release_stage, "M6", "release_stage");
expectEqual(contract.work_item, "PR-100", "work_item");
expectEqual(contract.site_origin, "https://whr.badjoke-lab.com", "site_origin");
expectEqual(
  contract.required_public_routes,
  ["/", "/about", "/methods", "/coverage", "/calendar", "/racecourses"],
  "required_public_routes",
);
expectEqual(
  contract.checks,
  ["canonical", "sitemap", "robots", "opengraph", "twitter", "social_card"],
  "checks",
);
expectEqual(
  contract.social_card,
  { path: "/social/whr-social-card-v1.png", width: 1200, height: 630 },
  "social_card",
);
expectEqual(contract.public_boundary?.does_not_expand_routes, true, "public_boundary.does_not_expand_routes");
expectEqual(
  contract.public_boundary?.does_not_publish,
  ["racecards", "horses", "jockeys", "odds", "results", "payouts", "raw_html", "body_text"],
  "public_boundary.does_not_publish",
);

run("build", "build");
run("page SEO", "check:seo");
run("sitemap / robots", "check:sitemap");
run("social card", "check:social");

const sitemapPath = fileURLToPath(new URL("../dist/sitemap.xml", import.meta.url));
if (!fs.existsSync(sitemapPath)) {
  fail("build did not produce dist/sitemap.xml");
}

const sitemap = fs.readFileSync(sitemapPath, "utf8");
const sitemapPaths = new Set(
  [...sitemap.matchAll(/<loc>([^<]+)<\/loc>/g)].map((match) => {
    const url = new URL(match[1]);
    if (url.origin !== contract.site_origin) {
      fail(`sitemap contains unexpected origin: ${url.origin}`);
    }
    return normalizePathname(url.pathname);
  }),
);

for (const route of contract.required_public_routes) {
  if (!sitemapPaths.has(normalizePathname(route))) {
    fail(`required public route missing from sitemap: ${route}`);
  }
}

console.log("[m6-seo-final] PR-100 SEO / sitemap / metadata release gate passed.");
