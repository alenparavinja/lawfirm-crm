# Three SGs, one per tier. SG-to-SG references keep rules stable across
# instance replacements (no IP-based rules between internal tiers).

# Bastion: only reachable from operator's IP
resource "aws_security_group" "bastion" {
  name        = "lawfirm-crm-bastion-sg"
  description = "SSH ingress restricted to operator IP"
  vpc_id      = aws_vpc.main.id

  ingress {
    description = "SSH from operator IP"
    from_port   = 22
    to_port     = 22
    protocol    = "tcp"
    cidr_blocks = [var.your_ip_cidr]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "lawfirm-crm-bastion-sg" }
}

# App Server: SSH from Bastion only
resource "aws_security_group" "app_server" {
  name        = "lawfirm-crm-app-server-sg"
  description = "App tier: SSH from Bastion only"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "lawfirm-crm-app-server-sg" }
}

# DB Server: SSH from Bastion, MongoDB from App Server only
resource "aws_security_group" "db_server" {
  name        = "lawfirm-crm-db-server-sg"
  description = "DB tier: SSH from Bastion, MongoDB from App Server"
  vpc_id      = aws_vpc.main.id

  ingress {
    description     = "SSH from Bastion"
    from_port       = 22
    to_port         = 22
    protocol        = "tcp"
    security_groups = [aws_security_group.bastion.id]
  }

  ingress {
    description     = "MongoDB from App Server"
    from_port       = 27017
    to_port         = 27017
    protocol        = "tcp"
    security_groups = [aws_security_group.app_server.id]
  }

  egress {
    from_port   = 0
    to_port     = 0
    protocol    = "-1"
    cidr_blocks = ["0.0.0.0/0"]
  }

  tags = { Name = "lawfirm-crm-db-server-sg" }
}
