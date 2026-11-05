import { serve, file } from "bun";
import home from "./src/index.html";
import documentation from "./src/documentation/index.html";
import el1 from "./src/element1/index.html";
import el2 from "./src/element2/index.html";
import el3 from "./src/element3/index.html";
import el4 from "./src/element4/index.html";
import el5 from "./src/element5/index.html";

const pages = {
  "/": home,
  "/documentation/": documentation,
  "/element1/": el1,
  "/element2/": el2,
  "/element3/": el3,
  "/element4/": el4,
  "/element5/": el5,
};

const routes = Object.fromEntries(
  Object.entries(pages).flatMap(([path, page]) => [
    [path, page],
    [`${path}index.html`, page],
  ])
);

serve({
  port: 3000,
  routes,
  async fetch(req) {
    const path = new URL(req.url).pathname;
    if (!path.includes("..")) {
      const f = file(`./public${path}`);
      if (await f.exists()) return new Response(f);
    }
    return new Response("Not found", { status: 404 });
  },
  development: process.env.NODE_ENV !== "production",
});