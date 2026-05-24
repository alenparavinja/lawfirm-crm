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

# Instance profile wraps the role so EC2 can consume it.
resource "aws_iam_instance_profile" "db_server" {
  name = "lawfirm-crm-db-server-profile"
  role = aws_iam_role.db_server.name
}

# ---- Mongo app user credential ----
# Separate secret from the admin credential. The app server reads this at
# runtime; the DB Server reads it once during user bootstrap.

resource "random_password" "mongo_app" {
  length           = 32
  special          = true
  override_special = "!#%*-_=+"
}

resource "aws_secretsmanager_secret" "mongo_app" {
  name                    = "lawfirm-crm/mongo-app"
  description             = "MongoDB app user credentials for the Node.js backend"
  recovery_window_in_days = 0
}

resource "aws_secretsmanager_secret_version" "mongo_app" {
  secret_id = aws_secretsmanager_secret.mongo_app.id
  secret_string = jsonencode({
    username = "appuser"
    password = random_password.mongo_app.result
  })
}

# ---- App Server IAM role ----
# Scoped to GetSecretValue on the app secret only. The app server has no
# reason to read the admin credential.

data "aws_iam_policy_document" "read_app_secret" {
  statement {
    actions   = ["secretsmanager:GetSecretValue"]
    resources = [aws_secretsmanager_secret.mongo_app.arn]
  }
}

resource "aws_iam_role" "app_server" {
  name               = "lawfirm-crm-app-server-role"
  assume_role_policy = data.aws_iam_policy_document.ec2_assume.json
}

resource "aws_iam_role_policy" "app_server_read_secret" {
  name   = "read-app-secret"
  role   = aws_iam_role.app_server.id
  policy = data.aws_iam_policy_document.read_app_secret.json
}

resource "aws_iam_instance_profile" "app_server" {
  name = "lawfirm-crm-app-server-profile"
  role = aws_iam_role.app_server.name
}

# DB Server policy updated to cover both secrets - the admin secret for its
# own bootstrap and the app secret to set the app user password during install.
data "aws_iam_policy_document" "read_mongo_secrets" {
  statement {
    actions = ["secretsmanager:GetSecretValue"]
    resources = [
      aws_secretsmanager_secret.mongo_admin.arn,
      aws_secretsmanager_secret.mongo_app.arn,
    ]
  }
}

resource "aws_iam_role_policy" "db_server_read_secrets" {
  name   = "read-mongo-secrets"
  role   = aws_iam_role.db_server.id
  policy = data.aws_iam_policy_document.read_mongo_secrets.json
}