"use client";

import React, { useEffect, useRef, useState } from "react";
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

export const ProductImageManager: React.FC<Props> = ({ product, isAnyOperationPending, refetchProduct ,onImagesUploaded}) => {
  const queryClient = useQueryClient();
  const { setValue, watch, formState: { errors } } = useFormContext<ProductFormValues>();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [previewItems, setPreviewItems] = useState<PreviewItem[]>([]);
  const [isUploadingImages, setIsUploadingImages] = useState(false);
  const [isDeletingImage, setIsDeletingImage] = useState(false);

  const existingImageUrlsWatch = watch("imageUrls") || [];

  // polling ref (safe cleanup)
  const pollingRef = useRef<number | null>(null);

  // --- Helper: choose the best display URL from a rendition entry ---
  const pickRenditionUrl = (rendition: any, fallbackUrl?: string) => {
    return (rendition?.thumbnail) || (rendition?.medium) || (rendition?.original) || fallbackUrl || "/placeholder.svg";
  };

  // Build previewItems from product when product changes.
  // NOTE: we **replace** remote entries wholesale and keep local-only previews appended after them.
  useEffect(() => {
    // remote previews from product.imageRenditions (prefer renditions)
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

    // preserve local-only items that user has selected but not uploaded yet
    const localOnes = previewItems.filter(p => !p.isExisting);

    // Deduplicate by URL: prefer remotePreviews; if a localOne has same url as a remote one, discard the local one
    const remoteUrlsSet = new Set(remotePreviews.map(r => r.url));
    const filteredLocalOnes = localOnes.filter(l => !remoteUrlsSet.has(l.url));

    // final array up to MAX_IMAGES
    const merged = [...remotePreviews, ...filteredLocalOnes].slice(0, MAX_IMAGES);

    setPreviewItems(merged);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [product, existingImageUrlsWatch]);

  // revoke blob URLs for any removed local items on unmount
  useEffect(() => {
    return () => {
      previewItems.forEach(item => {
        if (item.file && item.url.startsWith("blob:")) {
          try { URL.revokeObjectURL(item.url); } catch (e) {}
        }
      });
      if (pollingRef.current) {
        clearTimeout(pollingRef.current);
        pollingRef.current = null;
      }
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const totalImagesCount = previewItems.length;
  const canAddMoreImages = totalImagesCount < MAX_IMAGES;
  const canDeleteImages = totalImagesCount > 1;

  // Handle selected files -> create local preview entries
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

  // Remove a local-only preview
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

  // Delete remote image mutation
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

  // Upload mutation
  const uploadImagesMutation = useMutation({
    mutationFn: ({ productId, files }: { productId: string; files: File[] }) =>
      productService.uploadProductImages(productId, files),
    onMutate: async (vars) => {
      setIsUploadingImages(true);
      // mark the corresponding local preview items as uploading (by matching file object reference)
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
      // IMPORTANT: **Do not try to splice local items into remote items.**
      // Instead: rebuild previews from server product (source of truth) + remaining local files that weren't uploaded.
      // first, find local files that were not uploaded (should be none normally, but defensive)
      const remainingLocalFiles = previewItems.filter(p => !p.isExisting && p.file && !vars.files.includes(p.file)).map(p => p.file!);

      // Build remote previews from server product (prefer renditions)
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

      // build local previews for remainingLocalFiles (should be rarely used)
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

      // Deduplicate remotePreviews by URL
      const seen = new Set<string>();
      const dedupedRemote: PreviewItem[] = [];
      for (const r of remotePreviews) {
        if (!seen.has(r.url)) {
          dedupedRemote.push(r);
          seen.add(r.url);
        }
      }

      const merged = [...dedupedRemote, ...extraLocalPreviews].slice(0, MAX_IMAGES);

      // update form values and previewItems
      setValue("imageUrls", newProduct.imageUrls || [], { shouldDirty: true });
      setValue("imageFiles", merged.filter(p => !p.isExisting && p.file).map(p => p.file!), { shouldValidate: true });
      setPreviewItems(merged);

      queryClient.invalidateQueries({ queryKey: ["products"] });
      // do a refetch to make product in sync
      await refetchProduct();
      if (typeof onImagesUploaded === 'function') {
        const productId = newProduct._id;
        const statusNow = newProduct.imageProcessingStatus;
      
        // If already finished, call autosave immediately
        if (statusNow && statusNow !== 'pending') {
          try {
            await onImagesUploaded();
          } catch (e) {
            console.error('[ProductImageManager] onImagesUploaded failed (immediate)', e);
          }
        } else if (productId) {
          // Poll until processing finishes, then call onImagesUploaded
          const pollIntervalStart = 2000;
          const maxTime = 90_000; // total wait time before fallback
          let elapsed = 0;
          let delay = pollIntervalStart;
      
          const doPoll = async () => {
            try {
              const resp = await productService.getProductById(productId);
              const latest = resp?.product;
              const latestStatus = latest?.imageProcessingStatus;
              // eslint-disable-next-line no-console
              console.debug('[autosave-poll] product', productId, 'status', latestStatus);
      
              if (latest && latestStatus && latestStatus !== 'pending') {
                // final state reached
                try {
                  await refetchProduct();
                } catch (e) {
                  console.warn('[autosave-poll] refetchProduct failed', e);
                }
      
                // call autosave callback
                try {
                  await onImagesUploaded();
                } catch (e) {
                  console.error('[ProductImageManager] onImagesUploaded failed (after poll)', e);
                }
      
                // cleanup timer
                if (pollingRef.current) {
                  clearTimeout(pollingRef.current);
                  pollingRef.current = null;
                }
                return;
              }
      
              elapsed += delay;
              if (elapsed >= maxTime) {
                // give up: fallback behavior — refetch once and still call autosave (or skip if you prefer)
                try { await refetchProduct(); } catch (e) { /* ignore */ }
      
                try {
                  await onImagesUploaded();
                } catch (e) {
                  console.error('[ProductImageManager] onImagesUploaded failed (after timeout)', e);
                }
      
                if (pollingRef.current) {
                  clearTimeout(pollingRef.current);
                  pollingRef.current = null;
                }
                return;
              }
      
              // schedule next poll with gentle backoff
              const nextDelay = Math.min(5000, Math.round(delay * 1.5));
              pollingRef.current = window.setTimeout(doPoll, nextDelay);
              delay = nextDelay;
            } catch (err) {
              console.warn('[autosave-poll] error fetching product', err);
      
              elapsed += delay;
              if (elapsed >= maxTime) {
                try { await refetchProduct(); } catch (_) {}
                try { await onImagesUploaded(); } catch (e) { console.error('[ProductImageManager] onImagesUploaded failed (poll error)', e); }
                if (pollingRef.current) {
                  clearTimeout(pollingRef.current);
                  pollingRef.current = null;
                }
                return;
              }
      
              // schedule retry after backoff on error
              const nextDelay = Math.min(5000, Math.round(delay * 1.5));
              pollingRef.current = window.setTimeout(doPoll, nextDelay);
              delay = nextDelay;
            }
          };
      
          // kick off the first poll
          pollingRef.current = window.setTimeout(doPoll, delay);
        }
      }
    },
    onError: (err: any) => {
      toast.error(err?.response?.data?.message || "Failed to upload images.");
      // mark any uploading items as failed
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
    const toUpload = previewItems.filter(p => !p.isExisting && p.file).map(p => p.file!) ;
    if (toUpload.length === 0) {
      toast.error("Please select images to upload.");
      return;
    }
    uploadImagesMutation.mutate({ productId: product._id, files: toUpload });
  };

  const isProductImageProcessingPending = product?.imageProcessingStatus === "pending";
  const isImageOperationPending = isUploadingImages || isDeletingImage;

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
