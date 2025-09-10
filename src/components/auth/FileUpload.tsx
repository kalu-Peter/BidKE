import React from "react";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Upload } from "lucide-react";

interface FileUploadProps {
  label: string;
  accept?: string;
  onChange: (file: File | null) => void;
  required?: boolean;
  multiple?: boolean;
  preview?: string;
}

const FileUpload: React.FC<FileUploadProps> = ({
  label,
  accept = "image/*",
  onChange,
  required = false,
  multiple = false,
  preview
}) => {
  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0] || null;
    onChange(file);
  };

  return (
    <div className="space-y-2">
      <Label>
        {label}
        {required && <span className="text-red-500 ml-1">*</span>}
      </Label>
      <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center hover:border-primary transition-colors">
        <input
          type="file"
          accept={accept}
          onChange={handleFileChange}
          multiple={multiple}
          className="hidden"
          id={`file-${label.toLowerCase().replace(/\s+/g, '-')}`}
        />
        <label
          htmlFor={`file-${label.toLowerCase().replace(/\s+/g, '-')}`}
          className="cursor-pointer flex flex-col items-center space-y-2"
        >
          <Upload className="w-8 h-8 text-gray-400" />
          <span className="text-sm text-gray-600">
            Click to upload {label.toLowerCase()}
          </span>
          <span className="text-xs text-gray-400">
            {accept === "image/*" ? "PNG, JPG, JPEG up to 5MB" : "PDF, DOC, DOCX up to 10MB"}
          </span>
        </label>
        {preview && (
          <div className="mt-4">
            <img src={preview} alt="Preview" className="max-w-32 max-h-32 mx-auto rounded" />
          </div>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
