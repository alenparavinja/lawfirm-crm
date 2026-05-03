output "bastion_public_ip" {
  description = "Bastion public IP"
  value       = aws_instance.bastion.public_ip
}

output "app_server_private_ip" {
  description = "App Server private IP (reach via Bastion)"
  value       = aws_instance.app_server.private_ip
}

output "db_server_private_ip" {
  description = "DB Server private IP (reach via Bastion)"
  value       = aws_instance.db_server.private_ip
}

output "vpc_id" {
  value = aws_vpc.main.id
}

output "private_subnet_id" {
  value = aws_subnet.private.id
}

output "public_subnet_id" {
  value = aws_subnet.public.id
}

output "ssh_to_bastion" {
  value = "ssh -i ~/.ssh/${var.key_pair_name}.pem ubuntu@${aws_instance.bastion.public_ip}"
}

output "ssh_to_app_server" {
  value = "ssh -i ~/.ssh/${var.key_pair_name}.pem -J ubuntu@${aws_instance.bastion.public_ip} ubuntu@${aws_instance.app_server.private_ip}"
}

output "ssh_to_db_server" {
  value = "ssh -i ~/.ssh/${var.key_pair_name}.pem -J ubuntu@${aws_instance.bastion.public_ip} ubuntu@${aws_instance.db_server.private_ip}"
}
