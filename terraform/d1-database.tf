resource "cloudflare_d1_database" "sound_connect_db" {
  account_id = var.cloudflare_account_id
  name       = "${var.project_name}-db"
}
