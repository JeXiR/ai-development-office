terraform {
  backend "s3" {
    bucket         = "REPLACE_WITH_STATE_BUCKET"
    key            = "REPLACE_WITH_ENV/terraform.tfstate"
    region         = "eu-central-1"
    dynamodb_table = "REPLACE_WITH_LOCK_TABLE"
    encrypt        = true
  }
}
