import "dotenv/config";
import { Client } from "@notionhq/client";
import util from "util";

const notion = new Client({ auth: process.env.NOTION_KEY });

const getPagedata = async () => {
  return await notion.databases.query({
    database_id: process.env.NOTION_ORIGIN_DATABASE_ID,
  });
};

const getAllFeatures = async (pageData) => {
  const scoreValidator = (gap) => {
    if (gap != null && gap != undefined && gap.formula.number != 0) {
      return (gap.formula.number * -1).toString();
    } else if (gap != null && gap != undefined && gap.formula.number == 0) {
      return "0";
    } else {
      return "N/A";
    }
  };

  let allFeatures = [];

  await pageData.results.forEach((result) => {
    // console.log(
    //   util.inspect(
    //     result.properties.gap.formula.number,
    //     false,
    //     null,
    //     true /* enable colors */
    //   )
    // );
    // console.log("-----------------------------------------");
    try {
      if (
        result.properties.Type &&
        result.properties.Type.select != null &&
        result.properties.Type.select.name != undefined &&
        result.properties.Type.select.name != null &&
        result.properties.Type.select.name === "Feature"
      ) {
        allFeatures.push({
          owner:
            result.properties.Owner.people[0] &&
            result.properties.Owner.people[0].name
              ? result.properties.Owner.people[0].name
              : `userID: ${result.properties.Owner.people[0].id}`,

          featureId: result.id,

          featureName: result.properties.task.title[0].text.content,

          score:
            result.properties.gap &&
            result.properties.gap.formula &&
            result.properties.gap.formula.number != undefined &&
            result.properties.gap.formula.number != null
              ? scoreValidator(result.properties.gap)
              : "hi!",

          sprint:
            result.properties.Sprint &&
            result.properties.Sprint.multi_select &&
            result.properties.Sprint.multi_select.length != 0 &&
            result.properties.Sprint.multi_select.name != undefined &&
            result.properties.Sprint.multi_select.name != null
              ? result.properties.Sprint.multi_select[0].name
              : "N/A",

          related:
            result.properties.Related &&
            result.properties.Related.relation &&
            result.properties.Related.relation.length !== 0
              ? result.properties.Related.relation
              : "N/A",

          // owner: result.properties.Owner.multi_select[0].name,
          // // featureName: result.properties[" task"].title[0],
          // score: scoreValidator(result.properties.gap),
          // sprint: result.properties.Sprint
          //   ? result.properties.Sprint.select.name
          //   : "N/A",
        });
      } else {
        return `${result.id} isn't a feature OR name is null`;
      }
    } catch (error) {
      console.error(error);
    }
  });
  return allFeatures;
};

const indexFunction = async () => {
  const pageData = await getPagedata();
  const allFeatures = await getAllFeatures(pageData);
  console.log(util.inspect(allFeatures, false, null, true /* enable colors */));
  // const allFeatureEntries = await allFeaturesEntriesGenerator(allFeatures);
  // await entryAdder(allFeatureEntries);

  return "index function ran successfully.";
};

indexFunction();
