import { NextResponse } from 'next/server';
import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StreamableHTTPClientTransport } from '@modelcontextprotocol/sdk/client/streamableHttp.js';
import { AzureCliCredential } from '@azure/identity';

export async function POST(req: Request) {
  try {
    const { messages } = await req.json();

    const workspaceId = process.env.FABRIC_WORKSPACE_ID;
    const dataAgentId = process.env.FABRIC_DATA_AGENT_ID;
    const mcpUrl = `https://api.fabric.microsoft.com/v1/mcp/workspaces/${workspaceId}/dataagents/${dataAgentId}/agent`;
    // Authenticate via Azure CLI credentials
    const credential = new AzureCliCredential();
    const tokenResponse = await credential.getToken("https://api.fabric.microsoft.com/.default");

    // Format the entire chat history into a single context thread block
    const contextPrompt = messages
      .map((m: { role: string; content: string }) => `${m.role}: ${m.content}`)
      .join('\n');

    // Create the proper Streamable HTTP transport passing the bearer token
    const transport = new StreamableHTTPClientTransport(new URL(mcpUrl), {
      requestInit: {
        headers: {
          'Authorization': `Bearer ${tokenResponse.token}`
        }
      }
    });

    const client = new Client({ name: "web-agent", version: "1.0.0" });
    
    // Connect to the remote MCP server
    await client.connect(transport);

    // Discover the dynamically exposed tool from Fabric
    const tools = await client.listTools();
    if (!tools.tools || tools.tools.length === 0) {
      throw new Error("No tools available. Ensure your Fabric Data Agent is published.");
    }

    const tool = tools.tools[0];
    const questionArg = Object.keys(tool.inputSchema.properties)[0];

    // Execute the tool call with the accumulated chat history thread
    const result = await client.callTool({
      name: tool.name,
      arguments: { [questionArg]: contextPrompt }
    });

    const contentBlocks = Array.isArray(result.content) ? result.content : [];
    const answer = contentBlocks
      .map((block) => {
        if (
          typeof block === 'object' &&
          block !== null &&
          'type' in block &&
          block.type === 'text' &&
          'text' in block &&
          typeof block.text === 'string'
        ) {
          return block.text;
        }

        return '';
      })
      .filter(Boolean)
      .join('\n');

    await client.close();

    return NextResponse.json({ reply: answer });
  } catch (error: any) {
    console.error('MCP Client Error:', error);
    return NextResponse.json({ error: error.message || 'Unknown error occurred' }, { status: 500 });
  }
}
