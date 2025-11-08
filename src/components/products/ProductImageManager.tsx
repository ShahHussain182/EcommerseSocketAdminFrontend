"use client";
import React, { useEffect, useRef, useState, useCallback } from "react";
import { useMutation, useQueryClient } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import { Label } from "@/components/ui/label";
import { Loader2, X, Image as ImageIcon, Upload, AlertCircle, CheckCircle2 } from "lucide-react";
import toast from "react-hot-toast";
import { productService } from "../../services/productService";
import type { Product, ApiResponse } from "../../types";
import { useFormContext } from "react-hook-form";
import { ProductFormValues } from "../../schemas/productSchema";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { cn } from "@/lib/utils";
import { FormErrorMessage } from "../ui/FormErrorMessage";
import { useSocketProductStatus } from "@/hooks/useSocketProductStatus";

const MAX_IMAGES = 5;
type PreviewStatus = "local_pending_upload" | "uploading" | "remote_processing" | "remote_completed" | "failed";

interface PreviewItem {
  id: string;
  url: string;
  status: PreviewStatus;
  isExisting: boolean;
  deletionUrl?: string;
  file?: File;
}

interface Props {
  product?: Product;
  isAnyOperationPending: boolean;
  refetchProduct: () => Promise<any>;
  onImagesUploaded?: () => void;
}

