import { Loader2 } from 'lucide-react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Badge } from '@/components/ui/badge';

interface TextDisplayProps {
  title: string;
  text: string;
  isLoading?: boolean;
  language?: string;
}

export const TextDisplay = ({ title, text, isLoading, language }: TextDisplayProps) => {
  const getLanguageName = (code?: string) => {
    const languages: Record<string, string> = {
      'nep': 'Nepali',
      'sin': 'Sinhala',
    };
    return code ? languages[code] || code : null;
  };

  return (
    <Card className="h-96">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">{title}</CardTitle>
          {language && (
            <Badge variant="secondary">{getLanguageName(language)}</Badge>
          )}
        </div>
      </CardHeader>
      <CardContent>
        <ScrollArea className="h-72 w-full rounded-md border bg-muted/30 p-4">
          {isLoading ? (
            <div className="flex items-center justify-center h-full">
              <Loader2 className="w-6 h-6 animate-spin text-primary" />
            </div>
          ) : text ? (
            <p className="whitespace-pre-wrap text-sm leading-relaxed">{text}</p>
          ) : (
            <p className="text-muted-foreground text-sm text-center">
              No text available
            </p>
          )}
        </ScrollArea>
      </CardContent>
    </Card>
  );
};
