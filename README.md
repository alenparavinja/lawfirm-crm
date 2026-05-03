# Law Firm CRM

A proof of concept CRM for a small law firm, built on AWS with a three-tier architecture and provisioned end-to-end with Terraform. The application stack will be Node.js and Express on the backend, MongoDB for the database, and React with TypeScript and Redux on the frontend.

## Status

Work in progress. Phase 1 (infrastructure) is complete. See `ARCHITECTURE.md` for the design decisions and reasoning behind the AWS setup.

## Tech stack

Infrastructure is managed with Terraform targeting AWS in `us-east-1`. The runtime stack is Ubuntu 22.04 on EC2, MongoDB 7, Node.js with Express, Nginx as a reverse proxy, and a React + TypeScript + Redux frontend.

## Repository layout

The Terraform configuration sits at the project root. Each `.tf` file is scoped to one concern: networking, security groups, EC2 instances, and so on. The architecture document explains the major decisions in plain language.

## Running locally

The project assumes Terraform and the AWS CLI are installed and an AWS Key Pair has been created in the target region. Copy `terraform.tfvars.example` to `terraform.tfvars`, fill in the operator IP and key pair name, then run `terraform init` followed by `terraform apply`. The outputs include ready-to-use SSH commands for reaching each instance through the Bastion. Run `terraform destroy` when finished to avoid the NAT Gateway cost.

## License

This is a proof of concept and is not licensed for production use.
