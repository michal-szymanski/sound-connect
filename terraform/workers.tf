# resource "cloudflare_workers_durable_object_namespace" "chat_do" {
#   account_id = var.cloudflare_account_id
#   name       = "ChatDurableObject"
#   script_name = "${var.project_name}-api"
# }

# resource "cloudflare_workers_durable_object_namespace" "user_do" {
#   account_id = var.cloudflare_account_id
#   name       = "UserDurableObject"
#   script_name = "${var.project_name}-api"
# }
