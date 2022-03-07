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
    if (gap && gap.number !== 0) {
      return (gap.number * -1).toString();
    } else if (gap && gap.number == 0) {
      return "0";
    } else {
      return "N/A";
    }
  };

  let allFeatures = [];

  await pageData.results.forEach((result) => {
    if (
      result.properties.Type &&
      result.properties.Type.select.name === "Feature"
    ) {
      allFeatures.push({
        owner: result.properties.Owner.multi_select[0].name,
        featureId: result.id,
        // featureName: result.properties[" task"].title[0],
        score: scoreValidator(result.properties.gap),
        sprint: result.properties.Sprint
          ? result.properties.Sprint.select.name
          : "N/A",
      });
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
  await entryAdder(allFeatureEntries);

  return "index function ran successfully.";
};

indexFunction();
