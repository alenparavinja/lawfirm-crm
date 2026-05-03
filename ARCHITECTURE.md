# Architecture

This document explains how the law firm CRM is set up on AWS and the reasoning behind the main decisions. It is a proof of concept, so the goal is for the design to be clear and defensible rather than maximally optimized.

## Overview

The CRM runs on three EC2 instances inside a custom VPC in the `us-east-1` region. The VPC is split into a public subnet and a private subnet. The public subnet contains a Bastion host and a NAT Gateway. The private subnet contains the App Server (which will run Node.js and Nginx) and the DB Server (which will run MongoDB). The Bastion is the only server reachable from the internet, and the only way to access the private servers is by SSHing into the Bastion first and then jumping from there.

## Access model

All access is controlled by AWS Security Groups, which are tier-specific firewalls attached to each instance. Inbound SSH on the Bastion is restricted to a single CIDR block representing my home IP. The App Server and DB Server allow inbound SSH only from the Bastion's Security Group, and the DB Server allows inbound MongoDB traffic on port 27017 only from the App Server's Security Group. Outbound traffic from the private subnet flows through the NAT Gateway, which permits the private servers to reach the internet for package installs and updates without being directly reachable from it.

References between Security Groups are by SG identifier rather than by IP. This means that if any instance is replaced, its Security Group membership preserves the access it needs without manual rule updates.

## Three-tier separation

The Bastion, App Server, and DB Server are split into separate instances rather than consolidated onto one. Splitting the database from the application means that if the Node.js process exhausts memory or crashes, MongoDB continues running on its own server. The same applies in reverse, and to maintenance work generally: I can restart or replace one tier without touching the others. Keeping the Bastion separate isolates the only internet-exposed server from any application logic, which limits the blast radius if the Bastion is ever compromised.

The App Server and DB Server share a single private subnet rather than having one subnet per tier. Subnet isolation only adds value when the tiers need different routing or different egress paths, neither of which applies here. Security Groups handle tier-to-tier separation, which is sufficient for this scope.

## NAT Gateway

The NAT Gateway is the only resource in this stack that is not Free Tier eligible. It runs roughly $1 per day while active and cannot be stopped, only deleted. I kept it rather than placing the App and DB servers in the public subnet because using a private subnet with NAT egress is the production-standard pattern, and the cost is manageable as long as I run `terraform destroy` between work sessions.

## Single Availability Zone

Everything runs in `us-east-1a`. A multi-AZ deployment would mean duplicating the instances across at least two zones, adding a load balancer in front of the App Server, and replicating the database across zones. That doubles cost and complexity, which is not justified for a proof of concept with no real users. A production deployment of this CRM would absolutely span multiple AZs.

## Self-hosted MongoDB

The DB Server runs MongoDB directly on EC2 rather than using a managed service like DocumentDB or MongoDB Atlas. The point of this project is to demonstrate the full Linux administration cycle (install, secure, tune, back up, monitor), which a managed service would abstract away. In a real product I would almost certainly use a managed database.

## Instance sizing

All three instances are `t3.micro` to stay within Free Tier limits. This means each server has only 1 GB of RAM, which is tight for MongoDB. I plan to mitigate that with a 2 GB swap file on the DB Server, conservative MongoDB cache settings, and modest seed data volumes during development. If memory pressure becomes a real problem, moving the DB Server to a `t3.small` is a one-line change in `terraform.tfvars`.