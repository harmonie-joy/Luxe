import Image, { type ImageProps } from "next/image";
import type { ComponentPropsWithoutRef } from "react";

export interface MediaPreviewCardProps extends ComponentPropsWithoutRef<"div"> {
  image: ImageProps;
}

export function MediaPreviewCard({ image, children, className, ...props }: MediaPreviewCardProps) {
  return <div className={className} {...props}><Image {...image} alt={image.alt} />{children}</div>;
}