export const ProductImageManager: React.FC<Props> = ({ product, isAnyOperationPending, refetchProduct, onImagesUploaded }) => {
  const queryClient = useQueryClient();
  const { setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const existingImageUrlsWatch = watch("imageUrls") || [];

  // (keep pollingRef only if you'd like to keep fallback cleanup)
  const pollingFallbackRef = useRef<number | null>(null);

  const pickRenditionUrl = (rendition: any, fallbackUrl?: string) => {
    return (rendition?.thumbnail) || (rendition?.medium) || (rendition?.original) || fallbackUrl || "/placeholder.svg";
  };

  useEffect(() => {
    const remotePreviews: PreviewItem[] = (product?.imageRenditions || []).map((rendition: any, idx: number) => {
      const displayUrl = pickRenditionUrl(rendition, existingImageUrlsWatch?.[idx]);
      const isProcessing = product?.imageProcessingStatus === "pending" && !rendition?.thumbnail && !rendition?.medium;
      return {
        id: `remote-${idx}-${displayUrl}`,
        url: displayUrl,
        status: isProcessing ? "remote_processing" : "remote_completed",
        isExisting: true,
        deletionUrl: existingImageUrlsWatch?.[idx] || displayUrl,
      } as PreviewItem;
    });

    const localOnes = previewItems.filter(p => !p.isExisting);
    const remoteUrlsSet = new Set(remotePreviews.map(r => r.url));
    const filteredLocalOnes = localOnes.filter(l => !remoteUrlsSet.has(l.url));

    const merged = [...remotePreviews, ...filteredLocalOnes].slice(0, MAX_IMAGES);

    setPreviewItems(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, existingImageUrlsWatch]);

  useEffect(() => {
    return () => {
      previewItems.forEach(item => {
        if (item.file && item.url.startsWith("blob:")) {
          try { URL.revokeObjectURL(item.url); } catch (e) {}
        }
      });
      if (pollingFallbackRef.current) {
        clearTimeout(pollingFallbackRef.current);
        pollingFallbackRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalImagesCount = previewItems.length;
  const canAddMoreImages = totalImagesCount < MAX_IMAGES;
  const canDeleteImages = totalImagesCount > 1;

  const handleFileChange = (ev: React.ChangeEvent<HTMLInputElement>) => {
    const files = ev.target.files ? Array.from(ev.target.files) : [];
    if (files.length === 0) return;
    if (totalImagesCount + files.length > MAX_IMAGES) {
      toast.error(`You can only have a maximum of ${MAX_IMAGES} images.`);
      if (fileInputRef.current) fileInputRef.current.value = "";
      return;
    }
    const newPreviews = files.map((file, idx) => {
      const url = URL.createObjectURL(file);
      return {
        id: `local-${Date.now()}-${idx}-${file.name}`,
        url,
        status: "local_pending_upload" as PreviewStatus,
        isExisting: false,
        file,
      } as PreviewItem;
    });
    setPreviewItems(prev => {
      const merged = [...prev, ...newPreviews].slice(0, MAX_IMAGES);
      const localFiles = merged.filter(p => !p.isExisting && p.file).map(p => p.file!);
      setValue("imageFiles", localFiles, { shouldValidate: true });
      return merged;
    });
    if (fileInputRef.current) fileInputRef.current.value = "";
  };

  const handleRemoveLocalFile = (id: string) => {
    setPreviewItems(prev => {
      const removed = prev.find(p => p.id === id);
      const next = prev.filter(p => p.id !== id);
      if (removed?.file && removed.url.startsWith("blob:")) {
        try { URL.revokeObjectURL(removed.url); } catch (e) {}
      }
      const localFiles = next.filter(p => !p.isExisting && p.file).map(p => p.file!);
      setValue("imageFiles", localFiles, { shouldValidate: true });
      return next;
    });
  };

  const deleteImageMutation = useMutation({
    mutationFn: ({ productId, imageUrl }: { productId: string; imageUrl: string }) =>
      productService.deleteProductImage(productId, imageUrl),
    onMutate: async () => {
      setIsDeletingImage(true);
    },
    onSuccess: (response: ApiResponse<Product>) => {
      toast.success(response.message);
      setValue("imageUrls", response.product?.imageUrls || [], { shouldDirty: true });
      queryClient.invalidateQueries({ queryKey: ["products"] });
      refetchProduct();
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to delete image.");
    },
    onSettled: () => {
      setIsDeletingImage(false);
    },
  });

  const handleRemoveExistingImage = (deletionUrl?: string) => {
    if (!product?._id) {
      toast.error("Cannot delete image from a product that hasn't been created.");
      return;
    }
    if (!deletionUrl) {
      toast.error("Image deletion URL missing.");
      return;
    }
    if (!canDeleteImages) {
      toast.error("A product must have at least one image.");
      return;
    }
    deleteImageMutation.mutate({ productId: product._id, imageUrl: deletionUrl });
  };

  // --------------------------
  // Socket integration
  // --------------------------
  // Handler for socket updates
  const socketUpdateHandler = useCallback(async (payload: any) => {
    try {
      // payload should include productId and status
      const pid = payload?.productId || product?._id;
      if (!pid) return;
      // Only react to events for this product
      if (String(pid) !== String(product?._id)) return;

      const status = payload?.status;
      console.debug('[socket] product', pid, 'status', status, payload);

      if (status && status !== "pending") {
        // final or failed state: refetch and call onImagesUploaded
        try { await refetchProduct(); } catch (e) { console.warn('[socket] refetchProduct failed', e); }
        if (typeof onImagesUploaded === 'function') {
          try { await onImagesUploaded(); } catch (e) { console.error('[ProductImageManager] onImagesUploaded (socket) failed', e); }
        }
      }
    } catch (err) {
      console.error('[socketUpdateHandler] error', err);
    }
  }, [product?._id, refetchProduct, onImagesUploaded]);

  // subscribe to socket updates for this product (when mounted and product exists)
  useSocketProductStatus(product?._id, socketUpdateHandler);

  // small fallback: if socket doesn't deliver completed within 2 minutes (120s) after upload,
  // we do one refetch and call onImagesUploaded to avoid stuck state.
  // We'll only set fallback timer after a successful upload action (below)
  const setFallbackTimer = (ms = 120000) => {
    if (pollingFallbackRef.current) {
      clearTimeout(pollingFallbackRef.current);
      pollingFallbackRef.current = null;
    }
    pollingFallbackRef.current = window.setTimeout(async () => {
      try { await refetchProduct(); } catch (e) { /* ignore */ }
      if (typeof onImagesUploaded === 'function') {
        try { await onImagesUploaded(); } catch (e) { console.error('[ProductImageManager] onImagesUploaded (fallback) failed', e); }
      }
    }, ms);
  };

  // Upload mutation (unchanged logic except we remove the internal poller and use socket fallback)
  const uploadImagesMutation = useMutation({
    mutationFn: ({ productId, files }: { productId: string; files: File[] }) =>
      productService.uploadProductImages(productId, files),
    onMutate: async (vars) => {
      setIsUploadingImages(true);
      setPreviewItems(prev => prev.map(p => {
        if (!p.isExisting && p.file && vars.files.includes(p.file)) {
          return { ...p, status: "uploading" as PreviewStatus };
        }
        return p;
      }));
    },
    onSuccess: async (response: ApiResponse<Product>, vars) => {
      toast.success(response.message);
      const newProduct = response.product!;
      const remainingLocalFiles = previewItems.filter(p => !p.isExisting && p.file && !vars.files.includes(p.file)).map(p => p.file!);

      const remotePreviews: PreviewItem[] = (newProduct.imageRenditions || []).map((rendition: any, idx: number) => {
        const displayUrl = pickRenditionUrl(rendition, newProduct.imageUrls?.[idx]);
        const isProcessing = newProduct.imageProcessingStatus === "pending" && !rendition?.thumbnail && !rendition?.medium;
        return {
          id: `remote-${idx}-${displayUrl}`,
          url: displayUrl,
          status: isProcessing ? "remote_processing" : "remote_completed",
          isExisting: true,
          deletionUrl: newProduct.imageUrls?.[idx] || displayUrl,
        } as PreviewItem;
      });

      const extraLocalPreviews = remainingLocalFiles.map((file, idx) => {
        const url = URL.createObjectURL(file);
        return {
          id: `local-remaining-${Date.now()}-${idx}-${file.name}`,
          url,
          status: "local_pending_upload" as PreviewStatus,
          isExisting: false,
          file,
        } as PreviewItem;
      });

      const seen = new Set<string>();
      const dedupedRemote: PreviewItem[] = [];
      for (const r of remotePreviews) {
        if (!seen.has(r.url)) {
          dedupedRemote.push(r);
          seen.add(r.url);
        }
      }

      const merged = [...dedupedRemote, ...extraLocalPreviews].slice(0, MAX_IMAGES);

      setValue("imageUrls", newProduct.imageUrls || [], { shouldDirty: true });
      setValue("imageFiles", merged.filter(p => !p.isExisting && p.file).map(p => p.file!), { shouldValidate: true });
      setPreviewItems(merged);

      queryClient.invalidateQueries({ queryKey: ["products"] });
      await refetchProduct();

      if (typeof onImagesUploaded === 'function') {
        const productId = newProduct._id;
        const statusNow = newProduct.imageProcessingStatus;

        if (statusNow && statusNow !== 'pending') {
          try {
            await onImagesUploaded();
          } catch (e) {
            console.error('[ProductImageManager] onImagesUploaded failed (immediate)', e);
          }
        } else if (productId) {
          // instead of polling, rely on socket events; set a fallback timer in case socket fails.
          setFallbackTimer(120000); // 2 minutes fallback
        }
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to upload images.");
      setPreviewItems(prev => prev.map(p => p.status === "uploading" ? ({ ...p, status: "failed" }) : p));
    },
    onSettled: () => {
      setIsUploadingImages(false);
    },
  });

  const handleUploadNewImages = () => {
    if (!product?._id) {
      toast.error("Product must be created before uploading images.");
      return;
    }
    const toUpload = previewItems.filter(p => !p.isExisting && p.file).map(p => p.file!);
    if (toUpload.length === 0) {
      toast.error("Please select images to upload.");
      return;
    }
    uploadImagesMutation.mutate({ productId: product._id, files: toUpload });
  };

  const isProductImageProcessingPending = product?.imageProcessingStatus === "pending";
  const isImageOperationPending = isUploadingImages || isDeletingImage;

  // --- UI unchanged below ---
  return (
    <div className="space-y-3 border p-4 rounded-md">
      <div className="flex items-center justify-between">
        <Label>Product Images ({totalImagesCount}/{MAX_IMAGES})</Label>
        <div className="flex space-x-2">
          <Button
            type="button"
            onClick={() => fileInputRef.current?.click()}
            size="sm"
            disabled={isAnyOperationPending || isImageOperationPending || !canAddMoreImages}
          >
            <ImageIcon className="mr-2 h-3 w-3" />
            Select Files
          </Button>
          <input
            ref={fileInputRef}
            type="file"
            multiple
            accept="image/jpeg,image/png,image/webp"
            onChange={handleFileChange}
            className="hidden"
            disabled={isAnyOperationPending || isImageOperationPending || !canAddMoreImages}
          />
          {product && previewItems.some(p => !p.isExisting) && (
            <Button
              type="button"
              onClick={handleUploadNewImages}
              size="sm"
              disabled={isAnyOperationPending || isImageOperationPending || previewItems.filter(p => !p.isExisting).length === 0}
            >
              {isUploadingImages ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Upload className="mr-2 h-3 w-3" />}
              Upload ({previewItems.filter(p => !p.isExisting).length})
            </Button>
          )}
        </div>
      </div>

      {errors.imageFiles?.message && <FormErrorMessage message={String(errors.imageFiles.message)} />}
      {errors.imageUrls?.message && <FormErrorMessage message={String(errors.imageUrls.message)} />}

      {product && previewItems.some(p => !p.isExisting) && (
        <Alert variant="destructive">
          <AlertCircle className="h-4 w-4" />
          <AlertTitle>Pending Image Uploads</AlertTitle>
          <AlertDescription>
            You have selected new images. Click "Upload" to add them before updating the product.
          </AlertDescription>
        </Alert>
      )}

      {isProductImageProcessingPending && (
        <Alert variant="default">
          <Loader2 className="h-4 w-4 animate-spin" />
          <AlertTitle>Image Processing in Progress</AlertTitle>
          <AlertDescription>Some images are being processed. They will appear when ready.</AlertDescription>
        </Alert>
      )}

      <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-5 gap-2">
        {previewItems.length === 0 && (
          <div className="col-span-full text-center text-muted-foreground py-4">
            No images selected or uploaded.
          </div>
        )}

        {previewItems.map((image) => (
          <div key={image.id} className="relative w-24 h-24 rounded-md overflow-hidden border">
            <img
              src={image.url}
              alt="Product preview"
              className={cn("w-full h-full object-cover", (image.status === "remote_processing" || image.status === "uploading") && "opacity-50")}
              onError={(e) => {
                e.currentTarget.src = "/placeholder.svg";
                e.currentTarget.onerror = null;
              }}
            />

            {(image.status === "uploading" || image.status === "remote_processing") && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/70 p-1">
                <Loader2 className="h-5 w-5 animate-spin text-white" />
                <span className="text-xs text-white mt-1 text-center">
                  {image.status === "uploading" ? "Uploading" : "Processing"}
                </span>
              </div>
            )}
            {image.status === "local_pending_upload" && (
              <div className="absolute inset-0 flex flex-col items-center justify-center bg-yellow-500/70 p-1">
                <Upload className="h-5 w-5 text-white" />
                <span className="text-xs text-white mt-1 text-center">Local</span>
              </div>
            )}
            {image.status === "remote_completed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-green-500/50 opacity-0 hover:opacity-100 transition-opacity duration-200">
                <CheckCircle2 className="h-5 w-5 text-white" />
              </div>
            )}
            {image.status === "failed" && (
              <div className="absolute inset-0 flex items-center justify-center bg-red-600/60 p-1">
                <span className="text-xs text-white">Failed</span>
              </div>
            )}

            <Button
              type="button"
              variant="destructive"
              size="icon"
              className={cn(
                "absolute top-1 right-1 h-6 w-6 rounded-full bg-red-500/80 hover:bg-red-600",
                !canDeleteImages && "opacity-50 cursor-not-allowed",
                (image.status === "remote_processing" || image.status === "uploading" || isDeletingImage) && "opacity-0 pointer-events-none"
              )}
              onClick={() => {
                if (!canDeleteImages) return;
                if (!image.isExisting && image.file) {
                  handleRemoveLocalFile(image.id);
                } else if (image.deletionUrl) {
                  handleRemoveExistingImage(image.deletionUrl);
                }
              }}
              disabled={isAnyOperationPending || isProductImageProcessingPending || !canDeleteImages}
            >
              {isDeletingImage && image.isExisting ? <Loader2 className="h-3 w-3 animate-spin" /> : <X className="h-3 w-3" />}
            </Button>
          </div>
        ))}
      </div>
    </div>
  );
};