# This resource runs the 'pnpm build' command on your local machine
resource "null_resource" "build_processor" {
  triggers = {
    # This creates a unique SHA256 hash based on the content of your source files
    code_hash = sha256(join("", [for f in fileset("${path.module}/../apps/processor/src", "**") : filebase64("${path.module}/../apps/processor/src/${f}")]))
  }

  provisioner "local-exec" {
    command = "cd ${path.module}/../apps/processor && pnpm run build"
  }
}

# --- Zip processor ingestor stuff up ---
data "archive_file" "processor_zip" {
  type        = "zip"
  source_dir  = "${path.module}/../apps/processor/dist"
  output_path = "${path.module}/dist/processor.zip"
  
  # This makes sure the zip updates when your code changes
  depends_on = [null_resource.build_processor] 
}

# --- 1. IAM Role for the Lambda ---
resource "aws_iam_role" "processor_role" {
  name = "${var.project_name}-processor-role"

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

# --- 2. SQS Permissions for the Lambda ---
resource "aws_iam_policy" "lambda_sqs_policy" {
  name        = "${var.project_name}-lambda-sqs-policy"
  description = "Allows Lambda to read from SQS"

  policy = jsonencode({
    Version = "2012-10-17"
    Statement = [
      {
        Effect   = "Allow"
        Action   = [
          "sqs:ReceiveMessage",
          "sqs:DeleteMessage",
          "sqs:GetQueueAttributes"
        ]
        Resource = aws_sqs_queue.news_queue.arn
      },
      {
        Effect   = "Allow"
        Action   = [
          "logs:CreateLogGroup",
          "logs:CreateLogStream",
          "logs:PutLogEvents"
        ]
        Resource = "arn:aws:logs:*:*:*"
      }
    ]
  })
}

resource "aws_iam_role_policy_attachment" "sqs_attach" {
  role       = aws_iam_role.processor_role.name
  policy_arn = aws_iam_policy.lambda_sqs_policy.arn
}

# --- 3. The Lambda Function Definition ---
resource "aws_lambda_function" "processor" {
  function_name = "${var.project_name}-processor"
  role          = aws_iam_role.processor_role.arn
  handler       = "index.handler"
  runtime       = "nodejs22.x"

  # Memory and Timeout
  memory_size = 128
  timeout     = 10
  filename         = data.archive_file.processor_zip.output_path
  source_code_hash = data.archive_file.processor_zip.output_base64sha256
  reserved_concurrent_executions = 1
}

# --- 4. THE GLUE (Event Source Mapping) ---
resource "aws_lambda_event_source_mapping" "sqs_to_lambda" {
  event_source_arn = aws_sqs_queue.news_queue.arn
  function_name    = aws_lambda_function.processor.arn
  batch_size       = 100 # Process up to 100 articles at once to save money
  maximum_batching_window_in_seconds = 5
}