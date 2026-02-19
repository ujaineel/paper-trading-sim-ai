import { eq, desc, gte, sql } from "drizzle-orm";
import {
  newsArticles,
  sentimentScores,
} from "@trading-sim/shared/db/schema";
import type { Database } from "@trading-sim/shared/db";
import { SP500_MAP } from "@trading-sim/shared/constants";

export class SentimentService {
  constructor(private db: Database) {}

  async getTickerSentiment(ticker: string, days: number = 7) {
    const since = new Date();
    since.setDate(since.getDate() - days);

    const results = await this.db
      .select({
        article: newsArticles,
        sentiment: sentimentScores,
      })
      .from(newsArticles)
      .innerJoin(
        sentimentScores,
        eq(newsArticles.id, sentimentScores.articleId),
      )
      .where(eq(newsArticles.ticker, ticker))
      .orderBy(desc(newsArticles.publishedAt))
      .limit(50);

    if (results.length === 0) {
      return {
        ticker,
        avgScore: 0,
        trend: "NEUTRAL" as const,
        articleCount: 0,
        articles: [],
      };
    }

    const avgScore =
      results.reduce((sum, r) => sum + r.sentiment.avgScore, 0) /
      results.length;

    const trend =
      avgScore > 1 ? "BULLISH" : avgScore < -1 ? "BEARISH" : "NEUTRAL";

    return {
      ticker,
      avgScore: +avgScore.toFixed(2),
      trend,
      articleCount: results.length,
      articles: results.map((r) => ({
        id: r.article.id,
        ticker: r.article.ticker,
        company: r.article.company,
        title: r.article.title,
        description: r.article.description ?? "",
        content: r.article.content,
        url: r.article.url,
        guid: r.article.guid,
        source: r.article.source,
        publishedAt: r.article.publishedAt?.toISOString() ?? "",
        ingestedAt: r.article.ingestedAt.toISOString(),
        sentiment: {
          id: r.sentiment.id,
          articleId: r.sentiment.articleId,
          ticker: r.sentiment.ticker,
          titleScore: r.sentiment.titleScore,
          descriptionScore: r.sentiment.descriptionScore,
          avgScore: r.sentiment.avgScore,
          highestScore: r.sentiment.highestScore,
          analyzedAt: r.sentiment.analyzedAt.toISOString(),
        },
      })),
    };
  }

  async getTopMovers(direction: "positive" | "negative" = "positive", limit: number = 10) {
    // Get aggregate sentiment per ticker from recent articles
    const order = direction === "positive" ? desc : undefined;

    const results = await this.db
      .select({
        ticker: sentimentScores.ticker,
        avgScore: sql<number>`AVG(${sentimentScores.avgScore})`.as("avg_score"),
        articleCount: sql<number>`COUNT(*)`.as("article_count"),
      })
      .from(sentimentScores)
      .groupBy(sentimentScores.ticker)
      .orderBy(
        direction === "positive"
          ? desc(sql`AVG(${sentimentScores.avgScore})`)
          : sql`AVG(${sentimentScores.avgScore}) ASC`,
      )
      .limit(limit);

    return results.map((r) => ({
      ticker: r.ticker,
      company: SP500_MAP[r.ticker] ?? r.ticker,
      avgScore: +Number(r.avgScore).toFixed(2),
      articleCount: Number(r.articleCount),
    }));
  }
}
