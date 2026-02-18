# --- Build the Ingestor Lambda ---
resource "null_resource" "build_ingestor" {
  triggers = {
    code_hash = sha256(join("", [for f in fileset("${path.module}/../apps/ingestor/src", "**") : filebase64("${path.module}/../apps/ingestor/src/${f}")]))
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../apps/ingestor && pnpm run build"
  }
}

# --- Zip the Ingestor Lambda ---
data "archive_file" "ingestor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../apps/ingestor/dist"
  output_path = "${path.module}/dist/ingestor.zip"

  depends_on = [null_resource.build_ingestor]
}

# --- 1. IAM Role for the Ingestor Lambda ---
resource "aws_iam_role" "ingestor_role" {
  name = "${var.project_name}-ingestor-role"

  assume_role_policy = jsonencode({
    Version = "2012-10-17"
    Statement = [{
      Action = "sts:AssumeRole"
      Effect = "Allow"
      Principal = {
        Service = "lambda.amazonaws.com"
      }
    }]
  })
}

# --- 2. SQS + Logs Permissions for the Ingestor Lambda ---
resource "aws_iam_policy" "ingestor_policy" {
  name        = "${var.project_name}-ingestor-policy"
  description = "Allows Ingestor Lambda to send messages to SQS and write logs"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect = "Allow"
        Action = [
          "sqs:SendMessage"
        ]
        Resource = aws_sqs_queue.news_queue.arn
      },
      {
        Effect = "Allow"
        Action = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "ingestor_policy_attach" {
  role       = aws_iam_role.ingestor_role.name
  policy_arn = aws_iam_policy.ingestor_policy.arn
}

# --- 3. The Ingestor Lambda Function ---
resource "aws_lambda_function" "ingestor" {
  function_name    = "${var.project_name}-ingestor"
  role             = aws_iam_role.ingestor_role.arn
  handler          = "index.handler"
  runtime          = "nodejs22.x"
  memory_size      = 256
  timeout          = 120
  filename         = data.archive_file.ingestor_zip.output_path
  source_code_hash = data.archive_file.ingestor_zip.output_base64sha256

  environment {
    variables = {
      SQS_URL    = aws_sqs_queue.news_queue.url
    }
  }
}

# ============================================================
# EventBridge Scheduled Rules (all times in UTC)
# EST = UTC - 5
# ============================================================

# --- 4a. Schedule: 9:28 AM EST = 14:28 UTC ---
resource "aws_cloudwatch_event_rule" "ingestor_928am" {
  name                = "${var.project_name}-ingestor-928am"
  description         = "Triggers ingestor Lambda at 9:28 AM EST daily"
  schedule_expression = "cron(28 14 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ingestor_928am_target" {
  rule = aws_cloudwatch_event_rule.ingestor_928am.name
  arn  = aws_lambda_function.ingestor.arn
}

resource "aws_lambda_permission" "allow_928am" {
  statement_id  = "AllowEventBridge928AM"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestor_928am.arn
}

# --- 4b. Schedule: 4:00 PM EST = 21:00 UTC ---
resource "aws_cloudwatch_event_rule" "ingestor_400pm" {
  name                = "${var.project_name}-ingestor-400pm"
  description         = "Triggers ingestor Lambda at 4:00 PM EST daily"
  schedule_expression = "cron(0 21 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ingestor_400pm_target" {
  rule = aws_cloudwatch_event_rule.ingestor_400pm.name
  arn  = aws_lambda_function.ingestor.arn
}

resource "aws_lambda_permission" "allow_400pm" {
  statement_id  = "AllowEventBridge400PM"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestor_400pm.arn
}

# --- 4c. Schedule: 9:00 PM EST = 02:00 UTC (next day) ---
resource "aws_cloudwatch_event_rule" "ingestor_900pm" {
  name                = "${var.project_name}-ingestor-900pm"
  description         = "Triggers ingestor Lambda at 9:00 PM EST daily"
  schedule_expression = "cron(0 2 * * ? *)"
}

resource "aws_cloudwatch_event_target" "ingestor_900pm_target" {
  rule = aws_cloudwatch_event_rule.ingestor_900pm.name
  arn  = aws_lambda_function.ingestor.arn
}

resource "aws_lambda_permission" "allow_900pm" {
  statement_id  = "AllowEventBridge900PM"
  action        = "lambda:InvokeFunction"
  function_name = aws_lambda_function.ingestor.function_name
  principal     = "events.amazonaws.com"
  source_arn    = aws_cloudwatch_event_rule.ingestor_900pm.arn
}
