output "vpc_id" {
  value = aws_vpc.main.id
}

output "subnet_id" {
  value = aws_subnet.public.id
}

output "internet_gateway_id" {
  value = aws_internet_gateway.igw.id
}

output "route_table_id" {
  value = aws_route_table.public.id
}

output "security_group_id" {
  value = aws_security_group.backend_sg.id
}

output "ec2_instance_id" {
  description = "EC2 instance ID"
  value       = aws_instance.backend.id
}

output "ec2_public_ip" {
  description = "EC2 public IP address"
  value       = aws_instance.backend.public_ip
}

output "ec2_public_dns" {
  description = "EC2 public DNS"
  value       = aws_instance.backend.public_dns
}