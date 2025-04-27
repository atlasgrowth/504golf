# One-Line Git Push Command

Copy and paste this command to push all your changes to GitHub:

```bash
git add . && git commit -m "Update from Replit $(date)" && git push https://$GITHUB_TOKEN@github.com/atlasgrowth/504golf.git HEAD:main
```

This will:
1. Add all changes
2. Commit them with a message including the current date and time
3. Push them to your GitHub repository using your GitHub token

Just copy and paste the above command into the Replit Shell.