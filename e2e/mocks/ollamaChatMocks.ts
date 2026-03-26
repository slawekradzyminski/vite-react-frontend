import { Page, Route } from '@playwright/test';
import { BACKEND_URL } from '../config/constants';

function createMockEventStream(chunks: any[]): string {
  return chunks.map(chunk => `data: ${JSON.stringify(chunk)}\n\n`).join('');
}

export const ollamaChatMocks = {
  async mockSuccess(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { content: "The Ollama mock is up on port 11434 and ready to serve deterministic responses.", role: 'assistant' },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockConversation(page: Page, onRequest?: (route: Route) => void) {
    let requestCount = 0;
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat`, async (route) => {
      if (requestCount === 1) {
        onRequest?.(route);
      }
      requestCount++;
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { content: "Love is emotion.", role: 'assistant' },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockWithThinking(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: { 
              content: "The Ollama mock is up on port 11434 and ready to serve deterministic responses.",
              thinking: "Reviewing the latest notes about the local mock server before responding.",
              role: 'assistant' 
            },
            done: false
          },
          {
            message: { role: 'assistant' },
            done: true
          }
        ])
      });
    });
  },

  async mockError(page: Page) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat`, async (route) => {
      await route.fulfill({
        status: 500,
        headers: { 'content-type': 'text/event-stream' },
        body: 'event: error\ndata: Failed to fetch stream: Internal Server Error\n\n'
      });
    });
  },

  async mockMultiIterationToolCall(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat/tools`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [{ function: { name: 'list_products', arguments: { category: 'electronics', inStockOnly: true } } }]
            },
            done: false
          },
          {
            message: {
              role: 'tool',
              tool_name: 'list_products',
              content: '{"products":[{"id":1,"name":"iPhone 13 Pro"},{"id":2,"name":"Samsung Galaxy S21"}],"total":2}'
            },
            done: false
          },
          {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'iPhone 13 Pro' } } }]
            },
            done: false
          },
          {
            message: {
              role: 'tool',
              tool_name: 'get_product_snapshot',
              content: '{"id":1,"name":"iPhone 13 Pro","description":"Latest iPhone","price":999.99,"stockQuantity":50}'
            },
            done: false
          },
          {
            message: {
              role: 'assistant',
              content: 'We have **iPhone 13 Pro** in stock at $999.99 with 50 units available.'
            },
            done: true
          }
        ])
      });
    });
  },

  async mockSingleToolCall(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat/tools`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'iPhone 13 Pro' } } }]
            },
            done: false
          },
          {
            message: {
              role: 'tool',
              tool_name: 'get_product_snapshot',
              content: '{"id":1,"name":"iPhone 13 Pro","price":999.99}'
            },
            done: false
          },
          {
            message: {
              role: 'assistant',
              content: 'The iPhone 13 Pro costs $999.99.'
            },
            done: true
          }
        ])
      });
    });
  },

  async mockToolCallWithIntermediateContent(page: Page, onRequest?: (route: Route) => void) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat/tools`, async (route) => {
      onRequest?.(route);
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: {
              role: 'assistant',
              content: 'I will fetch the product details for you.',
              tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'iPhone' } } }]
            },
            done: false
          },
          {
            message: {
              role: 'tool',
              tool_name: 'get_product_snapshot',
              content: '{"id":1,"name":"iPhone 13 Pro","price":999.99}'
            },
            done: false
          },
          {
            message: {
              role: 'assistant',
              content: 'Here is the iPhone 13 Pro at $999.99.'
            },
            done: true
          }
        ])
      });
    });
  },

  async mockToolError(page: Page) {
    await page.route(`${BACKEND_URL}/api/v1/ollama/chat/tools`, async (route) => {
      await route.fulfill({
        status: 200,
        headers: { 'content-type': 'text/event-stream' },
        body: createMockEventStream([
          {
            message: {
              role: 'assistant',
              content: '',
              tool_calls: [{ function: { name: 'get_product_snapshot', arguments: { name: 'Unknown' } } }]
            },
            done: false
          },
          {
            message: {
              role: 'tool',
              tool_name: 'get_product_snapshot',
              content: '{"error":"Product not found"}'
            },
            done: false
          },
          {
            message: {
              role: 'assistant',
              content: 'Sorry, I could not find that product.'
            },
            done: true
          }
        ])
      });
    });
  }
}; 
