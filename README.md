# Immigration Law Firm CRM

A proof of concept case management system for a small immigration law firm, built as a full three-tier application on AWS and provisioned end to end with Terraform. The project demonstrates infrastructure as code, Linux server hardening, a secured MongoDB backend, a TypeScript REST API, and a React frontend, with credentials managed through AWS Secrets Manager and IAM instance roles.

The emphasis throughout is on the full operational cycle rather than just application code: provisioning the network and servers, hardening them, installing and securing the database, and deploying a containerized API, all reproducible from a clean AWS account with a single `terraform apply`.

## Tech stack

Infrastructure is managed with Terraform targeting AWS in the us-east-1 region. The runtime is Ubuntu 22.04 on EC2, MongoDB 7 for the database, Node.js with Express and Mongoose for the API, Nginx as a reverse proxy, and Docker Compose to orchestrate the application containers. The frontend is React with TypeScript, built with Vite and styled with Tailwind and shadcn/ui.

- Infrastructure: Terraform, AWS (VPC, EC2, NAT Gateway, Security Groups, Secrets Manager, IAM)
- Servers: Ubuntu 22.04, hardened via user_data scripts
- Database: MongoDB 7, self-hosted with authentication enabled
- API: Node.js, Express, Mongoose, TypeScript, JWT auth, Docker Compose
- Frontend: React, TypeScript, Vite, Tailwind, shadcn/ui, React Query, React Router
- Reverse proxy: Nginx

## Architecture

The system runs on three EC2 instances inside a custom VPC, split across a public and a private subnet. The public subnet holds a Bastion host, which is the only server reachable from the internet, and a NAT Gateway that provides outbound access for the private subnet. The private subnet holds the App Server, which runs the API and Nginx in Docker containers, and the DB Server, which runs MongoDB.

Access between tiers is controlled by Security Groups that reference each other by group rather than by IP address, so instances can be replaced without rewriting firewall rules. The only path to the private servers is by connecting through the Bastion. The database accepts connections only from the App Server, and the application connects as a limited MongoDB user scoped to the application database, never as the admin user.

The design favors the production-standard pattern (private subnets, NAT egress, a Bastion for access) over the cheaper alternative of placing everything in a public subnet, while staying within a single Availability Zone to keep cost and complexity appropriate for a proof of concept. The reasoning behind each architectural decision is documented in `ARCHITECTURE.md`.

## Security

Credentials are never stored in the repository or in Terraform variables. Terraform generates a random database password at apply time and stores it in AWS Secrets Manager. The DB Server fetches it at boot using an IAM instance role scoped to read that one secret and nothing else. The application connects using a separate, limited MongoDB user.

Each server is hardened on first boot through user_data scripts that lock down SSH (key-only authentication, no root login), enable a host firewall in addition to the AWS Security Groups, install brute-force protection and automatic security updates, apply kernel network hardening, and display a legal access banner. A verification script checks every hardening item per tier and reports pass or fail, so the hardened state is provable rather than assumed.

## Data model

The database models an immigration practice rather than a generic CRM, carrying domain-specific fields a generic system would not: alien registration numbers, country of origin, current immigration status, USCIS receipt numbers, priority dates, and case stages that track an application through its lifecycle from consultation to decision.

The core collections are clients, staff, cases, documents, notes, and tasks, using a referenced (normalized) design so the application can run cross-cutting queries such as all open cases across every client or all documents of a given type. The full schema, including the reference collections defined for future use, is documented in `docs/DATA_MODEL.md`.

## Project phases

The project was built in phases, each a self-contained piece of the stack. Phase 1 provisioned the network and servers with Terraform. Phase 2 hardened the servers. Phase 3 installed and secured MongoDB and seeded it with realistic mock data. Phase 4 built the REST API and containerized it with Docker Compose. Phase 5 built the React frontend.

## Running the project

The project assumes Terraform and the AWS CLI are installed and configured, and that an AWS Key Pair exists in the target region. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in the operator IP and key pair name.

```
terraform init
terraform apply
```

Terraform outputs ready-to-use SSH commands for reaching each instance through the Bastion. After the infrastructure is up, the database install and seed scripts run on the DB Server, and the application is deployed to the App Server via Docker Compose. The full sequence is documented in the scripts directory.

Because the NAT Gateway accrues cost while running, the infrastructure is designed to be torn down between work sessions with `terraform destroy` and rebuilt on demand. The database password rotates on each rebuild, fetched fresh from Secrets Manager.

## Repository layout

The Terraform configuration sits at the repository root, with one file per concern: networking, security groups, EC2 instances, secrets, and so on. The `scripts` directory holds the hardening, install, and seed scripts. The `app` directory mirrors the API source that runs on the App Server, and the `frontend` directory holds the React application. Design decisions are documented in `ARCHITECTURE.md` and the data schema in `docs/DATA_MODEL.md`.

## Status and future work

All five phases are complete and the application runs end to end. Natural next steps, deliberately left out of scope for the proof of concept, would include deploying the frontend through a CDN, adding the reference and scheduling collections to the active application, spanning multiple Availability Zones for high availability, and replacing the Bastion with AWS Systems Manager Session Manager to remove the public SSH surface entirely.

## License

This is a proof of concept and is not licensed for production use.
