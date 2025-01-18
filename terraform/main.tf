provider "aws" {
  region = var.aws_region
}

resource "aws_s3_bucket" "existing_bucket" {
  bucket = var.bucket_name

  force_destroy = false

  tags = {
    Name        = var.bucket_name
    Environment = "Production"
    ManagedBy   = "Terraform"
  }
}

resource "aws_s3_bucket_public_access_block" "existing_bucket" {
  bucket = aws_s3_bucket.existing_bucket.id

  block_public_acls       = true
  block_public_policy     = true
  ignore_public_acls      = true
  restrict_public_buckets = true
}

# 버킷 버저닝 설정. 필요에 따라 조정하세요.
resource "aws_s3_bucket_versioning" "existing_bucket" {
  bucket = aws_s3_bucket.existing_bucket.id
  versioning_configuration {
    status = "Enabled"
  }
}