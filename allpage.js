import "dotenv/config";
import { Client } from "@notionhq/client";
import util from "util";

const notion = new Client({ auth: process.env.NOTION_KEY });

const getPagedata = async () => {
  return await notion.databases.query({
    database_id: process.env.NOTION_ORIGIN_DATABASE_ID,
  });
};

const indexFunction = async () => {
  const pageData = await getPagedata();
  const thePage = pageData[Object.keys(pageData)[1]];
  const firstTask = thePage[0];
  const theTask = thePage[Object.keys(thePage)[0]];

  console.log(util.inspect(firstTask, false, null, true /* enable colors */));

  return "index function ran successfully.";
};

indexFunction();
