import React, { useState } from 'react';
import Cropper from 'react-easy-crop';
import { getCroppedImg } from '../utils/cropImage';

const CropImageModal = ({ image, onClose, onCropComplete }) => {
  const [crop, setCrop] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [croppedAreaPixels, setCroppedAreaPixels] = useState(null);

  const handleDone = async () => {
    const blob = await getCroppedImg(image, croppedAreaPixels);
    onCropComplete(blob);
  };

  return (
    <div className="fixed inset-0 z-50 bg-black bg-opacity-60 flex justify-center items-center">
      <div className="bg-white p-4 rounded w-full max-w-md">
        <div className="h-64 relative">
          <Cropper
            image={image}
            crop={crop}
            zoom={zoom}
            aspect={1}
            onCropChange={setCrop}
            onCropComplete={(_, areaPixels) => setCroppedAreaPixels(areaPixels)}
            onZoomChange={setZoom}
          />
        </div>
        <div className="flex justify-between items-center mt-4">
          <button onClick={onClose} className="text-red-500">Cancel</button>
          <input
            type="range"
            min={1}
            max={3}
            step={0.1}
            value={zoom}
            onChange={(e) => setZoom(Number(e.target.value))}
          />
          <button onClick={handleDone} className="bg-blue-500 text-white px-4 py-1 rounded">Crop</button>
        </div>
      </div>
    </div>
  );
};

export default CropImageModal;
