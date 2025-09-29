import React, { useCallback, useRef } from 'react';
import { X, GripVertical } from 'lucide-react';
import type { ImageFile } from '../types';

interface ImagePreviewProps {
  images: ImageFile[];
  onImageRemove: (id: number) => void;
  onImageReorder: (dragIndex: number, hoverIndex: number) => void;
}

const ImagePreview: React.FC<ImagePreviewProps> = ({
  images,
  onImageRemove,
  onImageReorder,
}) => {
  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  const handleDragStart = useCallback((index: number) => {
    dragItem.current = index;
  }, []);

  const handleDragEnter = useCallback((index: number) => {
    dragOverItem.current = index;
  }, []);

  const handleDragEnd = useCallback(() => {
    if (dragItem.current !== null && dragOverItem.current !== null && 
        dragItem.current !== dragOverItem.current) {
      onImageReorder(dragItem.current, dragOverItem.current);
    }
    dragItem.current = null;
    dragOverItem.current = null;
  }, [onImageReorder]);

  const formatFileSize = (bytes: number): string => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-4">
      {images.map((image, index) => (
        <div
          key={image.id}
          draggable
          onDragStart={() => handleDragStart(index)}
          onDragEnter={() => handleDragEnter(index)}
          onDragEnd={handleDragEnd}
          className="group relative bg-white rounded-lg border border-gray-200 overflow-hidden shadow-sm hover:shadow-md transition-all duration-200 cursor-move"
        >
          {/* Drag Handle */}
          <div className="absolute top-2 left-2 z-10 opacity-0 group-hover:opacity-100 transition-opacity duration-200">
            <div className="bg-black bg-opacity-50 rounded p-1">
              <GripVertical className="w-4 h-4 text-white" />
            </div>
          </div>

          {/* Remove Button */}
          <button
            onClick={() => onImageRemove(image.id)}
            className="absolute top-2 right-2 z-10 bg-red-500 hover:bg-red-600 text-white rounded-full p-1 opacity-0 group-hover:opacity-100 transition-all duration-200 transform hover:scale-110"
            title="Remove image"
          >
            <X className="w-4 h-4" />
          </button>

          {/* Image */}
          <div className="aspect-square">
            <img
              src={image.url}
              alt={image.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          </div>

          {/* Image Info */}
          <div className="p-3">
            <h4 className="text-xs font-medium text-gray-900 truncate mb-1" title={image.name}>
              {image.name}
            </h4>
            <p className="text-xs text-gray-500">
              {formatFileSize(image.size)}
            </p>
          </div>

          {/* Order Number */}
          <div className="absolute bottom-2 left-2 bg-blue-500 text-white text-xs rounded-full w-6 h-6 flex items-center justify-center font-medium">
            {index + 1}
          </div>
        </div>
      ))}
    </div>
  );
};

export default ImagePreview;