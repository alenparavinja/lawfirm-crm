# secrets.tf
# MongoDB admin credential stored in Secrets Manager, plus the IAM instance
# role that lets the DB Server fetch it at boot. No credential is stored in
# code, Terraform variables, or local state in plaintext form.

# Random admin password generated at apply time.
resource "random_password" "mongo_admin" {
  length  = 32
  special = true
  # Exclude characters that complicate shell quoting in the install script.
  override_special = "!#%*-_=+"
}

# The secret container in Secrets Manager.
resource "aws_secretsmanager_secret" "mongo_admin" {
  name                    = "lawfirm-crm/mongo-admin"
  description             = "MongoDB admin credentials for the DB Server"
  recovery_window_in_days = 0 # Allow immediate delete/recreate during dev cycles.
}

# The secret value: a JSON blob with username and password.
resource "aws_secretsmanager_secret_version" "mongo_admin" {
  secret_id = aws_secretsmanager_secret.mongo_admin.id
  secret_string = jsonencode({
    username = "admin"
    password = random_password.mongo_admin.result
  })
}

# Trust policy: allows EC2 instances to assume this role.
data "aws_iam_policy_document" "ec2_assume" {
  statement {
    actions = ["sts:AssumeRole"]
    principals {
      type        = "Service"
      identifiers = ["ec2.amazonaws.com"]
    }
  }
}

# The role itself.
resource "aws_iam_role" "db_server" {
  name               = "lawfirm-crm-db-server-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

# Permission policy: read access to the one Mongo secret and nothing else.
data "aws_iam_policy_document" "read_mongo_secret" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.mongo_admin.arn]
  }
}

resource "aws_iam_role_policy" "db_server_read_secret" {
  name   = "read-mongo-secret"
  role   = aws_iam_role.db_server.id
  policy = data.aws_iam_policy_document.read_mongo_secret.json
}

# Instance profile wraps the role so EC2 can consume it.
resource "aws_iam_instance_profile" "db_server" {
  name = "lawfirm-crm-db-server-profile"
  role = aws_iam_role.db_server.name
}
