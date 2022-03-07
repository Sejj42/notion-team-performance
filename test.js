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
      featureID: {
        type: "rich_text",
        rich_text: [
          {
            text: {
              content: feature.featureId,
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
  console.log(
    util.inspect(allFeatureEntries, false, null, true /* enable colors */)
  );
  await entryAdder(allFeatureEntries);

  return "index function ran successfully.";
};

indexFunction();
