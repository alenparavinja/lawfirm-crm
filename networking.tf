# VPC
resource "aws_vpc" "main" {
  cidr_block = var.vpc_cidr

  # DNS hostnames required for any managed service we may add later (RDS, EFS).
  enable_dns_hostnames = true
  enable_dns_support   = true

  tags = { Name = "lawfirm-crm-vpc" }
}


# Internet Gateway
resource "aws_internet_gateway" "main" {
  vpc_id = aws_vpc.main.id
  tags   = { Name = "lawfirm-crm-igw" }
}

# Public subnet: Bastion + NAT Gateway
resource "aws_subnet" "public" {
  vpc_id                  = aws_vpc.main.id
  cidr_block              = var.public_subnet_cidr
  availability_zone       = var.availability_zone
  map_public_ip_on_launch = true

  tags = { Name = "lawfirm-crm-public-subnet" }
}

# Private subnet: App Server + DB Server
# Tier isolation handled by Security Groups, not subnets.
resource "aws_subnet" "private" {
  vpc_id            = aws_vpc.main.id
  cidr_block        = var.private_subnet_cidr
  availability_zone = var.availability_zone

  tags = { Name = "lawfirm-crm-private-subnet" }
}


# NAT Gateway (in public subnet) for private-subnet egress
resource "aws_eip" "nat" {
  domain = "vpc"
  tags   = { Name = "lawfirm-crm-nat-eip" }

  depends_on = [aws_internet_gateway.main]
}

resource "aws_nat_gateway" "main" {
  allocation_id = aws_eip.nat.id
  subnet_id     = aws_subnet.public.id
  tags          = { Name = "lawfirm-crm-nat-gw" }

  depends_on = [aws_internet_gateway.main]
}

# Route tables
resource "aws_route_table" "public" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block = "0.0.0.0/0"
    gateway_id = aws_internet_gateway.main.id
  }

  tags = { Name = "lawfirm-crm-public-rt" }
}

resource "aws_route_table_association" "public" {
  subnet_id      = aws_subnet.public.id
  route_table_id = aws_route_table.public.id
}

resource "aws_route_table" "private" {
  vpc_id = aws_vpc.main.id

  route {
    cidr_block     = "0.0.0.0/0"
    nat_gateway_id = aws_nat_gateway.main.id
  }

  tags = { Name = "lawfirm-crm-private-rt" }
}

resource "aws_route_table_association" "private" {
  subnet_id      = aws_subnet.private.id
  route_table_id = aws_route_table.private.id
}
