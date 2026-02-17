import { SQSEvent, Context } from "aws-lambda";
import Sentiment from "sentiment";

const sentiment = new Sentiment();

export const handler = async (event: SQSEvent, context: Context) => {
  console.log(`Processing ${event.Records.length} records from SQS.`);

  for (const record of event.Records) {
    try {
      const article = JSON.parse(record.body);

      console.log(`🧠 Analyzing Sentiment for: ${article.title}`);

      const descriptionSentiment = sentiment.analyze(article.description);
      const titleSentiment = sentiment.analyze(article.title);

      const avgSentiment = Math.ceil(
        (descriptionSentiment.score + titleSentiment.score) / 2,
      );

      const highestSentiment = Math.max(
        descriptionSentiment.score,
        titleSentiment.score,
      );

      console.log(
        `🧠 Sentiment for ${article.ticker}: ${article.company} for ${article.title}: ${avgSentiment}-${highestSentiment}`,
      );
    } catch (error) {
      console.error(`Error processing record ${record.messageId}:`, error);
    }
  }

  return {
    statusCode: 200,
    body: JSON.stringify({ message: "Processed successfully" }),
  };
};
