export interface NewsArticleDTO {
  id: string;
  ticker: string;
  company: string;
  title: string;
  description: string;
  content: string | null;
  url: string;
  guid: string;
  source: string;
  publishedAt: string;
  ingestedAt: string;
}

export interface SentimentScoreDTO {
  id: string;
  articleId: string;
  ticker: string;
  titleScore: number;
  descriptionScore: number;
  avgScore: number;
  highestScore: number;
  analyzedAt: string;
}

export interface TickerSentimentDTO {
  ticker: string;
  avgScore: number;
  trend: "BULLISH" | "BEARISH" | "NEUTRAL";
  articleCount: number;
  articles: (NewsArticleDTO & { sentiment: SentimentScoreDTO })[];
}

export interface SentimentMoverDTO {
  ticker: string;
  company: string;
  avgScore: number;
  scoreChange: number;
  articleCount: number;
}
