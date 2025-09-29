import React, { useState, useCallback, useRef } from 'react';
import { 
  Upload, 
  FileImage, 
  Download, 
  X, 
  GripVertical, 
  CheckCircle,
  AlertCircle,
  Loader2
} from 'lucide-react';
import ImageUploader from './components/ImageUploader';
import ImagePreview from './components/ImagePreview';
import ConversionSettings from './components/ConversionSettings';
import { generatePDF } from './utils/pdfGenerator';
import type { ImageFile, ConversionOptions } from './types';

function App() {
  const [images, setImages] = useState<ImageFile[]>([]);
  const [isConverting, setIsConverting] = useState(false);
  const [conversionProgress, setConversionProgress] = useState(0);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const handleImagesUpload = useCallback((files: File[]) => {
    setError(null);
    setSuccess(null);
    
    if (images.length + files.length > 500) {
      setError(`Maximum 500 images allowed. You're trying to add ${files.length} more to ${images.length} existing images.`);
      return;
    }

    const validFiles = files.filter(file => {
      const isValidType = file.type.startsWith('image/');
      const isValidSize = file.size <= 10 * 1024 * 1024; // 10MB limit
      return isValidType && isValidSize;
    });

    if (validFiles.length !== files.length) {
      setError('Some files were skipped. Only image files under 10MB are allowed.');
    }

    const newImages: ImageFile[] = validFiles.map((file, index) => ({
      id: Date.now() + index,
      file,
      url: URL.createObjectURL(file),
      name: file.name,
      size: file.size,
    }));

    setImages(prev => [...prev, ...newImages]);
    
    if (validFiles.length > 0) {
      setSuccess(`Successfully added ${validFiles.length} image${validFiles.length > 1 ? 's' : ''}`);
    }
  }, [images.length]);

  const handleImageRemove = useCallback((id: number) => {
    setImages(prev => {
      const imageToRemove = prev.find(img => img.id === id);
      if (imageToRemove) {
        URL.revokeObjectURL(imageToRemove.url);
      }
      return prev.filter(img => img.id !== id);
    });
  }, []);

  const handleImageReorder = useCallback((dragIndex: number, hoverIndex: number) => {
    setImages(prev => {
      const draggedImage = prev[dragIndex];
      const newImages = [...prev];
      newImages.splice(dragIndex, 1);
      newImages.splice(hoverIndex, 0, draggedImage);
      return newImages;
    });
  }, []);

  const handleClearAll = useCallback(() => {
    images.forEach(image => URL.revokeObjectURL(image.url));
    setImages([]);
    setError(null);
    setSuccess('All images cleared');
  }, [images]);

  const handleConvertToPDF = useCallback(async (options: ConversionOptions) => {
    if (images.length === 0) {
      setError('Please upload at least one image');
      return;
    }

    setIsConverting(true);
    setConversionProgress(0);
    setError(null);
    setSuccess(null);

    try {
      const pdfBytes = await generatePDF(images, options, (progress) => {
        setConversionProgress(progress);
      });

      const blob = new Blob([pdfBytes], { type: 'application/pdf' });
      const url = URL.createObjectURL(blob);
      
      const a = document.createElement('a');
      a.href = url;
      a.download = options.filename || 'images-converted.pdf';
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);

      setSuccess(`PDF generated successfully! ${images.length} images converted.`);
    } catch (err) {
      setError('Failed to generate PDF. Please try again.');
      console.error('PDF generation error:', err);
    } finally {
      setIsConverting(false);
      setConversionProgress(0);
    }
  }, [images]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-slate-100">
      <div className="container mx-auto px-4 py-8">
        <header className="text-center mb-12">
          <div className="flex items-center justify-center mb-4">
            <div className="bg-blue-500 p-3 rounded-xl mr-4">
              <FileImage className="w-8 h-8 text-white" />
            </div>
            <h1 className="text-4xl font-bold text-gray-900">
              Image to PDF Converter
            </h1>
          </div>
          <p className="text-lg text-gray-600 max-w-2xl mx-auto">
            Upload up to 500 images and convert them into a single PDF document. 
            Supports drag & drop, image reordering, and customizable page layouts.
          </p>
        </header>

        {/* Status Messages */}
        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4 flex items-center">
            <AlertCircle className="w-5 h-5 text-red-500 mr-3 flex-shrink-0" />
            <p className="text-red-700">{error}</p>
          </div>
        )}

        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4 flex items-center">
            <CheckCircle className="w-5 h-5 text-green-500 mr-3 flex-shrink-0" />
            <p className="text-green-700">{success}</p>
          </div>
        )}

        {/* Upload Area */}
        <div className="mb-8">
          <ImageUploader 
            onImagesUpload={handleImagesUpload}
            maxImages={500}
            currentCount={images.length}
          />
        </div>

        {/* Image Preview and Controls */}
        {images.length > 0 && (
          <div className="grid grid-cols-1 lg:grid-cols-4 gap-8">
            {/* Image Preview */}
            <div className="lg:col-span-3">
              <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-xl font-semibold text-gray-900">
                    Images ({images.length}/500)
                  </h2>
                  <button
                    onClick={handleClearAll}
                    className="px-4 py-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors duration-200 flex items-center"
                  >
                    <X className="w-4 h-4 mr-2" />
                    Clear All
                  </button>
                </div>

                <ImagePreview
                  images={images}
                  onImageRemove={handleImageRemove}
                  onImageReorder={handleImageReorder}
                />
              </div>
            </div>

            {/* Conversion Settings */}
            <div className="lg:col-span-1">
              <ConversionSettings
                onConvert={handleConvertToPDF}
                isConverting={isConverting}
                progress={conversionProgress}
                imageCount={images.length}
              />
            </div>
          </div>
        )}

        {/* Conversion Progress */}
        {isConverting && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-white rounded-xl p-8 max-w-md w-full mx-4">
              <div className="text-center">
                <Loader2 className="w-12 h-12 text-blue-500 animate-spin mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  Converting Images to PDF
                </h3>
                <p className="text-gray-600 mb-4">
                  Processing {images.length} images...
                </p>
                <div className="w-full bg-gray-200 rounded-full h-3 mb-2">
                  <div
                    className="bg-blue-500 h-3 rounded-full transition-all duration-300"
                    style={{ width: `${conversionProgress}%` }}
                  ></div>
                </div>
                <p className="text-sm text-gray-500">
                  {Math.round(conversionProgress)}% Complete
                </p>
              </div>
            </div>
          </div>
        )}

        {/* Empty State */}
        {images.length === 0 && (
          <div className="text-center py-12">
            <div className="bg-gray-100 rounded-full p-6 w-24 h-24 mx-auto mb-6">
              <Upload className="w-12 h-12 text-gray-400" />
            </div>
            <h3 className="text-xl font-semibold text-gray-900 mb-2">
              No images uploaded yet
            </h3>
            <p className="text-gray-600">
              Upload your images using the area above to get started
            </p>
          </div>
        )}
      </div>
    </div>
  );
}

export default App;