resource "cloudflare_queue" "posts_queue_dlq" {
  account_id = var.cloudflare_account_id
  name       = "posts-queue-dlq"
}

resource "cloudflare_queue" "posts_queue" {
  account_id = var.cloudflare_account_id
  name       = "posts-queue"
}
