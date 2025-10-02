import { Download, Languages } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { useToast } from '@/hooks/use-toast';

interface TranslationControlsProps {
  onTranslate: () => void;
  extractedText: string;
  translatedText: string;
  isTranslating: boolean;
  detectedLanguage?: string;
}

export const TranslationControls = ({
  onTranslate,
  extractedText,
  translatedText,
  isTranslating,
  detectedLanguage,
}: TranslationControlsProps) => {
  const { toast } = useToast();

  const handleDownloadTxt = (text: string, filename: string) => {
    const blob = new Blob([text], { type: 'text/plain' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.click();
    URL.revokeObjectURL(url);
    
    toast({
      title: 'Download complete',
      description: `${filename} has been downloaded.`,
    });
  };

  return (
    <div className="flex flex-wrap gap-4 justify-center">
      <Button
        onClick={onTranslate}
        disabled={isTranslating || !extractedText || !detectedLanguage}
        size="lg"
        className="min-w-40"
      >
        <Languages className="w-4 h-4 mr-2" />
        {isTranslating ? 'Translating...' : 'Translate'}
      </Button>

      {translatedText && (
        <>
          <Button
            onClick={() => handleDownloadTxt(extractedText, 'extracted-text.txt')}
            variant="outline"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Original
          </Button>
          <Button
            onClick={() => handleDownloadTxt(translatedText, 'translated-text.txt')}
            variant="outline"
            size="lg"
          >
            <Download className="w-4 h-4 mr-2" />
            Download Translation
          </Button>
        </>
      )}
    </div>
  );
};
