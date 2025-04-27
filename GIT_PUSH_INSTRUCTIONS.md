# GitHub Push Instructions

This document explains how to push changes from Replit to your GitHub repository.

## Quick Usage

To commit and push all changes to GitHub, run:

```bash
./push.sh "Your commit message here"
```

If you don't provide a commit message, it will use the default message "Update from Replit".

## Alternative Methods

If the shell script doesn't work for any reason, you can try the direct Node.js approach:

```bash
node scripts/git-push.cjs "Your commit message here"
```

## What These Scripts Do

1. Check if there are any changes to commit
2. Add all changes (`git add .`)
3. Commit the changes with your message
4. Push to your GitHub repository (atlasgrowth/504golf)

## Troubleshooting

If you encounter any errors:

1. Make sure your GITHUB_TOKEN secret is set correctly in Replit
2. Check that your repository URL is correct in the script
3. Ensure you have the necessary permissions to push to the repository

## Advanced Usage

You can modify `scripts/git-push.cjs` if you need to change:

- The target repository
- The branch to push to (currently set to 'main')
- Any other git configurations

## Security Note

The script uses your GITHUB_TOKEN environment variable to authenticate with GitHub. This token is stored securely in Replit's secrets.