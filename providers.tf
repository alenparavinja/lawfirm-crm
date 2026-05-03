terraform {
  required_version = ">= 1.6.0"

  required_providers {
    aws = {
      source  = "hashicorp/aws"
      version = "~> 5.0"
    }
  }

  # Remote state in S3: uncomment once a state bucket exists.
  # backend "s3" {
  #   bucket         = "your-terraform-state-bucket"
  #   key            = "lawfirm-crm/terraform.tfstate"
  #   region         = "us-east-1"
  #   encrypt        = true
  #   dynamodb_table = "terraform-locks"
  # }
}

provider "aws" {
  region = var.aws_region

  default_tags {
    tags = {
      Project     = "lawfirm-crm"
      Environment = var.environment
      ManagedBy   = "terraform"
    }
  }
}
