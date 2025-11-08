// src/hooks/useSocketProductStatus.ts
import { useEffect, useRef } from "react";
import { getSocket } from "@/lib/socketClient";

/**
 * onUpdate(payload) will be called when server emits 'imageStatus'
 * payload expected shape: { status: 'pending'|'completed'|'failed', productId: string, ... }
 */
export function useSocketProductStatus(productId?: string | null, onUpdate?: (payload: any) => void) {
  const handlerRef = useRef(onUpdate);
  handlerRef.current = onUpdate;

  useEffect(() => {
    const socket = getSocket();
    if (!productId) return;

    // join product room
    socket.emit("joinProduct", productId);

    const handler = (payload: any) => {
      try {
        handlerRef.current?.(payload);
      } catch (e) {
        console.error("[useSocketProductStatus] handler error", e);
      }
    };

    socket.on("imageStatus", handler);

    return () => {
      socket.off("imageStatus", handler);
      socket.emit("leaveProduct", productId);
    };
  }, [productId]);
}
