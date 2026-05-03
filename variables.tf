variable "aws_region" {
  description = "AWS region to deploy into"
  type        = string
  default     = "us-east-1"
}

variable "environment" {
  description = "Deployment environment (dev, staging, prod)"
  type        = string
  default     = "dev"
}

# Networking
variable "vpc_cidr" {
  description = "CIDR block for the VPC"
  type        = string
  default     = "10.0.0.0/16"
}

variable "public_subnet_cidr" {
  description = "CIDR for the public subnet (Bastion + NAT GW)"
  type        = string
  default     = "10.0.1.0/24"
}

variable "private_subnet_cidr" {
  description = "CIDR for the private subnet (App Server + DB Server)"
  type        = string
  default     = "10.0.2.0/24"
}

variable "availability_zone" {
  description = "Single AZ deployment for cost efficiency"
  type        = string
  default     = "us-east-1a"
}


# EC2
variable "bastion_instance_type" {
  description = "Instance type for the Bastion Host"
  type        = string
  default     = "t3.micro"
}

variable "app_instance_type" {
  description = "Instance type for the App Server (Node.js + Nginx)"
  type        = string
  default     = "t3.micro"
}

variable "db_instance_type" {
  description = "Instance type for the DB Server (MongoDB)"
  type        = string
  default     = "t3.micro"
}

variable "key_pair_name" {
  description = "AWS Key Pair name (must exist in the target region before apply)"
  type        = string
}

variable "your_ip_cidr" {
  description = "Operator's public IP in CIDR notation (e.g. 203.0.113.5/32). Get yours: https://checkip.amazonaws.com"
  type        = string
}
