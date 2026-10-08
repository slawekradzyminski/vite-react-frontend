import { useState } from 'react';
import { Link } from 'react-router';
import type { ShopTool, ToolCall } from './webmcp-model';
import styles from './ShopToolPanel.module.css';

interface Props {
  tools: ShopTool[];
  calls: ToolCall[];
  status: string;
  initialOpen?: boolean;
  showLabLink?: boolean;
}

export function ShopToolPanel({ tools, calls, status, initialOpen = false, showLabLink = true }: Props) {
  const [open, setOpen] = useState(initialOpen);
  return (
    <details className={styles.panel} open={open} onToggle={event => setOpen(event.currentTarget.open)} data-testid="shop-tool-panel">
      <summary className={styles.heading}><span>WebMCP · Agent interface</span><span data-testid="shop-tool-status">{status}</span></summary>
      <div className={styles.body}>
        <p>Agents can use the shop&apos;s existing product and cart operations through tools registered by this page.</p>
        <ol className={styles.flow} aria-label="How a WebMCP call reaches the shop"><li>Agent</li><li>Page tool</li><li>Shop API</li><li>Shared UI state</li></ol>
        <div className={styles.columns}>
          <section aria-label="Registered tool definitions">
            <h2>Three page tools</h2>
            {tools.map(tool => <details className={styles.tool} key={tool.name}><summary><code>{tool.name}</code></summary><p>{tool.description}</p><pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre></details>)}
          </section>
          <section aria-label="Tool call history">
            <h2>Calls in this page session</h2>
            {calls.length === 0 ? <p>No tool calls yet. Connect an agent or run the Playwright examples.</p> : <ol className={styles.calls}>{calls.map((call, index) => <li key={index}><div><code>{call.name}</code><span>{call.result.isError ? 'Error' : 'Completed'}</span></div><details><summary>Arguments and result</summary><pre>{JSON.stringify({ input: call.input, result: call.result }, null, 2)}</pre></details></li>)}</ol>}
          </section>
        </div>
        <div className={styles.links}><Link to="/cart">Open your cart ↗</Link>{showLabLink && <Link to="/webmcp">Explore deliberate faults in the lab ↗</Link>}</div>
        <p className={styles.note}>Tool descriptions and results come from this page. They are untrusted input. Cart writes use the signed-in user&apos;s session.</p>
      </div>
    </details>
  );
}
