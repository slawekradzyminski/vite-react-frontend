import type { OllamaToolDefinition } from '../types/ollama';

export const PRODUCT_SNAPSHOT_TOOL: OllamaToolDefinition = {
  type: 'function',
  function: {
    name: 'get_product_snapshot',
    description: 'Anchor every SKU answer with trusted price/stock/description. qwen3:4b-instruct hallucinates, so call this before saying anything about a product and keep it paired with list_products.',
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

export const PRODUCT_LIST_TOOL: OllamaToolDefinition = {
  type: 'function',
  function: {
    name: 'list_products',
    description: 'Grab a catalog slice right after get_product_snapshot so comparisons stay grounded.',
    parameters: {
      type: 'object',
      properties: {
        offset: {
          type: 'integer',
          description: 'Zero-based offset into the catalog (default 0).',
        },
        limit: {
          type: 'integer',
          description: 'Number of products to fetch (default 25, max 100).',
        },
      },
    },
  },
};

export const TOOL_DEFINITIONS: OllamaToolDefinition[] = [
  PRODUCT_SNAPSHOT_TOOL,
  PRODUCT_LIST_TOOL,
];
