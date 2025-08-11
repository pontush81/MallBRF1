#!/usr/bin/env node

import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import {
  CallToolRequestSchema,
  ListToolsRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import OpenAI from 'openai';

// Skapa OpenAI-klient
const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

// Skapa MCP-server
const server = new Server(
  {
    name: 'chatgpt-mcp-server',
    version: '1.0.0',
  },
  {
    capabilities: {
      tools: {},
    },
  }
);

// Lista tillgängliga verktyg
server.setRequestHandler(ListToolsRequestSchema, async () => {
  return {
    tools: [
      {
        name: 'ask_chatgpt',
        description: 'Ask ChatGPT a question and get a response',
        inputSchema: {
          type: 'object',
          properties: {
            prompt: {
              type: 'string',
              description: 'The question or prompt to send to ChatGPT',
            },
            model: {
              type: 'string',
              description: 'OpenAI model to use (default: gpt-4)',
              default: 'gpt-4',
            },
            temperature: {
              type: 'number',
              description: 'Temperature for response creativity (0-1)',
              default: 0.7,
            },
          },
          required: ['prompt'],
        },
      },
      {
        name: 'code_review',
        description: 'Get ChatGPT to review code and provide feedback',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to review',
            },
            language: {
              type: 'string',
              description: 'Programming language (e.g., typescript, javascript, python)',
            },
            focus: {
              type: 'string',
              description: 'What to focus on (e.g., performance, security, best practices)',
              default: 'best practices',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'generate_docs',
        description: 'Generate documentation for code',
        inputSchema: {
          type: 'object',
          properties: {
            code: {
              type: 'string',
              description: 'The code to document',
            },
            type: {
              type: 'string',
              description: 'Documentation type (jsdoc, readme, api)',
              default: 'jsdoc',
            },
          },
          required: ['code'],
        },
      },
      {
        name: 'explain_error',
        description: 'Get ChatGPT to explain an error and suggest solutions',
        inputSchema: {
          type: 'object',
          properties: {
            error: {
              type: 'string',
              description: 'The error message or stack trace',
            },
            context: {
              type: 'string',
              description: 'Additional context about when the error occurred',
            },
          },
          required: ['error'],
        },
      },
    ],
  };
});

// Hantera verktygsanrop
server.setRequestHandler(CallToolRequestSchema, async (request) => {
  const { name, arguments: args } = request.params;

  try {
    switch (name) {
      case 'ask_chatgpt': {
        const response = await openai.chat.completions.create({
          model: args.model || 'gpt-4',
          messages: [
            {
              role: 'user',
              content: args.prompt,
            },
          ],
          temperature: args.temperature || 0.7,
        });

        return {
          content: [
            {
              type: 'text',
              text: response.choices[0].message.content,
            },
          ],
        };
      }

      case 'code_review': {
        const prompt = `Please review this ${args.language || 'code'} and provide feedback focusing on ${args.focus || 'best practices'}:

\`\`\`${args.language || ''}
${args.code}
\`\`\`

Please provide:
1. Overall assessment
2. Specific issues found
3. Suggestions for improvement
4. Best practices recommendations`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are an expert code reviewer. Provide constructive, detailed feedback on code quality, performance, security, and best practices.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        });

        return {
          content: [
            {
              type: 'text',
              text: response.choices[0].message.content,
            },
          ],
        };
      }

      case 'generate_docs': {
        const prompt = `Generate ${args.type || 'JSDoc'} documentation for this code:

\`\`\`
${args.code}
\`\`\`

Please provide comprehensive documentation including:
1. Function/class descriptions
2. Parameter descriptions
3. Return value descriptions
4. Usage examples if applicable`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a technical writer specializing in code documentation. Generate clear, comprehensive documentation.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.2,
        });

        return {
          content: [
            {
              type: 'text',
              text: response.choices[0].message.content,
            },
          ],
        };
      }

      case 'explain_error': {
        const prompt = `Please explain this error and provide solutions:

Error: ${args.error}

${args.context ? `Context: ${args.context}` : ''}

Please provide:
1. What the error means
2. Common causes
3. Step-by-step solution
4. How to prevent it in the future`;

        const response = await openai.chat.completions.create({
          model: 'gpt-4',
          messages: [
            {
              role: 'system',
              content: 'You are a debugging expert. Explain errors clearly and provide practical solutions.',
            },
            {
              role: 'user',
              content: prompt,
            },
          ],
          temperature: 0.3,
        });

        return {
          content: [
            {
              type: 'text',
              text: response.choices[0].message.content,
            },
          ],
        };
      }

      default:
        throw new Error(`Unknown tool: ${name}`);
    }
  } catch (error) {
    return {
      content: [
        {
          type: 'text',
          text: `Error: ${error.message}`,
        },
      ],
      isError: true,
    };
  }
});

// Starta servern
async function main() {
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('ChatGPT MCP Server started');
}

main().catch(console.error);
