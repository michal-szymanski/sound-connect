---
allowed-tools: Bash(git status:*), Bash(git diff:*), Bash(git add:*), Bash(git commit:*)
description: Generate and create a git commit with auto-generated message
model: haiku
---

Generate a structured git commit message and create the commit.

Steps:
1. Run `git status` to see staged and unstaged changes
2. Run `git diff --cached` to see staged changes (if any)
3. Run `git diff` to see unstaged changes
4. If there are unstaged changes the user likely wants to commit, stage them with `git add`
5. Analyze the changes and generate a concise commit message

Commit message guidelines:
- One short sentence (max 72 characters for the subject line)
- Use imperative mood (e.g., "Add", "Fix", "Update", "Remove", "Refactor")
- Summarize WHAT changed, not HOW
- Be specific but concise
- No period at the end

Examples of good commit messages:
- "Add user authentication with Better Auth"
- "Fix profile image upload validation"
- "Update notification queue consumer error handling"
- "Remove deprecated API endpoints"
- "Refactor chat component to use WebSocket hook"

After generating the message, create the commit using:
```
git commit -m "your generated message"
```

Do NOT include any emoji, co-author tags, or "Generated with Claude" footer - keep it simple and professional.
