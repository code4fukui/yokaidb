import { fetchOrLoad } from "https://js.sabae.cc/fetchOrLoad.js";
import { HTMLParser } from "https://js.sabae.cc/HTMLParser.js";
import { CSV } from "https://code4fukui.github.io/CSV/CSV.js";
import { sleep } from "https://js.sabae.cc/sleep.js";

const list = await CSV.fetchJSON("yokaidb_idx.csv", []);

const url = "https://yokai.com/latest/";

for (let url1 = url;;) {
  const html = await fetchOrLoad(url1);
  const dom = HTMLParser.parse(html);

  const items = dom.querySelectorAll(".content article a");
  const ids = items.map(i => i.getAttribute("href"));
  console.log(ids);
  let addflg = false;
  for (const id of ids) {
    if (list.find(i => i.url == id)) continue;
    addflg = true;
    list.unshift({ url: id });
  }
  if (!addflg) break;

  const anext = dom.querySelectorAll("nav.page_nav a").filter(i => i.text.startsWith("Next Page"));
  if (anext.length == 0) break;
  const nexturl = anext[0].getAttribute("href");
  console.log("next ", nexturl)
  url1 = nexturl;
  //await sleep(500);
}

await Deno.writeTextFile("yokaidb_idx.csv", CSV.stringify(list));
