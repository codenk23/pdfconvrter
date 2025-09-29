import React, { useCallback, useRef, useState } from 'react';
import { Upload, FileImage, AlertCircle } from 'lucide-react';

interface ImageUploaderProps {
  onImagesUpload: (files: File[]) => void;
  maxImages: number;
  currentCount: number;
}

const ImageUploader: React.FC<ImageUploaderProps> = ({
  onImagesUpload,
  maxImages,
  currentCount,
}) => {
  const [isDragOver, setIsDragOver] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleFileChange = useCallback((event: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.target.files || []);
    if (files.length > 0) {
      onImagesUpload(files);
    }
    // Reset input value to allow re-uploading the same files
    if (event.target) {
      event.target.value = '';
    }
  }, [onImagesUpload]);

  const handleDrop = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
    
    const files = Array.from(event.dataTransfer.files);
    const imageFiles = files.filter(file => file.type.startsWith('image/'));
    
    if (imageFiles.length > 0) {
      onImagesUpload(imageFiles);
    }
  }, [onImagesUpload]);

  const handleDragOver = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(true);
  }, []);

  const handleDragLeave = useCallback((event: React.DragEvent) => {
    event.preventDefault();
    setIsDragOver(false);
  }, []);

  const handleClick = useCallback(() => {
    fileInputRef.current?.click();
  }, []);

  const remainingSlots = maxImages - currentCount;
  const isMaxReached = remainingSlots <= 0;

  return (
    <div className="w-full">
      <div
        className={`
          relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer
          transition-all duration-300 ease-in-out
          ${isDragOver 
            ? 'border-blue-400 bg-blue-50 scale-105' 
            : isMaxReached
            ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
            : 'border-gray-300 hover:border-blue-400 hover:bg-blue-50'
          }
        `}
        onDrop={handleDrop}
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onClick={!isMaxReached ? handleClick : undefined}
      >
        <input
          ref={fileInputRef}
          type="file"
          multiple
          accept="image/*"
          onChange={handleFileChange}
          className="hidden"
          disabled={isMaxReached}
        />
        
        <div className="flex flex-col items-center">
          {isMaxReached ? (
            <>
              <AlertCircle className="w-16 h-16 text-gray-400 mb-4" />
              <h3 className="text-xl font-semibold text-gray-600 mb-2">
                Maximum images reached
              </h3>
              <p className="text-gray-500">
                You've reached the limit of {maxImages} images
              </p>
            </>
          ) : (
            <>
              <div className={`
                p-4 rounded-full mb-4 transition-colors duration-200
                ${isDragOver ? 'bg-blue-100' : 'bg-gray-100'}
              `}>
                {isDragOver ? (
                  <FileImage className="w-8 h-8 text-blue-500" />
                ) : (
                  <Upload className="w-8 h-8 text-gray-500" />
                )}
              </div>
              
              <h3 className={`
                text-xl font-semibold mb-2 transition-colors duration-200
                ${isDragOver ? 'text-blue-600' : 'text-gray-900'}
              `}>
                {isDragOver ? 'Drop images here' : 'Upload Images'}
              </h3>
              
              <p className="text-gray-600 mb-4">
                Drag and drop your images or click to browse
              </p>
              
              <div className="bg-white rounded-lg p-4 border border-gray-200">
                <div className="flex flex-wrap gap-4 text-sm text-gray-600">
                  <span>• Up to {remainingSlots} more images</span>
                  <span>• Max 10MB per image</span>
                  <span>• JPG, PNG, GIF, WebP</span>
                </div>
              </div>
            </>
          )}
        </div>
      </div>
      
      {currentCount > 0 && (
        <div className="mt-4 text-center">
          <div className="inline-flex items-center px-3 py-1 rounded-full bg-blue-100 text-blue-800">
            <FileImage className="w-4 h-4 mr-2" />
            <span className="text-sm font-medium">
              {currentCount} / {maxImages} images uploaded
            </span>
          </div>
        </div>
      )}
    </div>
  );
};

export default ImageUploader;