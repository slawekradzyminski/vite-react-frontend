import type { OllamaToolDefinition } from '../types/ollama';

export const PRODUCT_SNAPSHOT_TOOL: OllamaToolDefinition = {
  type: 'function',
  function: {
    name: 'get_product_snapshot',
    description: 'Return catalog metadata for a product so you can answer shopper questions accurately.',
    parameters: {
      type: 'object',
      properties: {
        productId: {
          type: 'integer',
          description: 'Numeric product id as shown in the catalog.',
        },
        name: {
          type: 'string',
          description: 'Exact product name when the id is unknown.',
        },
      },
      oneOf: [
        { required: ['productId'] },
        { required: ['name'] },
      ],
    },
  },
};

export const TOOL_DEFINITIONS: OllamaToolDefinition[] = [PRODUCT_SNAPSHOT_TOOL];
