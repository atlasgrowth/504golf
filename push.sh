#!/bin/bash
# Simple script to commit and push to GitHub
# Usage: ./push.sh "Your commit message here"

# Use node with explicit module support
node --input-type=module scripts/git-commit-push.js "$1"