#!/bin/bash

echo "🤖 ChatGPT MCP Server Setup"
echo "=========================="

# Kontrollera om OpenAI API-nyckel är satt
if [ -z "$OPENAI_API_KEY" ]; then
    echo "⚠️  OPENAI_API_KEY environment variable is not set!"
    echo ""
    echo "Please set your OpenAI API key:"
    echo "export OPENAI_API_KEY='your-api-key-here'"
    echo ""
    echo "Add this to your ~/.zshrc or ~/.bashrc to make it permanent:"
    echo "echo 'export OPENAI_API_KEY=\"your-api-key-here\"' >> ~/.zshrc"
    echo ""
    exit 1
fi

# Testa servern
echo "🧪 Testing ChatGPT MCP Server..."
node index.js &
SERVER_PID=$!
sleep 2

if ps -p $SERVER_PID > /dev/null; then
    echo "✅ Server is running!"
    kill $SERVER_PID
else
    echo "❌ Server failed to start"
    exit 1
fi

echo ""
echo "🎉 Setup complete!"
echo ""
echo "To use the ChatGPT MCP Server:"
echo "1. Add this to your MCP client configuration:"
echo ""
cat mcp-config.json
echo ""
echo "2. Available tools:"
echo "   - ask_chatgpt: Ask ChatGPT any question"
echo "   - code_review: Get code reviewed by ChatGPT"
echo "   - generate_docs: Generate documentation"
echo "   - explain_error: Get help with errors"
echo ""
echo "3. Example usage in Claude Desktop:"
echo "   Add the mcpServers config to ~/Library/Application Support/Claude/claude_desktop_config.json"
