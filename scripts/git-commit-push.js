#!/usr/bin/env node

const { execSync } = require('child_process');

// Get commit message from command line args or use a default
const commitMessage = process.argv[2] || 'Update from Replit';

console.log('🚀 Starting Git commit and push process...');

try {
  // Check git status first
  console.log('📋 Checking Git status...');
  const status = execSync('git status --porcelain').toString();
  
  if (!status) {
    console.log('✅ No changes to commit. Everything is up to date.');
    process.exit(0);
  }
  
  // Add all changes
  console.log('➕ Adding all changes...');
  execSync('git add .');
  
  // Commit changes
  console.log(`✍️  Committing with message: "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage}"`);
  
  // Push using the token from environment variable
  console.log('☁️  Pushing to GitHub...');
  
  // Use the GITHUB_TOKEN from secrets
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    console.error('❌ Error: GITHUB_TOKEN environment variable not found.');
    console.error('Make sure you have the GITHUB_TOKEN secret configured in Replit.');
    process.exit(1);
  }
  
  // Push to GitHub using a direct URL approach for 504golf repo
  execSync(`git push https://${githubToken}@github.com/atlasgrowth/504golf.git HEAD:main`);
  
  console.log('✅ Successfully pushed to GitHub!');
  console.log('🎉 All done! Your changes are now on GitHub.');
} catch (error) {
  console.error('❌ Error:', error.message);
  process.exit(1);
}