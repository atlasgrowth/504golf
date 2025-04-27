#!/bin/bash
# Simple script to commit and push to GitHub
# Usage: ./push.sh "Your commit message here"

# Use the CommonJS version which works regardless of package.json settings
node scripts/git-push.cjs "$1"