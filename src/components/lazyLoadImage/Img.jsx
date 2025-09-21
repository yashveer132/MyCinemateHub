import React from "react";
import { LazyLoadImage } from "react-lazy-load-image-component";
import "react-lazy-load-image-component/src/effects/blur.css";

const Img = ({ src, className, objectFit }) => {
  return (
    <LazyLoadImage
      className={className || ""}
      alt=""
      effect="blur"
      src={src || ""}
      style={objectFit ? { objectFit } : undefined}
    />
  );
};

export default Img;
