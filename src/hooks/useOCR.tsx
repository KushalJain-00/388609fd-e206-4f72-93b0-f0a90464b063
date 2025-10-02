import { useState } from 'react';
import { createWorker } from 'tesseract.js';
import * as pdfjsLib from 'pdfjs-dist';
import { useToast } from '@/hooks/use-toast';

// Set worker path for PDF.js
pdfjsLib.GlobalWorkerOptions.workerSrc = `//cdnjs.cloudflare.com/ajax/libs/pdf.js/${pdfjsLib.version}/pdf.worker.min.js`;

export const useOCR = () => {
  const [extractedText, setExtractedText] = useState('');
  const [isExtracting, setIsExtracting] = useState(false);
  const [detectedLanguage, setDetectedLanguage] = useState<'nep' | 'sin' | undefined>();
  const { toast } = useToast();

  const detectLanguage = (text: string): 'nep' | 'sin' | undefined => {
    // Nepali Unicode range: \u0900-\u097F
    // Sinhala Unicode range: \u0D80-\u0DFF
    const nepaliRegex = /[\u0900-\u097F]/;
    const sinhalaRegex = /[\u0D80-\u0DFF]/;

    if (nepaliRegex.test(text)) {
      return 'nep';
    } else if (sinhalaRegex.test(text)) {
      return 'sin';
    }
    return undefined;
  };

  const extractTextFromImage = async (imageData: string, lang: string) => {
    const worker = await createWorker(lang);
    const { data } = await worker.recognize(imageData);
    await worker.terminate();
    return data.text;
  };

  const pdfToImage = async (file: File): Promise<string[]> => {
    const arrayBuffer = await file.arrayBuffer();
    const pdf = await pdfjsLib.getDocument({ data: arrayBuffer }).promise;
    const images: string[] = [];

    for (let i = 1; i <= pdf.numPages; i++) {
      const page = await pdf.getPage(i);
      const viewport = page.getViewport({ scale: 2.0 });
      
      const canvas = document.createElement('canvas');
      const context = canvas.getContext('2d');
      
      if (!context) continue;
      
      canvas.height = viewport.height;
      canvas.width = viewport.width;

      await page.render({
        canvasContext: context,
        viewport: viewport,
      } as any).promise;

      images.push(canvas.toDataURL('image/png'));
    }

    return images;
  };

  const extractText = async (file: File) => {
    setIsExtracting(true);
    setExtractedText('');
    setDetectedLanguage(undefined);

    try {
      let imagesToProcess: string[] = [];

      if (file.type === 'application/pdf') {
        toast({
          title: 'Processing PDF',
          description: 'Converting PDF pages to images...',
        });
        imagesToProcess = await pdfToImage(file);
      } else {
        imagesToProcess = [URL.createObjectURL(file)];
      }

      // Try both languages and pick the one with better results
      const texts: string[] = [];
      
      for (const image of imagesToProcess) {
        // Try Nepali first
        const nepaliText = await extractTextFromImage(image, 'nep');
        // Try Sinhala
        const sinhalaText = await extractTextFromImage(image, 'sin');
        
        // Choose the text with more content
        const selectedText = nepaliText.length > sinhalaText.length ? nepaliText : sinhalaText;
        texts.push(selectedText);
      }

      const fullText = texts.join('\n\n').trim();

      if (!fullText) {
        toast({
          title: 'No text found',
          description: 'Could not extract text from the image. Please try a clearer image.',
          variant: 'destructive',
        });
        setIsExtracting(false);
        return;
      }

      setExtractedText(fullText);
      
      // Detect language
      const lang = detectLanguage(fullText);
      setDetectedLanguage(lang);

      if (!lang) {
        toast({
          title: 'Language detection failed',
          description: 'Could not detect Nepali or Sinhala text. Please ensure the image contains text in one of these languages.',
          variant: 'destructive',
        });
      } else {
        toast({
          title: 'Text extracted successfully',
          description: `Detected language: ${lang === 'nep' ? 'Nepali' : 'Sinhala'}`,
        });
      }

    } catch (error) {
      console.error('OCR Error:', error);
      toast({
        title: 'Extraction failed',
        description: error instanceof Error ? error.message : 'An error occurred during text extraction',
        variant: 'destructive',
      });
    } finally {
      setIsExtracting(false);
    }
  };

  return {
    extractedText,
    isExtracting,
    extractText,
    detectedLanguage,
  };
};
