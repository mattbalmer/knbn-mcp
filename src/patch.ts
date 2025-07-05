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

// type TypedCallToolResult<OutputArgs extends undefined | ZodRawShape> = any;

type TypedCallToolResult<OutputArgs extends undefined | ZodRawShape> =
  OutputArgs extends ZodRawShape ?
  (Omit<CallToolResult, 'content'> & ({
    structuredContent?: never;
    content: CallToolResult['content'];
  } | {
    structuredContent: z.objectOutputType<OutputArgs, ZodTypeAny>;
    content?: never;
  })) : CallToolResult;

type StructuredToolResult <O extends z.ZodRawShape | undefined> = TypedCallToolResult<O> | Promise<TypedCallToolResult<O>>;

type StructuredToolCallback<
  InputArgs extends undefined | ZodRawShape = undefined,
  OutputArgs extends undefined | ZodRawShape = undefined
> = InputArgs extends ZodRawShape
  ? (
      args: z.objectOutputType<InputArgs, ZodTypeAny>,
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => StructuredToolResult<OutputArgs>
  : (
      extra: RequestHandlerExtra<ServerRequest, ServerNotification>
    ) => StructuredToolResult<OutputArgs>
  ;

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
    if (result.structuredContent) {
      if (result.content) {
        throw new Error('Tool cannot return both structuredContent and content');
      }
      if (typeof result.structuredContent !== 'object' || Array.isArray(result.structuredContent)) {
        throw new Error('Tool structuredContent must be an object');
      }
      const json = JSON.stringify(result.structuredContent, null, 2);
      return {
        ...result,
        content: [{
          type: 'text',
          text: json,
        }],
        structuredContent: result.structuredContent,
      }
    } else {
      return result;
    }
  });

  return server.registerTool<InputArgs, OutputArgs>(name,
    {
      ...tool,
    },
    wrapped,
  );
}