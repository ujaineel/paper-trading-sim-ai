import { Context } from "aws-lambda";
import Parser from "rss-parser";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import { SP500_MAP, SP500_TICKERS } from "@trading-sim/shared/constants";

const parser = new Parser();
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

// These are the URLs we identified for your simulator
const RSS_FEED = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=";

// Delay function to avoid rate limiting
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const pollAndPublish = async () => {
  console.log("--- Starting Ingestion Cycle ---");

  for (const ticker of SP500_TICKERS) {
    try {
      const feed = await parser.parseURL(`${RSS_FEED}${ticker}`);
      console.log(`Fetched ${feed.items.length} items for ${ticker}`);
      for (const item of feed.items) {
        const message = {
          title: item.title,
          url: item.link,
          publishedAt: item.pubDate,
          source: "Yahoo Finance",
          guid: item.guid,
          content: item.content,
          ticker: ticker,
          description: item.description,
          company: SP500_MAP[ticker],
        };

        // Send to SQS (The URL from your Terraform output)
        await sqsClient.send(
          new SendMessageCommand({
            QueueUrl: process.env.SQS_URL,
            MessageBody: JSON.stringify(message),
          }),
        );
      }
    } catch (error: unknown) {
      if (error instanceof Error) {
        console.error(`Error parsing feed for ${ticker}: ${error.message}`);
      }
    }
  }

  console.log("--- Ingestion Cycle Complete ---");
};

export const handler = async (event: any, context: Context) => {
  try {
    await pollAndPublish();
    return {
      statusCode: 200,
      body: JSON.stringify({ message: "Ingestion complete" }),
    };
  } catch (error) {
    console.error("Ingestion failed:", error);
    return {
      statusCode: 500,
      body: JSON.stringify({ message: "Ingestion failed" }),
    };
  }
};
