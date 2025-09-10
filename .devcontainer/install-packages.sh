#!/bin/bash

# Install global packages for development
# This script installs CLI tools that should be available system-wide

set -e  # Exit on any error

echo "🚀 Installing global development packages..."

# Claude Code CLI
echo "📦 Installing Claude Code CLI..."
npm install -g @anthropic-ai/claude-code


echo "✅ Global packages installed successfully!"
echo ""
echo "Installed packages:"
echo "  - @anthropic-ai/claude-code"
echo ""
echo "You can now use 'claude' command globally."
