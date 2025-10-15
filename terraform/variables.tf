variable "cloudflare_account_id" {
  description = "Cloudflare account ID"
  type        = string
}

variable "api_url" {
  description = "API URL for the sound-connect-api worker"
  type        = string
  default     = "https://sound-connect-api.michal-szymanski92.workers.dev"
}

variable "client_url" {
  description = "Client URL for the sound-connect-web worker"
  type        = string
  default     = "https://sound-connect-web.michal-szymanski92.workers.dev"
}

variable "project_name" {
  description = "Project name prefix for resources"
  type        = string
  default     = "sound-connect"
}
