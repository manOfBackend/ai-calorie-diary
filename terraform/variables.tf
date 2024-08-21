variable "aws_region" {
  description = "AWS region where the S3 bucket is located"
  type        = string
  default     = "ap-northeast-2"
}

variable "bucket_name" {
  description = "Name of the existing S3 bucket"
  type        = string
  default     = "calda-bucket"
}