# ec2.tf
# Bastion (public) + App Server + DB Server (both private).
# Hardening scripts in ./scripts/ are concatenated and passed via user_data.
# user_data only runs on first boot, so changing the scripts forces a
# replace on next apply (Terraform's default for user_data changes).

data "aws_ami" "ubuntu_22_04" {
  most_recent = true
  owners      = ["099720109477"] # Canonical

  filter {
    name   = "name"
    values = ["ubuntu/images/hvm-ssd/ubuntu-jammy-22.04-amd64-server-*"]
  }

  filter {
    name   = "virtualization-type"
    values = ["hvm"]
  }
}

# Shared hardening baseline. Read once and reused across all three instances.
locals {
  common_script = file("${path.module}/scripts/common.sh")
}

# Bastion
resource "aws_instance" "bastion" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.bastion_instance_type
  subnet_id                   = aws_subnet.public.id
  key_name                    = var.key_pair_name
  vpc_security_group_ids      = [aws_security_group.bastion.id]
  associate_public_ip_address = true

  user_data = "${local.common_script}\n${file("${path.module}/scripts/bastion-extras.sh")}"

  root_block_device {
    volume_size           = 8
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = "lawfirm-crm-bastion" }
}

# App Server (Node.js + Nginx)
resource "aws_instance" "app_server" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.app_instance_type
  subnet_id                   = aws_subnet.private.id
  key_name                    = var.key_pair_name
  vpc_security_group_ids      = [aws_security_group.app_server.id]
  associate_public_ip_address = false

  iam_instance_profile        = aws_iam_instance_profile.app_server.name

  user_data = "${local.common_script}\n${file("${path.module}/scripts/app-extras.sh")}"

  root_block_device {
    volume_size           = 10
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = "lawfirm-crm-app-server" }
}

# DB Server (MongoDB)
# Larger root volume to accommodate database growth.
resource "aws_instance" "db_server" {
  ami                         = data.aws_ami.ubuntu_22_04.id
  instance_type               = var.db_instance_type
  subnet_id                   = aws_subnet.private.id
  key_name                    = var.key_pair_name
  vpc_security_group_ids      = [aws_security_group.db_server.id]
  associate_public_ip_address = false

  # Instance profile grants read access to the Mongo admin secret only.
  iam_instance_profile = aws_iam_instance_profile.db_server.name

  user_data = "${local.common_script}\n${file("${path.module}/scripts/db-extras.sh")}"

  root_block_device {
    volume_size           = 20
    volume_type           = "gp3"
    encrypted             = true
    delete_on_termination = true
  }

  tags = { Name = "lawfirm-crm-db-server" }
}
