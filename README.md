# Web Agent

A Next.js chat interface for a Microsoft Fabric Data Agent, using the MCP endpoint.

## Setup

1. Install dependencies with `npm install`.
2. Create `.env.local` with:

   ```env
   FABRIC_WORKSPACE_ID=your-workspace-id
   FABRIC_DATA_AGENT_ID=your-data-agent-id
   ```

3. Authenticate Azure CLI with `az login`.
4. Run the app with `npm run dev`.

The chat retains context while the page remains open by sending the current message history with each request. It does not yet persist history after a page refresh.

