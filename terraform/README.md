# Sound Connect - Terraform Infrastructure

This directory contains Terraform configuration for managing Sound Connect's Cloudflare infrastructure.

## Resources Managed

- **D1 Database**: `sound-connect-db` - Shared SQL database for API and queue consumer
- **R2 Bucket**: `users-bucket` - Object storage for user media
- **Queues**:
    - `posts-queue` - Main queue for post processing
    - `posts-queue-dlq` - Dead letter queue for failed messages
- **Durable Objects Namespaces**:
    - `ChatDurableObject` - Real-time chat functionality
    - `UserDurableObject` - User-specific stateful objects

## Architecture

This Terraform configuration manages the infrastructure layer. Worker deployments are handled separately via Wrangler:

- **Terraform** → Infrastructure resources (databases, storage, queues, DO namespaces)
- **Wrangler** → Worker code deployments (`apps/api`, `apps/web`, `apps/posts-queue-consumer`)

## Prerequisites

1. [Terraform](https://www.terraform.io/downloads) >= 1.0
2. Cloudflare account with appropriate permissions
3. Cloudflare API token with the following permissions:
    - Account.Workers Scripts:Edit
    - Account.Workers KV Storage:Edit
    - Account.D1:Edit
    - Account.Workers R2 Storage:Edit
    - Account.Workers Tail:Read

## Setup

### 1. Get Your Cloudflare Account ID

```bash
curl -X GET "https://api.cloudflare.com/client/v4/accounts" \
  -H "Authorization: Bearer YOUR_API_TOKEN" \
  -H "Content-Type: application/json"
```

### 2. Create terraform.tfvars

```bash
cd terraform
cp terraform.tfvars.example terraform.tfvars
```

Edit `terraform.tfvars`:

```hcl
cloudflare_api_token  = "your-api-token-here"
cloudflare_account_id = "your-account-id-here"
```

### 3. Initialize Terraform

```bash
terraform init
```

### 4. Import Existing Resources (if they exist)

If you already have these resources created via Wrangler, import them:

```bash
terraform import cloudflare_d1_database.sound_connect_db <account_id>/<database_id>
terraform import cloudflare_r2_bucket.users_bucket <account_id>/users-bucket
terraform import cloudflare_queue.posts_queue <account_id>/posts-queue
terraform import cloudflare_queue.posts_queue_dlq <account_id>/posts-queue-dlq
terraform import cloudflare_workers_durable_object_namespace.chat_do <account_id>/<namespace_id>
terraform import cloudflare_workers_durable_object_namespace.user_do <account_id>/<namespace_id>
```

Replace `<account_id>`, `<database_id>`, and `<namespace_id>` with your actual values.

To find your resource IDs:

```bash
npx wrangler d1 list
npx wrangler r2 bucket list
wrangler queues list
```

### 5. Plan and Apply

```bash
terraform plan
terraform apply
```

## Workflow

### Creating New Infrastructure

1. Modify Terraform files to add/update resources
2. Run `terraform plan` to review changes
3. Run `terraform apply` to create resources
4. Update `wrangler.jsonc` files with new resource IDs from Terraform outputs
5. Deploy workers via Wrangler

### Updating Worker Code

Workers are deployed using Wrangler, not Terraform:

```bash
cd apps/api && pnpm run deploy
cd apps/web && pnpm run deploy
cd apps/posts-queue-consumer && pnpm run deploy
```

## Outputs

After applying, Terraform will output important resource IDs:

```bash
terraform output
```

Use these IDs to update your `wrangler.jsonc` files.

## State Management

**Important**: This configuration uses local state. For production, consider using remote state:

```hcl
terraform {
  backend "s3" {
  }
}
```

Or Terraform Cloud for better collaboration.

## Common Commands

```bash
terraform init          # Initialize Terraform
terraform plan          # Preview changes
terraform apply         # Apply changes
terraform destroy       # Destroy all resources (use with caution!)
terraform output        # Show all outputs
terraform state list    # List all resources in state
terraform fmt           # Format .tf files
terraform validate      # Validate configuration
```

## Notes

- Keep your `terraform.tfvars` secure and never commit it to version control
- The `.gitignore` file is configured to exclude sensitive files
- Worker scripts deployment is intentionally left to Wrangler for better development experience
- Database migrations should be run via Wrangler: `wrangler d1 migrations apply`

## Troubleshooting

### Resource Already Exists

If you get errors about resources already existing, you need to import them first (see step 4 above).

### API Token Permissions

Ensure your API token has all required permissions. You can verify this in the Cloudflare dashboard.

### State Lock Issues

If Terraform state is locked, you may need to force unlock:

```bash
terraform force-unlock <lock_id>
```

## Resources

- [Cloudflare Terraform Provider](https://registry.terraform.io/providers/cloudflare/cloudflare/latest/docs)
- [Cloudflare Workers Documentation](https://developers.cloudflare.com/workers/)
- [Wrangler Documentation](https://developers.cloudflare.com/workers/wrangler/)
