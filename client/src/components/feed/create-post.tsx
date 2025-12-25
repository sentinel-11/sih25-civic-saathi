import { useRef, useState } from 'react';
import { useAuth } from '@/hooks/use-auth';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { analyzeIssue, AIAnalysis } from '@/lib/gemini';
import { createGeminiRealtimeClient } from '@/lib/gemini-realtime';
import { User, CloudUpload, MapPin, Hash, Send, Loader2, Bot } from 'lucide-react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { apiRequest } from '@/lib/queryClient';

export function CreatePost() {
  const [description, setDescription] = useState('');
  const [images, setImages] = useState<File[]>([]);
  const [location, setLocation] = useState('');
  const [analysis, setAnalysis] = useState<AIAnalysis | null>(null);
  const [recording, setRecording] = useState(false);
  const rtClientRef = useRef<ReturnType<typeof createGeminiRealtimeClient> | null>(null);
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const { user } = useAuth();
  const { toast } = useToast();
  const queryClient = useQueryClient();

  const createIssueMutation = useMutation({
    mutationFn: async (data: any) => {
      return apiRequest('POST', '/api/issues', data);
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['/api/issues'] });
      setDescription('');
      setImages([]);
      setLocation('');
      setAnalysis(null);
      toast({
        title: 'Issue Reported',
        description: 'Your maintenance issue has been submitted successfully.',
      });
    },
    onError: () => {
      toast({
        title: 'Error',
        description: 'Failed to submit issue. Please try again.',
        variant: 'destructive',
      });
    },
  });

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files) {
      setImages(Array.from(e.target.files));
    }
  };

  // Build a collage from multiple images so AI can see all photos at once
  const buildCollageFromDataUrls = async (urls: string[]): Promise<string> => {
    if (urls.length === 0) return '';
    const cols = Math.ceil(Math.sqrt(urls.length));
    const rows = Math.ceil(urls.length / cols);
    const tileSize = 256; // per-image tile size

    const canvas = document.createElement('canvas');
    canvas.width = cols * tileSize;
    canvas.height = rows * tileSize;
    const ctx = canvas.getContext('2d');
    if (!ctx) return urls[0];

    const loadImage = (src: string) => new Promise<HTMLImageElement>((resolve, reject) => {
      const img = new Image();
      img.onload = () => resolve(img);
      img.onerror = () => reject(new Error('Failed to load image'));
      img.src = src;
    });

    for (let i = 0; i < urls.length; i++) {
      try {
        const img = await loadImage(urls[i]);
        const c = i % cols;
        const r = Math.floor(i / cols);
        const x = c * tileSize;
        const y = r * tileSize;
        const scale = Math.max(tileSize / img.width, tileSize / img.height);
        const dw = img.width * scale;
        const dh = img.height * scale;
        const dx = x + (tileSize - dw) / 2;
        const dy = y + (tileSize - dh) / 2;
        ctx.drawImage(img, dx, dy, dw, dh);
      } catch {}
    }

    return canvas.toDataURL('image/jpeg', 0.9);
  };

  const performAnalysis = async () => {
    if (!description.trim()) return;

    setIsAnalyzing(true);
    try {
      let imageBase64 = '';
      if (images.length > 0) {
        // Convert all selected images to data URLs
        const urls: string[] = await Promise.all(
          images.map((file) => new Promise<string>((resolve, reject) => {
            const reader = new FileReader();
            reader.onload = () => resolve(reader.result as string);
            reader.onerror = () => reject(new Error('Failed to read image'));
            reader.readAsDataURL(file);
          }))
        );
        // Build collage so the AI sees all images together
        imageBase64 = await buildCollageFromDataUrls(urls);
      }

      const result = await analyzeIssue(description, imageBase64);
      setAnalysis(result);
    } catch (error) {
      console.error('Analysis failed:', error);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const handleSubmit = async () => {
    if (!user) return;
    if (!description.trim()) {
      toast({ title: 'Description required', description: 'Please enter a description for the issue.', variant: 'destructive' });
      return;
    }

    if (!analysis) {
      await performAnalysis();
      return;
    }

    // Convert all selected images to base64 data URLs for storage/display
    const imageUrls: string[] = await Promise.all(
      images.map((file) =>
        new Promise<string>((resolve, reject) => {
          const reader = new FileReader();
          reader.onload = () => resolve(reader.result as string);
          reader.onerror = () => reject(new Error('Failed to read image'));
          reader.readAsDataURL(file);
        })
      )
    );

    if (!location.trim()) {
      toast({ title: 'Location required', description: 'Please enter the issue location.', variant: 'destructive' });
      return;
    }

    await createIssueMutation.mutateAsync({
      title: description.substring(0, 100),
      description,
      location,
      imageUrls,
      aiAnalysis: analysis,
      category: analysis.category,
      severity: analysis.severity,
      reporterId: user.id,
    });
  };

  if (!user) return null;

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h2 className="text-xl font-semibold text-gray-900 mb-2">Report an Issue</h2>
        <p className="text-gray-600">Describe the maintenance issue you've encountered</p>
      </div>
      
      <div className="space-y-6">
        <div className="flex items-start space-x-4">
          <div className="h-12 w-12 bg-gray-800 rounded-full flex items-center justify-center flex-shrink-0 shadow-md">
            <User className="text-white" size={20} />
          </div>
          
          <div className="flex-1 space-y-5">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <label className="text-sm font-medium text-gray-700">Description *</label>
                <div className="flex items-center gap-2">
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={async () => {
                      try {
                        if (recording) {
                          rtClientRef.current?.stop();
                          rtClientRef.current = null;
                          setRecording(false);
                          return;
                        }
                        rtClientRef.current = createGeminiRealtimeClient({
                          onTextDelta: (delta) => {
                            if (delta) setDescription(prev => (prev ? prev + delta : delta));
                          },
                          onError: (e) => console.error('Realtime STT error', e),
                        });
                        setRecording(true);
                        await rtClientRef.current.start();
                      } catch (err) {
                        console.error('Mic access/transcription failed', err);
                        setRecording(false);
                      }
                    }}
                  >
                    {recording ? 'Stop' : 'Speak'}
                  </Button>
                </div>
              </div>
              <Textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Describe the maintenance issue (or use Speak to transcribe)"
                required
                className="resize-none border-gray-300 focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200 min-h-[100px]"
                rows={4}
              />
            </div>

            {/* Location Input (Required) */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Location *</label>
              <div className="relative">
                <MapPin className="absolute left-3 top-3 text-gray-400" size={18} />
                <input
                  type="text"
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder="Building, floor, room number..."
                  required
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-gray-500 focus:border-gray-500 transition-all duration-200"
                />
              </div>
            </div>

            {/* Image Upload Area */}
            <div className="space-y-2">
              <label className="text-sm font-medium text-gray-700">Photos (Optional)</label>
              <div className="border-2 border-dashed border-gray-300 rounded-xl p-6 text-center hover:border-gray-400 hover:bg-gray-50 transition-all duration-200">
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={handleImageUpload}
                  className="hidden"
                  id="image-upload"
                />
                <label htmlFor="image-upload" className="cursor-pointer block">
                  <CloudUpload className="mx-auto text-gray-400 mb-3" size={28} />
                  <p className="text-gray-600 font-medium">Click to upload photos</p>
                  <p className="text-xs text-gray-500 mt-1">PNG, JPG up to 10MB each</p>
                </label>
                
                {images.length > 0 && (
                  <div className="mt-4 flex flex-wrap gap-2 justify-center">
                    {images.map((image, index) => (
                      <Badge key={index} variant="secondary" className="bg-green-100 text-green-800">
                        📷 {image.name.substring(0, 20)}...
                      </Badge>
                    ))}
                  </div>
                )}
              </div>
            </div>

            {/* AI Analysis Preview */}
            {(analysis || isAnalyzing) && (
              <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-xl p-5">
                <div className="flex items-center space-x-3 mb-4">
                  <div className="h-8 w-8 bg-blue-600 rounded-full flex items-center justify-center">
                    <Bot className="text-white" size={16} />
                  </div>
                  <span className="font-semibold text-blue-900">AI Analysis Results</span>
                </div>
                
                {isAnalyzing ? (
                  <div className="flex items-center space-x-3">
                    <Loader2 className="animate-spin text-blue-600" size={20} />
                    <span className="text-blue-800">Analyzing your report with AI...</span>
                  </div>
                ) : analysis ? (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Category</p>
                      <p className="font-semibold text-blue-900 capitalize">{analysis.category}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Severity</p>
                      <p className="font-semibold text-blue-900 capitalize">{analysis.severity}</p>
                    </div>
                    <div className="bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-gray-600 text-xs uppercase tracking-wide mb-1">Confidence</p>
                      <p className="font-semibold text-blue-900">{Math.round(analysis.confidence * 100)}%</p>
                    </div>
                    <div className="md:col-span-3 bg-white rounded-lg p-3 border border-blue-100">
                      <p className="text-gray-600 text-xs uppercase tracking-wide mb-2">AI Reasoning</p>
                      <p className="text-blue-800">{analysis.reasoning}</p>
                    </div>
                  </div>
                ) : null}
              </div>
            )}

            {/* Action Buttons */}
            <div className="flex justify-between items-center pt-4 border-t border-gray-200">
              <div className="flex items-center space-x-3 text-sm text-gray-500">
                <Hash size={16} />
                <span>AI will automatically categorize and assess severity</span>
              </div>
              
              <div className="flex space-x-3">
                {!analysis ? (
                  <Button
                    onClick={performAnalysis}
                    disabled={!description.trim() || isAnalyzing}
                    className="btn-secondary"
                  >
                    {isAnalyzing ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Analyzing...
                      </>
                    ) : (
                      <>
                        <Bot className="mr-2 h-4 w-4" />
                        Analyze with AI
                      </>
                    )}
                  </Button>
                ) : (
                  <Button
                    onClick={handleSubmit}
                    disabled={createIssueMutation.isPending}
                    className="btn-primary"
                  >
                    {createIssueMutation.isPending ? (
                      <>
                        <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                        Submitting...
                      </>
                    ) : (
                      <>
                        <Send className="mr-2 h-4 w-4" />
                        Submit Report
                      </>
                    )}
                  </Button>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
