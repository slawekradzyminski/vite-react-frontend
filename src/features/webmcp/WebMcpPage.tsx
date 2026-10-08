import { useCallback, useEffect, useMemo, useState } from 'react';
import { Link, useSearchParams } from 'react-router';
import { cart, products } from '../../lib/api';
import type { Cart } from '../../types/cart';
import type { Product } from '../../types/product';
import { createShopTools, faults, filterProducts, getModelContext, readFault, registerShopTools } from './webmcp-model';
import type { ToolCall } from './webmcp-model';
import styles from './WebMcpPage.module.css';

export function WebMcpPage() {
  const [params, setParams] = useSearchParams();
  const fault = readFault(params.get('fault'));
  const toolsEnabled = params.get('tools') !== 'off';
  const [catalogue, setCatalogue] = useState<Product[]>([]);
  const [savedCart, setSavedCart] = useState<Cart>();
  const [query, setQuery] = useState(params.get('query') ?? '');
  const [inStockOnly, setInStockOnly] = useState(false);
  const [status, setStatus] = useState('Loading application');
  const [error, setError] = useState('');
  const [pending, setPending] = useState(false);
  const [calls, setCalls] = useState<ToolCall[]>([]);
  const [quantities, setQuantities] = useState<Record<number, number>>({});

  useEffect(() => {
    let active = true;
    Promise.all([products.getAllProducts(), cart.getCart()]).then(([productResponse, cartResponse]) => {
      if (active) {
        setCatalogue(productResponse.data);
        setSavedCart(cartResponse.data);
      }
    }).catch(() => { if (active) setError('Could not load the shop. Check your backend and sign in again.'); });
    return () => { active = false; };
  }, []);

  const onSearch = useCallback((value: string, stock: boolean) => {
    setQuery(value);
    setInStockOnly(stock);
  }, []);
  const onCall = useCallback((call: ToolCall) => setCalls(current => [call, ...current].slice(0, 20)), []);
  const tools = useMemo(() => createShopTools({
    getProducts: async () => {
      const response = await products.getAllProducts();
      setCatalogue(response.data);
      return response.data;
    },
    getCart: async () => (await cart.getCart()).data,
    addToCart: async (productId, quantity) => (await cart.addToCart({ productId, quantity })).data,
    onSearch,
    onCart: setSavedCart,
  }, fault, onCall), [fault, onSearch, onCall]);

  useEffect(() => {
    const context = getModelContext();
    if (!toolsEnabled) { setStatus('Tools disabled for the UI baseline'); return; }
    if (!context) { setStatus('WebMCP unavailable in this browser'); return; }
    const controller = new AbortController();
    setStatus('Registering tools');
    registerShopTools(context, tools, controller.signal).then(() => {
      if (!controller.signal.aborted) setStatus('3 native WebMCP tools registered');
    }).catch(() => {
      if (controller.signal.aborted) return;
      controller.abort();
      setStatus('Tool registration failed. Reload this page to retry.');
    });
    return () => { controller.abort(); };
  }, [tools, toolsEnabled]);

  const addFromUi = async (product: Product) => {
    setError('');
    if (fault === 'broken-button') return;
    setPending(true);
    try {
      const response = await cart.addToCart({ productId: product.id, quantity: quantities[product.id] ?? 1 });
      setSavedCart(response.data);
    } catch {
      setError('Could not add this quantity. Check the available stock and try again.');
    } finally { setPending(false); }
  };

  const clearCart = async () => {
    setPending(true);
    setError('');
    try {
      await cart.clearCart();
      setSavedCart((await cart.getCart()).data);
      setCalls([]);
    } catch { setError('Could not clear the cart. Please try again.'); }
    finally { setPending(false); }
  };
  const visible = filterProducts(catalogue, query, inStockOnly);
  const displayedTotal = (savedCart?.totalPrice ?? 0) + (fault === 'wrong-total' && savedCart?.items.length ? 0.01 : 0);

  return (
    <div className={styles.page} data-testid="webmcp-page">
      <header className={styles.header}>
        <div><h1>WebMCP shop lab</h1><p>One shop. A human interface and three tools for agents.</p></div>
        <Link to="/products">Open the regular shop ↗</Link>
      </header>
      <section className={styles.experiment} aria-label="Experiment controls">
        <label>Application scenario<select value={fault} onChange={event => {
          const next = new URLSearchParams(params); next.set('fault', event.target.value); setParams(next);
        }} data-testid="webmcp-fault">{Object.entries(faults).map(([value, label]) => <option key={value} value={value}>{label}</option>)}</select></label>
        <p role="status" data-testid="webmcp-status">{status}</p>
        {fault !== 'none' && <p className={styles.notice}>A deliberate fault is active on this demonstration page.</p>}
      </section>
      {error && <p role="alert" className={styles.error}>{error}</p>}
      <div className={styles.workspace}>
        <section className={styles.catalogue} aria-labelledby="catalogue-title">
          <h2 id="catalogue-title">Catalogue</h2>
          <div className={styles.filters}>
            <label>Search products<input type="search" value={query} onChange={event => setQuery(event.target.value)} placeholder="Name, category or description" data-testid="webmcp-search" /></label>
            <label className={styles.checkbox}><input type="checkbox" checked={inStockOnly} onChange={event => setInStockOnly(event.target.checked)} />In stock only</label>
          </div>
          <p className={styles.muted}>{visible.length} products · lowest price first</p>
          <div className={styles.productList}>
            {visible.map(product => <article key={product.id} className={styles.product} data-testid={`webmcp-product-${product.id}`}>
              <div className={styles.productInfo}><h3>{product.name}</h3><p>{product.category} · {product.stockQuantity} in stock</p><strong>${product.price.toFixed(2)}</strong></div>
              <div className={styles.productActions}>
                <label>Quantity<input type="number" min="1" max={product.stockQuantity || 1} value={quantities[product.id] ?? 1} onChange={event => setQuantities(current => ({ ...current, [product.id]: Number(event.target.value) }))} data-testid={`webmcp-quantity-${product.id}`} /></label>
                <button disabled={pending || product.stockQuantity < 1 || !Number.isSafeInteger(quantities[product.id] ?? 1) || (quantities[product.id] ?? 1) < 1} onClick={() => void addFromUi(product)} data-testid={`webmcp-add-${product.id}`}>Add to cart</button>
              </div>
            </article>)}
          </div>
          {savedCart && visible.length === 0 && <p>No products match this search.</p>}
        </section>
        <aside className={styles.side}>
          <section className={styles.cart} aria-labelledby="cart-title">
            <div className={styles.sectionHeader}><h2 id="cart-title">Your cart</h2><button className={styles.secondary} onClick={() => void clearCart()} disabled={pending || !savedCart?.items.length}>Clear cart</button></div>
            {!savedCart ? <p>Loading cart…</p> : <>
              {savedCart.items.length === 0 ? <p className={styles.muted}>Your cart is empty. Add a product to begin.</p> : <ul>{savedCart.items.map(item => <li key={item.productId} data-testid={`webmcp-cart-item-${item.productId}`}><span>{catalogue.find(product => product.id === item.productId)?.name ?? `Product ${item.productId}`}</span><strong>× {item.quantity}</strong></li>)}</ul>}
              <div className={styles.total}><span><span data-testid="webmcp-cart-count">{savedCart.totalItems}</span> items</span><strong data-testid="webmcp-cart-total">${displayedTotal.toFixed(2)}</strong></div>
              <p className={styles.muted}>Cart changes are saved to the training backend.</p>
            </>}
          </section>
          <section className={styles.inspector} aria-labelledby="tools-title">
            <h2 id="tools-title">Agent interface</h2>
            <p className={styles.muted}>Tools belong to this page and its signed-in user.</p>
            {tools.map(tool => <details key={tool.name}><summary><code>{tool.name}</code></summary><p>{tool.description}</p><pre>{JSON.stringify(tool.inputSchema, null, 2)}</pre></details>)}
            <h3>Tool calls</h3>
            {calls.length === 0 ? <p className={styles.muted}>No tool calls yet. Connect an agent or run the Playwright examples.</p> : <ol className={styles.calls}>{calls.map((call, index) => <li key={index}><div><code>{call.name}</code><span>{call.result.isError ? 'Error' : 'Completed'}</span></div><details><summary>Arguments and result</summary><pre>{JSON.stringify({ input: call.input, result: call.result }, null, 2)}</pre></details></li>)}</ol>}
          </section>
        </aside>
      </div>
    </div>
  );
}
