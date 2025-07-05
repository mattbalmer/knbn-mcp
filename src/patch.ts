import {
  CallToolResult,
  ServerNotification,
  ServerRequest,
  ToolAnnotations
} from '@modelcontextprotocol/sdk/types.js';
import { RegisteredTool, ToolCallback } from '@modelcontextprotocol/sdk/server/mcp.js';
import { McpServer } from '@modelcontextprotocol/sdk/server/mcp.js';
import { z, ZodRawShape, ZodTypeAny } from 'zod';
import { RequestHandlerExtra } from '@modelcontextprotocol/sdk/shared/protocol.js';

type TypedCallToolResult<OutputArgs extends undefined | ZodRawShape> =
  OutputArgs extends ZodRawShape
    ? (Omit<CallToolResult, 'content'> & {
      structuredContent?: z.objectOutputType<OutputArgs, ZodTypeAny>;
      content?: never;
    })
    : CallToolResult;

type StructuredToolCallback<
  InputArgs extends undefined | ZodRawShape = undefined,
  OutputArgs extends undefined | ZodRawShape = undefined
> = InputArgs extends ZodRawShape
  ? (
    args: z.objectOutputType<InputArgs, ZodTypeAny>,
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ) =>
    | TypedCallToolResult<OutputArgs>
    | Promise<TypedCallToolResult<OutputArgs>>
  : (
    extra: RequestHandlerExtra<ServerRequest, ServerNotification>
  ) =>
    | TypedCallToolResult<OutputArgs>
    | Promise<TypedCallToolResult<OutputArgs>>;

export const registerStructuredTool = <
  InputArgs extends ZodRawShape,
  OutputArgs extends ZodRawShape,
>
(
  server: McpServer,
  name: string,
  tool: {
    title?: string;
    description?: string;
    inputSchema?: InputArgs;
    outputSchema: OutputArgs;
    annotations?: ToolAnnotations;
  },
  cb: StructuredToolCallback<InputArgs, OutputArgs>): RegisteredTool => {
  // @ts-ignore
  const wrapped: ToolCallback<InputArgs> = (async (args: InputArgs, extra) => {
    const result = await cb(args, extra) as unknown as CallToolResult;
    const json = JSON.stringify(result, null, 2);
    return {
      ...result,
      contents: [{
        type: 'text',
        text: json,
      }],
      structuredContent: result.structuredContent,
    }
  });

  return server.registerTool<InputArgs, OutputArgs>(name,
    {
      ...tool,
    },
    wrapped,
  );
}