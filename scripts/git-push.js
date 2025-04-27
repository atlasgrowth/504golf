
#!/usr/bin/env node

const { execSync } = require('child_process');

// Get commit message from command line args or use a default
const commitMessage = process.argv[2] || 'Update from Replit';

try {
  // Configure Git to use the token from environment variable
  console.log('Setting up Git configuration...');
  execSync('git config --global user.name "Replit User"');
  execSync('git config --global user.email "replit-user@example.com"');
  
  // Check Git status
  console.log('Checking Git status...');
  const status = execSync('git status --porcelain').toString();
  
  if (!status) {
    console.log('No changes to commit.');
    process.exit(0);
  }
  
  // Add all changes
  console.log('Adding changes...');
  execSync('git add .');
  
  // Commit changes
  console.log(`Committing with message: "${commitMessage}"`);
  execSync(`git commit -m "${commitMessage}"`);
  
  // Push using the token from environment variable
  console.log('Pushing to GitHub...');
  
  // Use the GITHUB_TOKEN from secrets
  const githubToken = process.env.GITHUB_TOKEN;
  
  if (!githubToken) {
    console.error('Error: GITHUB_TOKEN environment variable not found.');
    console.error('Make sure you have the GITHUB_TOKEN secret configured in Replit.');
    process.exit(1);
  }
  
  // Get the current remote URL
  const remoteUrl = execSync('git remote get-url origin').toString().trim();
  
  // Parse the remote URL to extract repo information
  const repoPattern = /github\.com[\/:]([^\/]+)\/([^\/\.]+)(?:\.git)?$/;
  const match = remoteUrl.match(repoPattern);
  
  if (!match) {
    console.error('Error: Could not parse GitHub repository URL.');
    console.error('Current remote URL:', remoteUrl);
    process.exit(1);
  }
  
  const [, owner, repo] = match;
  
  // Create a URL with the token included
  const tokenUrl = `https://${githubToken}@github.com/${owner}/${repo}.git`;
  
  // Push to GitHub using the token URL
  execSync(`git push ${tokenUrl}`);
  
  console.log('Successfully pushed to GitHub!');
} catch (error) {
  console.error('Error:', error.message);
  process.exit(1);
}
