Just an attempt to build a web paper trading platform with basic sentiment analysis processing and gen AI usage. Later plan/idea to add screener for certain strategies and display on charts/factors affecting the strategy. Currently, plan to just keep S&P 500 tickers, and ETFs.

Currently, backend only. Monorepo.

Tech: PNPM, Fastify, Node.js, TypeScript, Terraform, AWS SQS, AWS Lambda, AWS DynamoDB, PostgreSQL, Drizzle, AWS CloudWatch.


How to run this:

1. Build the package in apps/processor.
2. Make sure AWS is set up.
3. Run terraform init in terraform folder
4. Run terraform apply in terraform folder.
