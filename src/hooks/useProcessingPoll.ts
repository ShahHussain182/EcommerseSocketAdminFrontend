// src/hooks/useProcessingPoll.ts
import { useRef } from 'react';
import { QueryClient } from '@tanstack/react-query';
import { productService } from '@/services/productService';

const INITIAL_DELAY_MS = 1000;
const MAX_DELAY_MS = 5000;
const MAX_TOTAL_MS = 2 * 60 * 1000; // 2 minutes

function upsertProductInAllProductCaches(queryClient: QueryClient, updatedProduct: any) {
  const allQueries = queryClient.getQueryCache().getAll();
  let replacedInAny = false;

  for (const q of allQueries) {
    const qKey = q.queryKey;
    if (!Array.isArray(qKey) || qKey[0] !== 'products') continue;

    const qData = queryClient.getQueryData(qKey);
    if (!qData) continue;

    try {
      const pageData = qData as any;
      if (!Array.isArray(pageData.products)) continue;

      const newProducts = pageData.products.map((p: any) => {
        const matches =
          (p._id && String(p._id) === String(updatedProduct._id)) ||
          (p.id && String(p.id) === String(updatedProduct.id));
        if (matches) {
          replacedInAny = true;
          // replace with server product so imageProcessingStatus + renditions get in
          return { ...p, ...updatedProduct };
        }
        return p;
      });

      if (replacedInAny) {
        const newPage = { ...pageData, products: newProducts };
        queryClient.setQueryData(qKey, newPage);
        // don't `break` — product might be present on multiple cached pages
      }
    } catch (e) {
      // ignore non-standard shapes
      // eslint-disable-next-line no-console
      console.debug('[upsertPoll] non-standard page shape', qKey, e);
    }
  }

  // Ensure single-product cache updated
  if (updatedProduct._id) queryClient.setQueryData(['product', updatedProduct._id], updatedProduct);
  if (updatedProduct.id) queryClient.setQueryData(['product', updatedProduct.id], updatedProduct);

  return replacedInAny;
}

export function useProcessingPoll() {
  const isPollingRef = useRef(false);

  async function startPoll(productId: string, queryClient: QueryClient, onDone?: () => void) {
    if (!productId) return;
    if (isPollingRef.current) return; // already polling
    isPollingRef.current = true;

    const startTs = Date.now();
    let delay = INITIAL_DELAY_MS;

    try {
      while (Date.now() - startTs < MAX_TOTAL_MS) {
        try {
          const resp = await productService.getProductById(productId);
          const product = resp?.product;
          if (!product) {
            // nothing returned — probably transient; continue
          } else {
            // if processing finished (completed or failed)
            const status = product.imageProcessingStatus;
            // eslint-disable-next-line no-console
            console.debug('[poll] product', productId, 'status', status);

            if (status && status !== 'pending') {
              // Update caches directly (best effort)
              const replaced = upsertProductInAllProductCaches(queryClient, product);

              if (!replaced) {
                // fallback: invalidate any product list queries so UI refetches latest state
                // eslint-disable-next-line no-console
                console.debug('[poll] upsert did not replace any cached page; invalidating product lists');
                queryClient.invalidateQueries({
                  predicate: (q) => Array.isArray(q.queryKey) && q.queryKey[0] === 'products',
                });
              }

              // Also ensure single product key is invalidated/refreshed
              queryClient.invalidateQueries({ queryKey: ['product', productId] });

              if (typeof onDone === 'function') onDone();
              break;
            }
          }
        } catch (e) {
          // network or transient error — ignore and retry after backoff
          // eslint-disable-next-line no-console
          console.debug('[poll] error fetching product', productId, e);
        }

        // wait and backoff slightly
        await new Promise((res) => setTimeout(res, delay));
        delay = Math.min(MAX_DELAY_MS, Math.round(delay * 1.5));
      }
    } finally {
      isPollingRef.current = false;
    }
  }

  return { startPoll };
}
