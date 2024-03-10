provider "aws" {
  region = "us-east-2"
}

resource "aws_dynamodb_table" "audio_data_db" {
  name           = "audio_data_db"
  billing_mode   = "PROVISIONED"
  read_capacity  = 5
  write_capacity = 5
  hash_key       = "UserId"
  range_key      = "FileId"

  attribute {
    name = "UserId"
    type = "S"
  }

  attribute {
    name = "FileId"
    type = "S"
  }


  attribute {
    name = "Product"
    type = "S"
  }

  ttl {
    attribute_name = "TimeToExist"
    enabled        = false
  }

  global_secondary_index {
    name               = "Product-index"
    hash_key           = "Product"
    range_key          = "UserId"
    write_capacity     = 5
    read_capacity      = 5
    projection_type    = "INCLUDE"
    non_key_attributes = ["Product", "FileId", "UserId", "Tags", "Description"]
  }
}

resource "aws_iam_role" "metadata_crud_role" {
  name = "dynamodb_role"

  assume_role_policy = <<POLICY
{
  "Version": "2012-10-17",
  "Statement": [
    {
      "Action": "sts:AssumeRole",
      "Principal": {
        "Service": "lambda.amazonaws.com"
      },
      "Effect": "Allow",
      "Sid": ""
    }
  ]
}
POLICY
}

resource "aws_iam_policy_attachment" "metadata_crud_policy" {
  name       = "dynamodb_policy"
  roles      = [aws_iam_role.metadata_crud_role.name]
  policy_arn = "arn:aws:iam::aws:policy/AmazonDynamoDBFullAccess"
}

data "archive_file" "lambda_zip" {
  type        = "zip"
  source_file = "${path.module}/../lambdas/metadata_crud.js"
  output_path = "${path.module}/metadata_crud.zip"
}

resource "aws_lambda_function" "metadata_crud_lambda" {
  function_name = "metadata_crud_lambda"
  handler       = "metadata_crud.handler"
  runtime       = "nodejs18.x"
  role          = aws_iam_role.metadata_crud_role.arn
  filename      = "metadata_crud.zip"
  //source_code_hash = filebase64sha256("metadata_crud.zip")
  publish = true
}

