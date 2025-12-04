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
    description: 'Grab a catalog slice right after get_product_snapshot so comparisons stay grounded. Stay in the product lane—do not mix this with Grokipedia output inside the same turn.',
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

export const GROKIPEDIA_SEARCH_TOOL: OllamaToolDefinition = {
  type: 'function',
  function: {
    name: 'search_grokipedia',
    description: 'First hop in the Grokipedia lane: turn a sports/news query into a slug so qwen3:4b-instruct can stay on topic before fetching the article.',
    parameters: {
      type: 'object',
      properties: {
        query: {
          type: 'string',
          description: 'Search phrase describing the person/team/topic.',
        },
        limit: {
          type: 'integer',
          description: 'Maximum number of suggestions to return (default 3).',
        },
      },
      required: ['query'],
    },
  },
};

export const GROKIPEDIA_ARTICLE_TOOL: OllamaToolDefinition = {
  type: 'function',
  function: {
    name: 'get_grokipedia_article',
    description: 'Follow-up to search_grokipedia. Pull the structured Grokipedia article (title, summary, sections) once you already resolved the slug, and avoid mixing it with catalog tools.',
    parameters: {
      type: 'object',
      properties: {
        slug: {
          type: 'string',
          description: 'Canonical Grokipedia slug, e.g., FC_Barcelona.',
        },
        query: {
          type: 'string',
          description: 'Fallback search phrase when the slug is not known.',
        },
      },
      oneOf: [
        { required: ['slug'] },
        { required: ['query'] },
      ],
    },
  },
};

export const TOOL_DEFINITIONS: OllamaToolDefinition[] = [
  PRODUCT_SNAPSHOT_TOOL,
  PRODUCT_LIST_TOOL,
  GROKIPEDIA_SEARCH_TOOL,
  GROKIPEDIA_ARTICLE_TOOL,
];
