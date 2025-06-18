// import React from "react";

export const ImgWithFallback = ({
  src,
  alt,
  fallbackSrc,
  mediaType,
  className,
  ...delegated
}: {
  src: string;
  alt: string;
  fallbackSrc: string;
  mediaType: string;
  className: string;
}) => {
  return (
    <picture>
      <source srcSet={src} type={mediaType} />
      <img className={className} src={fallbackSrc} alt={alt} {...delegated} />
    </picture>
  );
};
