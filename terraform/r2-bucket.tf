resource "cloudflare_r2_bucket" "users_bucket" {
  account_id = var.cloudflare_account_id
  name       = "users-bucket"
  location   = "auto"
}
