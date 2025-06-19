import { useState } from 'react';
import { fileAPI } from '../lib/api';
import { Button } from './ui/button';
import { Card } from './ui/card';
import { Progress } from './ui/progress';
import { useToast } from './ui/use-toast';

export function FileUpload() {
  const [files, setFiles] = useState<File[]>([]);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const { toast } = useToast();

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const selectedFiles = Array.from(event.target.files || []);
    setFiles(selectedFiles);
  };

  const handleUpload = async () => {
    if (files.length === 0) return;

    setUploading(true);
    setProgress(0);

    try {
      for (let i = 0; i < files.length; i++) {
        const file = files[i];
        await fileAPI.uploadFile(file);
        setProgress(((i + 1) / files.length) * 100);
      }

      toast({
        title: 'Success',
        description: 'Files uploaded successfully',
      });
      setFiles([]);
    } catch (error) {
      toast({
        title: 'Error',
        description: 'Failed to upload files',
        variant: 'destructive',
      });
    } finally {
      setUploading(false);
      setProgress(0);
    }
  };

  return (
    <Card className="w-full max-w-4xl mx-auto p-4">
      <div className="space-y-4">
        <div className="flex items-center gap-4">
          <input
            type="file"
            multiple
            accept=".pdf,.xlsx,.xls"
            onChange={handleFileSelect}
            className="hidden"
            id="file-upload"
          />
          <label htmlFor="file-upload">
            <Button variant="outline" asChild>
              <span>Select Files</span>
            </Button>
          </label>
          <Button
            onClick={handleUpload}
            disabled={files.length === 0 || uploading}
          >
            {uploading ? 'Uploading...' : 'Upload'}
          </Button>
        </div>

        {files.length > 0 && (
          <div className="space-y-2">
            <p className="text-sm text-muted-foreground">
              Selected files: {files.length}
            </p>
            <ul className="text-sm">
              {files.map((file, index) => (
                <li key={index}>{file.name}</li>
              ))}
            </ul>
          </div>
        )}

        {uploading && (
          <div className="space-y-2">
            <Progress value={progress} />
            <p className="text-sm text-muted-foreground">
              Uploading... {Math.round(progress)}%
            </p>
          </div>
        )}
      </div>
    </Card>
  );
} 