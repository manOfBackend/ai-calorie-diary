output "bucket_name" {
  description = "Name of the S3 bucket"
  value       = aws_s3_bucket.existing_bucket.id
}

output "bucket_arn" {
  description = "ARN of the S3 bucket"
  value       = aws_s3_bucket.existing_bucket.arn
}