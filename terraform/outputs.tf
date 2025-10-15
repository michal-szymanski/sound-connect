output "d1_database_id" {
  description = "ID of the D1 database"
  value       = cloudflare_d1_database.sound_connect_db.id
}

output "d1_database_name" {
  description = "Name of the D1 database"
  value       = cloudflare_d1_database.sound_connect_db.name
}

output "r2_bucket_name" {
  description = "Name of the R2 users bucket"
  value       = cloudflare_r2_bucket.users_bucket.name
}

output "posts_queue_id" {
  description = "ID of the posts queue"
  value       = cloudflare_queue.posts_queue.id
}

output "posts_queue_dlq_id" {
  description = "ID of the posts dead letter queue"
  value       = cloudflare_queue.posts_queue_dlq.id
}

# output "chat_do_namespace_id" {
#   description = "ID of the ChatDurableObject namespace"
#   value       = cloudflare_workers_durable_object_namespace.chat_do.id
# }

# output "user_do_namespace_id" {
#   description = "ID of the UserDurableObject namespace"
#   value       = cloudflare_workers_durable_object_namespace.user_do.id
# }
