import React, { useState, useCallback } from 'react';
import { Download, Settings, FileText, Loader2 } from 'lucide-react';
import type { ConversionOptions } from '../types';

interface ConversionSettingsProps {
  onConvert: (options: ConversionOptions) => void;
  isConverting: boolean;
  progress: number;
  imageCount: number;
}

const ConversionSettings: React.FC<ConversionSettingsProps> = ({
  onConvert,
  isConverting,
  progress,
  imageCount,
}) => {
  const [options, setOptions] = useState<ConversionOptions>({
    pageSize: 'A4',
    orientation: 'portrait',
    margin: 20,
    quality: 'high',
    filename: 'images-converted',
    imagesPerPage: 1,
  });

  const handleOptionChange = useCallback(<K extends keyof ConversionOptions>(
    key: K,
    value: ConversionOptions[K]
  ) => {
    setOptions(prev => ({ ...prev, [key]: value }));
  }, []);

  const handleConvert = useCallback(() => {
    if (!isConverting && imageCount > 0) {
      onConvert(options);
    }
  }, [onConvert, options, isConverting, imageCount]);

  const estimatedFileSize = Math.round((imageCount * 0.5) * (options.quality === 'high' ? 1 : options.quality === 'medium' ? 0.7 : 0.4));

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 sticky top-8">
      <div className="flex items-center mb-6">
        <Settings className="w-5 h-5 text-gray-600 mr-2" />
        <h3 className="text-lg font-semibold text-gray-900">PDF Settings</h3>
      </div>

      <div className="space-y-6">
        {/* Page Size */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Size
          </label>
          <select
            value={options.pageSize}
            onChange={(e) => handleOptionChange('pageSize', e.target.value as 'A4' | 'Letter' | 'Legal')}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value="A4">A4 (210 × 297 mm)</option>
            <option value="Letter">Letter (8.5 × 11 in)</option>
            <option value="Legal">Legal (8.5 × 14 in)</option>
          </select>
        </div>

        {/* Orientation */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Orientation
          </label>
          <div className="grid grid-cols-2 gap-2">
            <button
              onClick={() => handleOptionChange('orientation', 'portrait')}
              className={`p-3 border rounded-lg text-sm font-medium transition-all duration-200 ${
                options.orientation === 'portrait'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Portrait
            </button>
            <button
              onClick={() => handleOptionChange('orientation', 'landscape')}
              className={`p-3 border rounded-lg text-sm font-medium transition-all duration-200 ${
                options.orientation === 'landscape'
                  ? 'border-blue-500 bg-blue-50 text-blue-700'
                  : 'border-gray-300 hover:border-gray-400'
              }`}
            >
              Landscape
            </button>
          </div>
        </div>

        {/* Images Per Page */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Images Per Page
          </label>
          <select
            value={options.imagesPerPage}
            onChange={(e) => handleOptionChange('imagesPerPage', Number(e.target.value) as 1 | 2 | 4)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
          >
            <option value={1}>1 image per page</option>
            <option value={2}>2 images per page</option>
            <option value={4}>4 images per page</option>
          </select>
        </div>

        {/* Quality */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Image Quality
          </label>
          <div className="grid grid-cols-3 gap-2">
            {(['high', 'medium', 'low'] as const).map((quality) => (
              <button
                key={quality}
                onClick={() => handleOptionChange('quality', quality)}
                className={`p-2 border rounded-lg text-xs font-medium transition-all duration-200 ${
                  options.quality === quality
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-gray-300 hover:border-gray-400'
                }`}
              >
                {quality.charAt(0).toUpperCase() + quality.slice(1)}
              </button>
            ))}
          </div>
        </div>

        {/* Margin */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Page Margin: {options.margin}px
          </label>
          <input
            type="range"
            min="0"
            max="50"
            value={options.margin}
            onChange={(e) => handleOptionChange('margin', Number(e.target.value))}
            className="w-full h-2 bg-gray-200 rounded-lg appearance-none cursor-pointer slider"
          />
          <div className="flex justify-between text-xs text-gray-500 mt-1">
            <span>0px</span>
            <span>25px</span>
            <span>50px</span>
          </div>
        </div>

        {/* Filename */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Filename
          </label>
          <input
            type="text"
            value={options.filename}
            onChange={(e) => handleOptionChange('filename', e.target.value)}
            className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            placeholder="Enter filename (without .pdf)"
          />
        </div>

        {/* File Info */}
        <div className="bg-gray-50 rounded-lg p-4">
          <div className="flex items-center mb-2">
            <FileText className="w-4 h-4 text-gray-500 mr-2" />
            <span className="text-sm font-medium text-gray-700">PDF Info</span>
          </div>
          <div className="space-y-1 text-xs text-gray-600">
            <div className="flex justify-between">
              <span>Images:</span>
              <span>{imageCount}</span>
            </div>
            <div className="flex justify-between">
              <span>Pages:</span>
              <span>{Math.ceil(imageCount / options.imagesPerPage)}</span>
            </div>
            <div className="flex justify-between">
              <span>Est. Size:</span>
              <span>~{estimatedFileSize} MB</span>
            </div>
          </div>
        </div>

        {/* Convert Button */}
        <button
          onClick={handleConvert}
          disabled={isConverting || imageCount === 0}
          className={`
            w-full py-4 px-6 rounded-lg font-medium transition-all duration-200 flex items-center justify-center
            ${isConverting || imageCount === 0
              ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
              : 'bg-blue-500 hover:bg-blue-600 text-white hover:shadow-lg transform hover:scale-105'
            }
          `}
        >
          {isConverting ? (
            <>
              <Loader2 className="w-5 h-5 mr-2 animate-spin" />
              Converting... {Math.round(progress)}%
            </>
          ) : (
            <>
              <Download className="w-5 h-5 mr-2" />
              Convert to PDF
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ConversionSettings;