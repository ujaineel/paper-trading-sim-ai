import Fastify from "fastify";
import Parser from "rss-parser";
import { SQSClient, SendMessageCommand } from "@aws-sdk/client-sqs";
import dotenv from "dotenv";
import { SP500_MAP, SP500_TICKERS } from "@trading-sim/shared/constants";

dotenv.config();

const fastify = Fastify({ logger: true });
const parser = new Parser();
const sqsClient = new SQSClient({ region: process.env.AWS_REGION });

// These are the URLs we identified for your simulator
const RSS_FEED = "https://feeds.finance.yahoo.com/rss/2.0/headline?s=";

// Delay function to avoid rate limiting
const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));

const pollAndPublish = async () => {
  fastify.log.info("--- Starting Ingestion Cycle ---");

  for (const ticker of SP500_TICKERS) {
    try {
      const feed = await parser.parseURL(`${RSS_FEED}${ticker}`);
      fastify.log.info(`Fetched ${feed.items.length} items for ${ticker}`);
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
        fastify.log.error(`Error parsing feed for ${ticker}: ${error.message}`);
      }
    }
  }
};

// Health check for your Resume's "Observability" section
fastify.get("/health", async () => ({ status: "ok" }));

const start = async () => {
  try {
    await pollAndPublish();
    setInterval(pollAndPublish, 1000 * 60 * 10);

    // Start the server
    await fastify.listen({ port: 3000, host: "0.0.0.0" });
  } catch (error) {
    if (error instanceof Error) {
      fastify.log.error(`Server error: ${error}`);
    }
    process.exit(1);
  }
};

start();
