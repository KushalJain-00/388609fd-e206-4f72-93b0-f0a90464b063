import { useState } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { useToast } from '@/hooks/use-toast';

export const useTranslation = () => {
  const [translatedText, setTranslatedText] = useState('');
  const [isTranslating, setIsTranslating] = useState(false);
  const { toast } = useToast();

  const translate = async (text: string, sourceLang: string) => {
    setIsTranslating(true);
    setTranslatedText('');

    try {
      const { data, error } = await supabase.functions.invoke('translate-text', {
        body: { text, sourceLang },
      });

      if (error) {
        throw error;
      }

      if (data.error) {
        throw new Error(data.error);
      }

      setTranslatedText(data.translatedText);
      toast({
        title: 'Translation complete',
        description: 'Text has been successfully translated to English.',
      });

    } catch (error) {
      console.error('Translation Error:', error);
      
      let errorMessage = 'An error occurred during translation';
      
      if (error instanceof Error) {
        errorMessage = error.message;
        
        if (error.message.includes('503') || error.message.includes('loading')) {
          errorMessage = 'Translation model is loading. Please wait a few seconds and try again.';
        }
      }

      toast({
        title: 'Translation failed',
        description: errorMessage,
        variant: 'destructive',
      });
    } finally {
      setIsTranslating(false);
    }
  };

  return {
    translatedText,
    isTranslating,
    translate,
  };
};
