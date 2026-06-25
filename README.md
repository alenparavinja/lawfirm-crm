# Immigration Law Firm CRM

A case management system for a small immigration law firm, built to demonstrate the full operational stack of a cloud application: a three-tier AWS architecture provisioned end to end with Terraform, hardened Linux servers, a secured self-hosted database, a containerized TypeScript API, and a React frontend.

This is a proof of concept, not a product. The goal is threefold: show the infrastructure and operations work that most application projects skip, provide a working full-stack application on top of it, and leave a clear path to production for anyone who forks it. The architecture is built with good bones rather than production hardening it does not yet need; the seams where a forker would add that hardening are documented in `docs/PRODUCTION.md`.

## What this demonstrates

The emphasis is the full cycle, not just application code: provisioning a network and servers, hardening them, installing and securing a database, deploying a containerized API behind a reverse proxy, and building a typed frontend against it, all reproducible from a clean AWS account with a single `terraform apply`.

The application itself is a real CRM with full create, read, update, and delete across its core entities, modeling an immigration practice rather than a generic contact list.

## Tech stack

Infrastructure with Terraform on AWS (us-east-1). Ubuntu 22.04 on EC2, MongoDB 7 self-hosted, Node.js with Express, Mongoose, and TypeScript for the API, Nginx as a reverse proxy, and Docker Compose to orchestrate the containers. The frontend is React with TypeScript, built with Vite, styled with Tailwind and shadcn/ui, using React Query for server state and react-hook-form with zod for forms.

- Infrastructure: Terraform, AWS (VPC, EC2, NAT Gateway, Security Groups, Secrets Manager, IAM)
- Servers: Ubuntu 22.04, hardened via user_data scripts
- Database: MongoDB 7, self-hosted with authentication enabled
- API: Node.js, Express, Mongoose, TypeScript, JWT auth, Docker Compose
- Frontend: React, TypeScript, Vite, Tailwind, shadcn/ui, React Query, react-hook-form, zod
- Reverse proxy: Nginx

## Architecture

Three EC2 instances in a custom VPC, split across a public and a private subnet. The public subnet holds a Bastion (the only server reachable from the internet) and a NAT Gateway for the private subnet's outbound access. The private subnet holds the App Server (API and Nginx in Docker) and the DB Server (MongoDB).

Access between tiers is controlled by Security Groups that reference each other by group rather than by IP, so instances can be replaced without rewriting firewall rules. The only path to the private servers is through the Bastion. The database accepts connections only from the App Server, and the application connects as a limited MongoDB user scoped to the application database, never as admin.

The design favors the production-standard pattern (private subnets, NAT egress, a Bastion) over the cheaper all-public alternative, while staying single-AZ to keep cost and complexity appropriate for a proof of concept. The reasoning behind each decision is in `ARCHITECTURE.md`.

## Security

Credentials are never stored in the repository or in Terraform variables. Terraform generates a random database password at apply time and stores it in Secrets Manager; the DB Server fetches it at boot via an IAM instance role scoped to that one secret. The application uses a separate, limited MongoDB user.

Each server is hardened on first boot through user_data scripts: SSH locked to key-only with no root login, a host firewall on top of the AWS Security Groups, brute-force protection, automatic security updates, kernel network hardening, and a legal access banner. A verification script checks every hardening item per tier and reports pass or fail, so the hardened state is provable rather than assumed.

API requests authenticate with a JWT bearer token. Sensitive ownership fields are asserted server-side from the token rather than trusted from the client; for example, a note's author is set from the authenticated user, not the request body.

## Data model

The database models an immigration practice, carrying domain-specific fields a generic CRM would not: alien registration numbers, country of origin, current immigration status, USCIS receipt numbers, priority dates, and case stages tracking an application from consultation to decision.

The core collections are clients, staff, cases, documents, notes, and tasks, using a referenced (normalized) design so the application can run cross-cutting queries such as all open cases across every client. The full schema, including reference collections defined for future use, is in `docs/DATA_MODEL.md`.

## Running the project

Requires Terraform and the AWS CLI installed and configured, and an AWS Key Pair in the target region. Copy `terraform.tfvars.example` to `terraform.tfvars` and fill in the operator IP and key pair name.

```
terraform init
terraform apply
```

Terraform outputs ready-to-use SSH commands for reaching each instance through the Bastion. After the infrastructure is up, the database install and seed scripts run on the DB Server, and the application is deployed to the App Server via Docker Compose. The full stand-up sequence, including troubleshooting for common failures, is in `docs/RUNBOOK.md`.

Because the NAT Gateway accrues cost while running, the infrastructure is designed to be torn down between work sessions with `terraform destroy` and rebuilt on demand. The database password rotates on each rebuild, fetched fresh from Secrets Manager.

## Repository layout

The Terraform configuration sits at the repository root, one file per concern (networking, security groups, EC2, secrets). The `scripts` directory holds the hardening, install, and seed scripts. The `app` directory mirrors the API source that runs on the App Server, and `frontend` holds the React application. Design decisions are in `ARCHITECTURE.md`, the data schema in `docs/DATA_MODEL.md`, the stand-up procedure in `docs/RUNBOOK.md`, and the path to production in `docs/PRODUCTION.md`.

## Path to production

This proof of concept is deliberately not production-hardened. The choices that keep it appropriately scoped (single-AZ, self-hosted database, JWT in browser storage, hard deletes, no role enforcement) are the same choices a forker would revisit to take it live. Rather than build that hardening prematurely, the project documents where each piece plugs in. `docs/PRODUCTION.md` lays out the path: centralized authentication, role-based access control, audit logging, soft deletes, secure token handling, a managed multi-AZ database, and observability.

## License

This is a proof of concept and is not licensed for production use.
