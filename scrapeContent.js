import { fetchOrLoad } from "https://js.sabae.cc/fetchOrLoad.js";
import { HTMLParser } from "https://js.sabae.cc/HTMLParser.js";
import { CSV } from "https://code4fukui.github.io/CSV/CSV.js";
import { sleep } from "https://js.sabae.cc/sleep.js";

const listidx = await CSV.fetchJSON("yokaidb_idx.csv", []);
const list = await CSV.fetchJSON("yokaidb.csv", []);

const parseLines = (dom) => {  
  const lines = [];
  let line = "";
  //console.log(dom)
  for (const item of dom.childNodes) {
    if (item.tagName == "BR") {
      if (line) {
        lines.push(line);
        line = "";
      }
    } else {
      line += item.text;
    }
  }
  if (line) lines.push(line);
  return lines;
};

const countChar = (s, chk) => {
  let cnt = 0;
  for (const c of s) {
    if (c == chk) cnt++;
  }
  return cnt;
};

const normalizeName = (name) => {
  //url,name,name_ja,translation,alternate_names,habitat,appearance,
  //interactions,
  //body,origin,behavior,diet,legends,critical_weakness,
  // origins,internactions,interaction,legend,alternative_names
  const map = {
    origins: "origin",
    internactions: "interactions",
    interaction: "interactions",
    legend: "legends",
    alternative_names: "alternate_names",
  };
  const name2 = map[name];
  if (name2) return name2;
  return name;
};

const scrapeItem = async (url) => {
  const html0 = await fetchOrLoad(url);
  const html = html0.replace(/ /g, " ");
  //const html = html0;
  const dom = HTMLParser.parse(html);

  const item = { url };
  const h1s = dom.querySelectorAll("h1");
  item.name = h1s[h1s.length - 1].text.trim();
  const ps = dom.querySelectorAll(".entry_content p");
  let firstflg = true;
  for (const p of ps) {
    const lines = parseLines(p);
    //const lang = p.getAttribute("lang");// || p.querySelector("span")?.getAttribute("lang");
    //const cls = p.getAttribute("class");
    //if (lang == "ja" || cls == '"japanese' || cls == "Japanese") {
    if (firstflg) {
      if (lines.length == 1 && lines[0] == "\n") continue; // for takarabune
      item["name_ja"] = lines[0].trim();
      item["name_ja_kana"] = lines.length == 1 ? item["name_ja"] : lines[1].trim();
      firstflg = false;
      continue;
    }
    for (const line of lines) {
      let addflg = false;
      const n = line.indexOf(": ");
      if (n > 0 && line[n + 2] != '“') {
        const name = line.substring(0, n).trim();
        if (name.indexOf("(") < 0) {
          const name2 = name.replace(/\s/g, "_").toLowerCase();
          if (countChar(name2, "_") <= 3) {
            const name3 = normalizeName(name2);
            if (item[name3]) {
              item[name3] += "\n" + line.substring(n + 2).trim();
            } else {
              item[name3] = line.substring(n + 2).trim();
            }
            addflg = true;
          }
        }
      }
      if (!addflg) {
        const name2 = "description";
        if (item[name2]) {
          item[name2] += "\n" + line.trim();
        } else {
          item[name2] = line.trim();
        }
      }
    }
  }
  return item;
};


for (const idx of listidx) {
  const item = list.find(i => i.url == idx.url);
  if (item) continue;
  console.log(idx.url);
  const items = await scrapeItem(idx.url);
  list.push(items);
  await Deno.writeTextFile("yokaidb.csv", CSV.stringify(list));
  //await sleep(500);
}

//console.log(await scrapeItem("https://yokai.com/takarabune/"));
//console.log(await scrapeItem("https://yokai.com/kappa/"));
//console.log(await scrapeItem("https://yokai.com/yaotome/"));
