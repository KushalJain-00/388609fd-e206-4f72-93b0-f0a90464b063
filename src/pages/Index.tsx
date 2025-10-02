import { useState } from 'react';
import { FileUpload } from '@/components/FileUpload';
import { TextDisplay } from '@/components/TextDisplay';
import { TranslationControls } from '@/components/TranslationControls';
import { useOCR } from '@/hooks/useOCR';
import { useTranslation } from '@/hooks/useTranslation';

const Index = () => {
  const [file, setFile] = useState<File | null>(null);
  const [previewUrl, setPreviewUrl] = useState<string>('');
  const { extractedText, isExtracting, extractText, detectedLanguage } = useOCR();
  const { translatedText, isTranslating, translate } = useTranslation();

  const handleFileSelect = async (selectedFile: File) => {
    setFile(selectedFile);
    
    // Create preview URL
    if (selectedFile.type.startsWith('image/')) {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    } else if (selectedFile.type === 'application/pdf') {
      setPreviewUrl(URL.createObjectURL(selectedFile));
    }

    // Auto-extract text
    await extractText(selectedFile);
  };

  const handleTranslate = async () => {
    if (extractedText && detectedLanguage) {
      await translate(extractedText, detectedLanguage);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-primary/5">
      <div className="container mx-auto px-4 py-8">
        {/* Header */}
        <div className="text-center mb-8">
          <h1 className="text-4xl font-bold bg-gradient-to-r from-primary to-primary/60 bg-clip-text text-transparent mb-2">
            AI Translation Studio
          </h1>
          <p className="text-muted-foreground">
            Nepali & Sinhala to English Translation with OCR
          </p>
        </div>

        {/* Upload Section */}
        <div className="mb-8">
          <FileUpload onFileSelect={handleFileSelect} />
        </div>

        {/* Preview Section */}
        {previewUrl && (
          <div className="mb-8 bg-card rounded-lg p-4 border">
            <h3 className="text-sm font-medium mb-2 text-muted-foreground">Preview</h3>
            {file?.type.startsWith('image/') && (
              <img 
                src={previewUrl} 
                alt="Preview" 
                className="max-h-64 mx-auto rounded-lg shadow-sm"
              />
            )}
            {file?.type === 'application/pdf' && (
              <div className="text-center p-8 bg-muted/50 rounded-lg">
                <p className="text-muted-foreground">PDF: {file.name}</p>
              </div>
            )}
          </div>
        )}

        {/* Text Display Section */}
        <div className="grid md:grid-cols-2 gap-6 mb-6">
          <TextDisplay
            title="Extracted Text"
            text={extractedText}
            isLoading={isExtracting}
            language={detectedLanguage}
          />
          <TextDisplay
            title="Translated Text (English)"
            text={translatedText}
            isLoading={isTranslating}
          />
        </div>

        {/* Controls */}
        {extractedText && (
          <TranslationControls
            onTranslate={handleTranslate}
            extractedText={extractedText}
            translatedText={translatedText}
            isTranslating={isTranslating}
            detectedLanguage={detectedLanguage}
          />
        )}
      </div>
    </div>
  );
};

export default Index;
