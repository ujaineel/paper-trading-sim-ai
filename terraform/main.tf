provider "aws" {
  region = "us-east-1"
}

variable "project_name" {
  default = "trading-sim"
}

# --- 1. SQS Queue (The Buffer) ---
resource "aws_sqs_queue" "news_queue" {
  name                      = "${var.project_name}-news-queue"
  delay_seconds             = 0
  max_message_size          = 262144 # 256 KB
  message_retention_seconds = 345600 # 4 days
  receive_wait_time_seconds = 20     # Long polling (Cheaper)
}

# --- 2. SSM Parameter ---
resource "aws_ssm_parameter" "queue_url" {
  name  = "/${var.project_name}/sqs-url"
  type  = "String"
  value = aws_sqs_queue.news_queue.url
}

# --- 3. Output for reference ---
output "sqs_url" {
  value = aws_sqs_queue.news_queue.url
}