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
  const thePage = pageData[Object.keys(pageData)[1]];

  const getGapSumOfFeatureTasks = (featureTasksArray) => {
    let featureGap = 0;
    featureTasksArray.forEach((task) => {
      thePage.forEach((pageTask) => {
        if (task.id === pageTask.id) {
          if (
            pageTask.properties.gap &&
            pageTask.properties.gap.formula &&
            pageTask.properties.gap.formula.number != undefined &&
            pageTask.properties.gap.formula.number != null
          ) {
            featureGap += pageTask.properties.gap.formula.number;
          } else {
            featureGap += 0;
          }
          return pageTask.id;
        }
      });
    });
    if (featureGap === 0) {
      return "0";
    } else {
      return String(featureGap * -1);
    }
  };

  let allFeatures = [];

  await pageData.results.forEach((result) => {
    // console.log("below is result.properties.Sprint");
    // console.log(result.properties.Sprint);
    // console.log(
    //   util.inspect(
    //     result.properties.Sprint.multi_select[0],
    //     false,
    //     null,
    //     true /* enable colors */
    //   )
    // );
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

          sprint:
            result.properties.Sprint &&
            result.properties.Sprint.multi_select &&
            result.properties.Sprint.multi_select.length !== 0 &&
            result.properties.Sprint.multi_select[0].name !== undefined &&
            result.properties.Sprint.multi_select[0].name !== null
              ? result.properties.Sprint.multi_select[0].name
              : "N/A",

          related:
            result.properties.Related &&
            result.properties.Related.relation &&
            result.properties.Related.relation.length !== 0
              ? result.properties.Related.relation
              : "N/A",

          score:
            result.properties.Related &&
            result.properties.Related.relation &&
            result.properties.Related.relation.length !== 0
              ? getGapSumOfFeatureTasks(result.properties.Related.relation)
              : "N/A",
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

const allFeaturesEntriesGenerator = async (allFeatures) => {
  const allFeaturesEntries = allFeatures.map((feature) => {
    return {
      Name: {
        title: [
          {
            text: {
              content: feature.owner,
            },
          },
        ],
      },
      featureName: {
        type: "rich_text",
        rich_text: [
          {
            text: {
              content: feature.featureName,
            },
          },
        ],
      },
      Score: {
        type: "rich_text",
        rich_text: [
          {
            text: {
              content: feature.score,
            },
          },
        ],
      },
      Sprint: {
        type: "rich_text",
        rich_text: [
          {
            text: {
              content: feature.sprint,
            },
          },
        ],
      },
      // Related: {
      //   type: "rich_text",
      //   rich_text: [
      //     {
      //       text: {
      //         content: feature.related,
      //       },
      //     },
      //   ],
      // },
    };
  });
  return allFeaturesEntries;
};

const entryAdder = async (allFeaturesEntries) => {
  await allFeaturesEntries.forEach((entry) => addSingleEntry(entry));
};

const addSingleEntry = async (entry) => {
  try {
    const response = await notion.pages.create({
      parent: {
        database_id: process.env.NOTION_PERFORMANCE_LIST_DATABASE_ID,
      },
      properties: entry,
    });
    console.log(response);
    console.log("Entry added successfully.");
  } catch (error) {
    console.error(error);
  }
};

const indexFunction = async () => {
  const pageData = await getPagedata();
  const allFeatures = await getAllFeatures(pageData);
  const allFeatureEntries = await allFeaturesEntriesGenerator(allFeatures);
  // console.log(
  //   util.inspect(allFeatureEntries, false, null, true /* enable colors */)
  // );
  await entryAdder(allFeatureEntries);

  return "index function ran successfully.";
};

indexFunction();
