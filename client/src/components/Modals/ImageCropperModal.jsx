import React, { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import ModalWrapper from './ModalWrapper';
import { X, Check } from 'lucide-react';

const createImage = (url) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.addEventListener('load', () => resolve(image));
    image.addEventListener('error', (error) => reject(error));
    image.setAttribute('crossOrigin', 'anonymous');
    image.src = url;
  });

function getRadianAngle(degreeValue) {
  return (degreeValue * Math.PI) / 180;
}

/**
 * Returns the new bounding area of a rotated rectangle.
 */
function rotateSize(width, height, rotation) {
  const rotRad = getRadianAngle(rotation);

  return {
    width:
      Math.abs(Math.cos(rotRad) * width) + Math.abs(Math.sin(rotRad) * height),
    height:
      Math.abs(Math.sin(rotRad) * width) + Math.abs(Math.cos(rotRad) * height),
  };
}

/**
 * This function was adapted from the one in the ReadMe of https://github.com/DominicTobias/react-image-crop
 */
async function getCroppedImg(
  imageSrc,
  pixelCrop,
  rotation = 0,
  flip = { horizontal: false, vertical: false }
) {
  const image = await createImage(imageSrc);
  const canvas = document.createElement('canvas');
  const ctx = canvas.getContext('2d');

  if (!ctx) {
    return null;
  }

  const rotRad = getRadianAngle(rotation);

  // calculate bounding box of the rotated image
  const { width: bBoxWidth, height: bBoxHeight } = rotateSize(
    image.width,
    image.height,
    rotation
  );

  // set canvas size to match the bounding box
  canvas.width = bBoxWidth;
  canvas.height = bBoxHeight;

  // translate canvas context to a central location to allow rotating and flipping around the center
  ctx.translate(bBoxWidth / 2, bBoxHeight / 2);
  ctx.rotate(rotRad);
  ctx.scale(flip.horizontal ? -1 : 1, flip.vertical ? -1 : 1);
  ctx.translate(-image.width / 2, -image.height / 2);

  // draw rotated image
  ctx.drawImage(image, 0, 0);

  // croppedAreaPixels values are bounding box relative
  // extract the cropped image using these values
  const data = ctx.getImageData(
    pixelCrop.x,
    pixelCrop.y,
    pixelCrop.width,
    pixelCrop.height
  );

  // set canvas width to final desired crop size - this will clear existing context
  canvas.width = pixelCrop.width;
  canvas.height = pixelCrop.height;

  // paste generated rotate image at the top left corner
  ctx.putImageData(data, 0, 0);

  // As a base64 string
  return canvas.toDataURL('image/jpeg');
}

export default function ImageCropperModal({ 
  isOpen, 
  onClose, 
  imageSrc, 
  onCropComplete, 
  aspectRatio = 1 
}) {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  const onCropCompleteInternal = useCallback((croppedArea, croppedAreaPixels) => {
    setCroppedAreaPixels(croppedAreaPixels);
  }, []);

  const handleSave = async () => {
    try {
      setIsProcessing(true);
      const croppedImageBase64 = await getCroppedImg(
        imageSrc,
        croppedAreaPixels,
        0
      );
      onCropComplete(croppedImageBase64);
    } catch (e) {
      console.error(e);
      console.error('Error cropping image', e);
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <ModalWrapper isOpen={isOpen} zIndex={2000}>
      <div className="bg-surface p-6 rounded-3xl w-[90vw] max-w-md shadow-float border border-white/20 animate-slide-up flex flex-col gap-4 relative">
        <h3 className="m-0 text-xl font-extrabold text-text-main">Crop Image</h3>
        
        <div className="relative w-full h-[300px] bg-black/5 rounded-xl overflow-hidden">
          {imageSrc && (
            <Cropper
              image={imageSrc}
              crop={crop}
              zoom={zoom}
              aspect={aspectRatio}
              onCropChange={setCrop}
              onCropComplete={onCropCompleteInternal}
              onZoomChange={setZoom}
            />
          )}
        </div>
        
        <div className="flex flex-col gap-1">
          <label className="text-xs font-bold text-text-muted uppercase tracking-wider">Zoom</label>
          <input
            type="range"
            value={zoom}
            min={1}
            max={3}
            step={0.1}
            aria-labelledby="Zoom"
            onChange={(e) => setZoom(e.target.value)}
            className="w-full accent-primary"
          />
        </div>

        <div className="flex gap-3 mt-2">
          <button 
            onClick={onClose} 
            disabled={isProcessing}
            className="flex-1 p-3 bg-slate-100 dark:bg-slate-800 text-text-muted font-bold border-none rounded-xl cursor-pointer hover:bg-slate-200 dark:hover:bg-slate-700 transition-colors"
          >
            Cancel
          </button>
          <button 
            onClick={handleSave} 
            disabled={isProcessing}
            className="flex-1 p-3 bg-primary text-white font-bold border-none rounded-xl cursor-pointer hover:bg-primary-hover transition-colors shadow-md shadow-primary/20 flex items-center justify-center gap-2"
          >
            {isProcessing ? 'Processing...' : <><Check size={18} /> Apply Crop</>}
          </button>
        </div>
      </div>
    </ModalWrapper>
  );
}
