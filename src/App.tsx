import React, { useState, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import confetti from 'canvas-confetti';
import { 
  Upload, Download, Sparkles, Zap, Shield, Users, 
  ArrowRight, Play, X, Check 
} from 'lucide-react';
import './App.css';

interface Color {
  r: number;
  g: number;
  b: number;
}

interface FAQItem {
  question: string;
  answer: string;
}

const faqs: FAQItem[] = [
  {
    question: "Is this free background remover really 100% free?",
    answer: "Yes! BGRemover is the best free background remover online. No signup, no credit card, no limits. We keep it free with minimal, non-intrusive ads."
  },
  {
    question: "How does this free background remover work?",
    answer: "Our free background remover uses smart color detection in your browser. Click on the background color, adjust tolerance, and get a transparent PNG instantly. No AI server needed — works 100% privately."
  },
  {
    question: "What image formats can I use with the free background remover?",
    answer: "Our free background remover supports JPG, PNG, WEBP, and GIF. Output is always a high-quality transparent PNG — perfect for any project."
  },
  {
    question: "Is my photo safe when using this free background remover?",
    answer: "100% safe. This free background remover processes everything in your browser. Your images never leave your device. No uploads, no storage, completely private."
  },
  {
    question: "Can I use results from this free background remover commercially?",
    answer: "Absolutely. All images processed with our free background remover are yours forever — use them for websites, ecommerce, social media, print, anything."
  },
  {
    question: "Why are there ads on this free background remover?",
    answer: "Ads let us offer the best free background remover with no limits. They're subtle and placed in the sidebar — never interrupting your workflow."
  }
];

const sampleImages = [
  { id: 1, url: '/images/sample-dog.jpg', name: 'Golden Retriever' },
  { id: 2, url: '/images/sample-car.jpg', name: 'Red Ferrari' },
  { id: 3, url: '/images/sample-mug.jpg', name: 'Coffee Mug' },
];

function App() {
  const [originalImage, setOriginalImage] = useState<string | null>(null);
  const [processedImage, setProcessedImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [selectedColor, setSelectedColor] = useState<Color | null>(null);
  const [tolerance, setTolerance] = useState(35);
  const [showSuccess, setShowSuccess] = useState(false);
  const [activeFAQ, setActiveFAQ] = useState<number | null>(null);
  const [dragActive, setDragActive] = useState(false);

  const originalImgRef = useRef<HTMLImageElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const dropRef = useRef<HTMLDivElement>(null);

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragActive(false);
    
    const file = e.dataTransfer.files[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file && file.type.startsWith('image/')) {
      processFile(file);
    }
  };

  const processFile = (file: File) => {
    const reader = new FileReader();
    reader.onload = (e) => {
      const result = e.target?.result as string;
      setOriginalImage(result);
      setProcessedImage(null);
      setSelectedColor(null);
    };
    reader.readAsDataURL(file);
  };

  const loadSample = (url: string) => {
    setOriginalImage(url);
    setProcessedImage(null);
    setSelectedColor(null);
  };

  const pickColorFromImage = (e: React.MouseEvent<HTMLImageElement>) => {
    if (!originalImgRef.current || !originalImage) return;

    const img = originalImgRef.current;
    const rect = img.getBoundingClientRect();
    
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;
    
    const scaleX = img.naturalWidth / rect.width;
    const scaleY = img.naturalHeight / rect.height;
    
    const realX = Math.floor(x * scaleX);
    const realY = Math.floor(y * scaleY);

    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d')!;
    canvas.width = img.naturalWidth;
    canvas.height = img.naturalHeight;
    ctx.drawImage(img, 0, 0);
    
    const pixel = ctx.getImageData(realX, realY, 1, 1).data;
    
    const newColor: Color = { r: pixel[0], g: pixel[1], b: pixel[2] };
    setSelectedColor(newColor);
    
    // Auto process after picking color
    processBackgroundRemoval(resultImageUrl => {
      setProcessedImage(resultImageUrl);
    }, newColor, tolerance);
  };

  const processBackgroundRemoval = async (
    callback: (url: string) => void,
    color: Color | null = selectedColor,
    tol: number = tolerance
  ) => {
    if (!originalImage) return;

    setIsProcessing(true);

    // Simulate processing time
    await new Promise(resolve => setTimeout(resolve, 800));

    const img = new Image();
    img.crossOrigin = "anonymous";
    
    img.onload = () => {
      const canvas = document.createElement('canvas');
      canvas.width = img.width;
      canvas.height = img.height;
      const ctx = canvas.getContext('2d')!;
      ctx.drawImage(img, 0, 0);

      const imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
      const data = imageData.data;

      // Use white as default if no color selected
      const bgColor = color || { r: 255, g: 255, b: 255 };
      const currentTol = tol;

      for (let i = 0; i < data.length; i += 4) {
        const r = data[i];
        const g = data[i + 1];
        const b = data[i + 2];

        // Calculate color distance (Euclidean)
        const dist = Math.sqrt(
          Math.pow(r - bgColor.r, 2) +
          Math.pow(g - bgColor.g, 2) +
          Math.pow(b - bgColor.b, 2)
        );

        if (dist < currentTol) {
          data[i + 3] = 0; // Make transparent
        }
      }

      ctx.putImageData(imageData, 0, 0);
      
      const resultUrl = canvas.toDataURL('image/png');
      callback(resultUrl);
      setIsProcessing(false);
    };

    img.src = originalImage;
  };

  const removeBackground = () => {
    if (!originalImage) return;
    
    const colorToUse = selectedColor || { r: 255, g: 255, b: 255 };
    processBackgroundRemoval((url) => {
      setProcessedImage(url);
    }, colorToUse, tolerance);
  };

  const autoRemove = () => {
    setSelectedColor({ r: 255, g: 255, b: 255 });
    setTolerance(40);
    processBackgroundRemoval((url) => {
      setProcessedImage(url);
    }, { r: 255, g: 255, b: 255 }, 40);
  };

  const downloadImage = () => {
    if (!processedImage) return;

    const link = document.createElement('a');
    link.href = processedImage;
    link.download = 'bg-removed.png';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);

    // Confetti!
    confetti({
      particleCount: 200,
      spread: 80,
      origin: { y: 0.6 }
    });

    setShowSuccess(true);
    setTimeout(() => setShowSuccess(false), 2500);
  };

  const resetDemo = () => {
    setOriginalImage(null);
    setProcessedImage(null);
    setSelectedColor(null);
    setTolerance(35);
  };

  const toggleFAQ = (index: number) => {
    setActiveFAQ(activeFAQ === index ? null : index);
  };

  const scrollToSection = (id: string) => {
    const element = document.getElementById(id);
    element?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen bg-white text-gray-900 font-sans overflow-hidden">
      {/* Navbar */}
      <nav className="fixed top-0 left-0 right-0 z-50 bg-white/95 backdrop-blur-md border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-6 h-20 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-blue-600 rounded-xl flex items-center justify-center">
              <Sparkles className="w-6 h-6 text-white" />
            </div>
            <div>
              <div className="font-bold text-2xl tracking-tight">BGRemover</div>
              <div className="text-[10px] text-gray-500 -mt-1">INSTANT • FREE • AI</div>
            </div>
          </div>

          <div className="hidden md:flex items-center gap-10 text-sm font-medium">
            <button onClick={() => scrollToSection('demo')} className="hover:text-blue-600 transition-colors">Try Demo</button>
            <button onClick={() => scrollToSection('features')} className="hover:text-blue-600 transition-colors">Features</button>
            <button onClick={() => scrollToSection('how')} className="hover:text-blue-600 transition-colors">How it Works</button>
            <button onClick={() => scrollToSection('faq')} className="hover:text-blue-600 transition-colors">FAQ</button>
          </div>

          <div className="flex items-center gap-4">
            <motion.button
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection('demo')}
              className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-full font-semibold flex items-center gap-2 text-sm transition-all"
            >
              Start Free <ArrowRight className="w-4 h-4" />
            </motion.button>
          </div>
        </div>
      </nav>

      {/* Hero Section */}
      <section className="pt-20 bg-gradient-to-br from-gray-50 via-white to-blue-50 relative overflow-hidden">
        <div className="absolute inset-0 bg-[radial-gradient(#e5e7eb_1px,transparent_1px)] bg-[length:4px_4px]"></div>
        
        <div className="max-w-5xl mx-auto px-6 pt-20 pb-24 text-center relative z-10">
          <div className="inline-flex items-center gap-2 bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-sm font-medium mb-6">
            <div className="w-2 h-2 bg-blue-500 rounded-full animate-pulse"></div>
            100% FREE • NO SIGNUP REQUIRED
          </div>

          <h1 className="text-6xl md:text-7xl font-bold tracking-tighter leading-none mb-6">
            Free Background Remover<br /> 
            <span className="bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 bg-clip-text text-transparent">Instant & Free</span>
          </h1>
          
          <p className="max-w-2xl mx-auto text-xl text-gray-600 mb-10">
            The #1 <strong>free background remover</strong> online. Remove background from any photo instantly — no signup, no limits, 100% free. 
            Get perfect transparent PNGs in seconds.
          </p>

          <div className="flex flex-col sm:flex-row gap-4 justify-center mb-12">
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection('demo')}
              className="group flex items-center justify-center gap-3 bg-blue-600 hover:bg-blue-700 text-white px-10 py-4 rounded-2xl font-semibold text-lg shadow-xl shadow-blue-500/30 transition-all"
            >
              Try Background Remover
              <Upload className="w-5 h-5 group-hover:rotate-12 transition-transform" />
            </motion.button>
            
            <motion.button
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.98 }}
              onClick={() => scrollToSection('how')}
              className="flex items-center justify-center gap-3 border-2 border-gray-200 hover:border-gray-300 px-8 py-4 rounded-2xl font-semibold text-lg transition-all"
            >
              <Play className="w-5 h-5" /> Watch Demo
            </motion.button>
          </div>

          <div className="flex items-center justify-center gap-8 text-sm text-gray-500">
            <div className="flex items-center gap-2">
              <Shield className="w-4 h-4" /> 100% Private
            </div>
            <div className="flex items-center gap-2">
              <Zap className="w-4 h-4" /> Under 3 Seconds
            </div>
            <div className="flex items-center gap-2">
              <Users className="w-4 h-4" /> 1.2M+ Users
            </div>
          </div>
        </div>

        {/* Hero Visual */}
        <div className="relative max-w-4xl mx-auto px-6 pb-16">
          <motion.div 
            initial={{ opacity: 0, y: 40 }}
            animate={{ opacity: 1, y: 0 }}
            className="relative rounded-3xl overflow-hidden shadow-2xl border border-gray-200"
          >
            <img 
              src="/images/hero-model.jpg" 
              alt="Hero Background Remover Example" 
              className="w-full h-auto"
            />
            <div className="absolute inset-0 bg-gradient-to-b from-black/20 to-black/40"></div>
            <div className="absolute bottom-8 left-8 right-8 text-white">
              <div className="inline-block bg-white/90 text-blue-600 px-4 py-1 rounded-full text-xs font-medium mb-3">BEFORE → AFTER</div>
              <div className="text-3xl font-bold tracking-tight">Professional Results</div>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Interactive Demo Section */}
      <section id="demo" className="py-20 bg-white border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-14">
            <div className="inline-block bg-blue-100 text-blue-600 px-4 py-1 rounded-full text-sm font-semibold mb-4">FREE BACKGROUND REMOVER DEMO</div>
            <h2 className="text-5xl font-bold tracking-tight mb-4">Try the Free Background Remover Now</h2>
            <p className="max-w-lg mx-auto text-xl text-gray-600">
              Upload your photo or try our samples. This is the best <strong>free background remover</strong> — instant, no signup, unlimited.
            </p>
          </div>

          <div className="grid lg:grid-cols-12 gap-8">
            {/* Upload Area */}
            <div className="lg:col-span-5">
              <div 
                ref={dropRef}
                onDragOver={handleDragOver}
                onDragLeave={handleDragLeave}
                onDrop={handleDrop}
                onClick={() => fileInputRef.current?.click()}
                className={`relative border-2 border-dashed rounded-3xl h-[520px] flex flex-col items-center justify-center cursor-pointer transition-all overflow-hidden
                  ${dragActive ? 'border-blue-500 bg-blue-50' : 'border-gray-200 hover:border-blue-400 bg-gray-50'}`}
              >
                <input 
                  ref={fileInputRef} 
                  type="file" 
                  accept="image/*" 
                  onChange={handleFileSelect} 
                  className="hidden" 
                />
                
                {!originalImage ? (
                  <div className="text-center px-8">
                    <div className="mx-auto w-20 h-20 bg-blue-100 rounded-2xl flex items-center justify-center mb-6">
                      <Upload className="w-10 h-10 text-blue-600" />
                    </div>
                    <h3 className="text-2xl font-semibold mb-3">Drop your image here</h3>
                    <p className="text-gray-500 mb-8 max-w-xs mx-auto">or click to browse • JPG, PNG, WEBP supported</p>
                    
                    <div className="inline-flex flex-wrap gap-2 justify-center">
                      {sampleImages.map((sample, idx) => (
                        <button 
                          key={idx}
                          onClick={(e) => { e.stopPropagation(); loadSample(sample.url); }}
                          className="px-4 py-2 bg-white hover:bg-gray-100 border text-sm rounded-full flex items-center gap-2 transition-colors"
                        >
                          {sample.name}
                        </button>
                      ))}
                    </div>
                  </div>
                ) : (
                  <div className="relative w-full h-full flex items-center justify-center p-6">
                    <img 
                      ref={originalImgRef}
                      src={originalImage} 
                      alt="Original" 
                      className="max-h-full max-w-full object-contain rounded-xl cursor-crosshair"
                      onClick={pickColorFromImage}
                    />
                    <div className="absolute top-4 right-4 flex gap-2">
                      <button 
                        onClick={(e) => { e.stopPropagation(); resetDemo(); }}
                        className="bg-white/90 hover:bg-white p-2 rounded-full shadow"
                      >
                        <X className="w-4 h-4" />
                      </button>
                    </div>
                    
                    <div className="absolute bottom-4 left-4 bg-white/95 backdrop-blur px-3 py-1.5 rounded-full text-xs flex items-center gap-1.5 shadow">
                      <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
                      Click on background to select color
                    </div>
                  </div>
                )}
              </div>

              {/* Controls */}
              {originalImage && (
                <div className="mt-6 bg-gray-50 rounded-3xl p-6 border border-gray-100">
                  <div className="flex justify-between items-center mb-5">
                    <div>
                      <div className="font-semibold">Background Color</div>
                      <div className="text-sm text-gray-500">Click image to change</div>
                    </div>
                    
                    {selectedColor && (
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-8 h-8 rounded-xl border border-gray-200 shadow-inner"
                          style={{ backgroundColor: `rgb(${selectedColor.r}, ${selectedColor.g}, ${selectedColor.b})` }}
                        />
                        <div className="text-xs text-gray-500 font-mono">
                          RGB({selectedColor.r},{selectedColor.g},{selectedColor.b})
                        </div>
                      </div>
                    )}
                  </div>

                  <div className="mb-6">
                    <div className="flex justify-between text-sm mb-2">
                      <span>Tolerance</span>
                      <span className="font-mono text-blue-600">{tolerance}</span>
                    </div>
                    <input 
                      type="range" 
                      min="10" 
                      max="80" 
                      step="1"
                      value={tolerance} 
                      onChange={(e) => {
                        const newTol = parseInt(e.target.value);
                        setTolerance(newTol);
                        if (selectedColor && processedImage) {
                          processBackgroundRemoval((url) => setProcessedImage(url), selectedColor, newTol);
                        }
                      }}
                      className="w-full accent-blue-600" 
                    />
                    <div className="flex justify-between text-xs text-gray-400 mt-1">
                      <span>Precise</span>
                      <span>Loose</span>
                    </div>
                  </div>

                  <div className="grid grid-cols-2 gap-3">
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={removeBackground}
                      disabled={isProcessing}
                      className="flex items-center justify-center gap-2 py-3.5 bg-blue-600 hover:bg-blue-700 disabled:bg-blue-400 text-white font-semibold rounded-2xl transition-all"
                    >
                      {isProcessing ? (
                        <>Processing <div className="w-4 h-4 border-2 border-white border-t-transparent animate-spin rounded-full"></div></>
                      ) : (
                        <>Remove Background <Sparkles className="w-4 h-4" /></>
                      )}
                    </motion.button>
                    
                    <motion.button
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      onClick={autoRemove}
                      className="flex items-center justify-center gap-2 py-3.5 bg-white border border-gray-200 hover:bg-gray-50 font-semibold rounded-2xl transition-all"
                    >
                      Auto White
                    </motion.button>
                  </div>
                </div>
              )}
            </div>

            {/* Preview & Result */}
            <div className="lg:col-span-7">
              <div className="sticky top-24">
                <div className="bg-gray-50 rounded-3xl p-6 border border-gray-100 mb-6">
                  <div className="flex items-center justify-between mb-5">
                    <h3 className="font-semibold text-xl">Result Preview</h3>
                    
                    {processedImage && (
                      <motion.button
                        whileHover={{ scale: 1.02 }}
                        onClick={downloadImage}
                        className="flex items-center gap-2 bg-emerald-600 hover:bg-emerald-700 text-white px-6 py-2.5 rounded-full font-semibold text-sm"
                      >
                        <Download className="w-4 h-4" /> Download PNG
                      </motion.button>
                    )}
                  </div>

                  <div className="relative aspect-[16/10] bg-[repeating-linear-gradient(45deg,#f1f5f9,#f1f5f9_10px,#e2e8f0_10px,#e2e8f0_20px)] rounded-2xl overflow-hidden border border-gray-200 flex items-center justify-center">
                    {isProcessing ? (
                      <div className="text-center">
                        <div className="mx-auto w-16 h-16 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mb-6"></div>
                        <div className="font-medium text-lg">Removing Background...</div>
                        <div className="text-gray-500 text-sm mt-1">AI Magic in Progress</div>
                      </div>
                    ) : processedImage ? (
                      <div className="relative w-full h-full flex items-center justify-center p-4">
                        <img 
                          src={processedImage} 
                          alt="Processed" 
                          className="max-h-full max-w-full object-contain" 
                        />
                        <div className="absolute top-4 right-4 bg-emerald-500/90 text-white text-xs px-3 py-1 rounded-full flex items-center gap-1">
                          <Check className="w-3 h-3" /> TRANSPARENT
                        </div>
                      </div>
                    ) : originalImage ? (
                      <div className="text-center text-gray-400">
                        <div className="mx-auto w-14 h-14 bg-gray-200 rounded-2xl flex items-center justify-center mb-4">
                          <Sparkles className="w-7 h-7" />
                        </div>
                        <p className="font-medium">Click "Remove Background" to see the magic</p>
                        <p className="text-sm mt-1">Or click on the image to pick background color</p>
                      </div>
                    ) : (
                      <div className="text-center text-gray-400">
                        <div className="text-6xl mb-4 opacity-30">🖼️</div>
                        <p>Upload an image to get started</p>
                      </div>
                    )}
                  </div>
                </div>

                {/* Sidebar Ad - Easy AdSense Slot */}
                <div className="bg-white border border-gray-200 rounded-3xl p-6 shadow-sm">
                  <div className="flex items-center gap-2 text-xs text-gray-500 mb-3">
                    <div className="px-2 py-0.5 bg-gray-100 rounded">ADVERTISEMENT</div>
                    <span>Google AdSense</span>
                  </div>
                  <div className="bg-gray-900 rounded-xl overflow-hidden h-[250px] flex items-center justify-center relative">
                    <img src="/images/ad-banner.jpg" alt="Ad" className="absolute inset-0 w-full h-full object-cover opacity-80" />
                    <div className="relative z-10 text-center text-white px-4">
                      <div className="text-sm mb-2 opacity-80">SPONSORED BY</div>
                      <div className="font-bold text-2xl mb-3">PhotoAI Studio</div>
                      <div className="text-sm mb-4 opacity-90">Unlock premium AI editing tools</div>
                      <a href="#" className="inline-block bg-white text-black px-6 py-2 rounded-lg text-sm font-semibold hover:bg-gray-100 transition">Learn More</a>
                    </div>
                  </div>
                  <div className="text-[10px] text-gray-400 mt-2 text-center">Replace with your AdSense code here</div>
                </div>

                {/* Floating Support Banner */}
                <div className="mt-6 bg-blue-50 border border-blue-200 rounded-2xl p-5 text-center">
                  <div className="text-blue-600 font-medium text-sm mb-1">❤️ SUPPORT THIS FREE TOOL</div>
                  <p className="text-xs text-gray-600">Ads keep BGRemover 100% free. Thank you for your support!</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Trust Bar */}
      <div className="py-8 bg-gray-50 border-b border-gray-100">
        <div className="max-w-7xl mx-auto px-6 flex flex-col items-center">
          <div className="text-xs uppercase tracking-[2px] text-gray-500 mb-4">TRUSTED BY CREATIVES AT</div>
          <img src="/images/trust-logos.jpg" alt="Trusted Brands" className="max-w-[600px] opacity-70" />
        </div>
      </div>

      {/* Features */}
      <section id="features" className="py-24 bg-white">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-blue-600 font-semibold mb-3">WHY WE'RE THE #1 FREE BACKGROUND REMOVER</div>
            <h2 className="text-5xl font-bold tracking-tighter">The Best Free Background Remover Online</h2>
            <p className="mt-4 text-xl text-gray-600 max-w-lg mx-auto">Trusted by 1.2M+ users. Remove background free — no signup, no watermarks, unlimited.</p>
          </div>

          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            {[
              { 
                icon: <Zap className="w-7 h-7" />, 
                title: "Lightning Fast", 
                desc: "Process images in under 3 seconds with our optimized browser AI." 
              },
              { 
                icon: <Shield className="w-7 h-7" />, 
                title: "100% Private", 
                desc: "All processing happens locally. Your images never leave your device." 
              },
              { 
                icon: <Sparkles className="w-7 h-7" />, 
                title: "High Quality Results", 
                desc: "Smart edge detection for crisp, clean transparent backgrounds." 
              },
              { 
                icon: <Users className="w-7 h-7" />, 
                title: "No Sign Up", 
                desc: "Start removing backgrounds instantly. No account, no credit card." 
              },
              { 
                icon: <Download className="w-7 h-7" />, 
                title: "Free Downloads", 
                desc: "Unlimited downloads in PNG with transparent background." 
              },
              { 
                icon: <Play className="w-7 h-7" />, 
                title: "Works Everywhere", 
                desc: "Fully responsive. Works perfectly on mobile, tablet, and desktop." 
              }
            ].map((feature, i) => (
              <motion.div 
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                transition={{ delay: i * 0.05 }}
                className="bg-white p-8 rounded-3xl border border-gray-100 hover:border-blue-200 hover:shadow-lg transition-all group"
              >
                <div className="w-14 h-14 bg-blue-50 rounded-2xl flex items-center justify-center mb-6 text-blue-600 group-hover:scale-110 transition-transform">
                  {feature.icon}
                </div>
                <h3 className="text-2xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600 leading-relaxed">{feature.desc}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* How it Works */}
      <section id="how" className="py-24 bg-gray-50">
        <div className="max-w-7xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-blue-600 font-semibold mb-3">3 SIMPLE STEPS</div>
            <h2 className="text-5xl font-bold tracking-tighter">How it Works</h2>
          </div>

          <div className="grid md:grid-cols-3 gap-8">
            {[
              { 
                step: "01", 
                title: "Upload Your Image", 
                desc: "Drag & drop or select any photo. Works with people, products, animals and more.",
                img: "/images/step-upload.jpg"
              },
              { 
                step: "02", 
                title: "AI Removes Background", 
                desc: "Click on the background color or use auto-detect. Watch the magic happen instantly.",
                img: "/images/step-process.jpg"
              },
              { 
                step: "03", 
                title: "Download Instantly", 
                desc: "Get your high-res PNG with perfect transparency. Use anywhere you want.",
                img: "/images/step-download.jpg"
              }
            ].map((item, i) => (
              <div key={i} className="relative bg-white rounded-3xl overflow-hidden shadow-sm border border-gray-100 group">
                <div className="aspect-[16/10] overflow-hidden">
                  <img src={item.img} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500" />
                </div>
                <div className="p-8">
                  <div className="inline-block text-blue-600 text-xs tracking-[2px] mb-2 font-semibold">{item.step}</div>
                  <h3 className="text-3xl font-bold mb-4">{item.title}</h3>
                  <p className="text-gray-600 text-[15px]">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Ad Banner */}
      <div className="max-w-7xl mx-auto px-6 py-12">
        <div className="relative rounded-3xl overflow-hidden h-[260px] flex items-center bg-black">
          <img src="/images/ad-banner.jpg" alt="Ad" className="absolute inset-0 w-full h-full object-cover opacity-75" />
          <div className="relative px-12 max-w-xl text-white z-10">
            <div className="uppercase tracking-widest text-xs mb-4 text-blue-400">ADVERTISEMENT</div>
            <h3 className="text-4xl font-bold tracking-tight mb-3">Create Stunning Visuals</h3>
            <p className="text-xl text-gray-300 mb-6">Discover AI tools that complement BGRemover. Get 50% off your first month with code FREE50.</p>
            <a href="#" className="inline-flex items-center gap-2 bg-white text-black px-8 py-3 rounded-2xl font-semibold hover:bg-gray-100">Explore Now →</a>
          </div>
          <div className="absolute bottom-4 right-4 bg-white/10 text-xs px-3 py-1 rounded-full text-white/80">Sponsored</div>
        </div>
      </div>

      {/* FAQ */}
      <section id="faq" className="py-24 bg-white border-t border-gray-100">
        <div className="max-w-3xl mx-auto px-6">
          <div className="text-center mb-16">
            <div className="text-blue-600 font-semibold mb-3">GOT QUESTIONS?</div>
            <h2 className="text-5xl font-bold tracking-tighter">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {faqs.map((faq, index) => (
              <div 
                key={index} 
                className="border border-gray-100 rounded-2xl overflow-hidden"
              >
                <button
                  onClick={() => toggleFAQ(index)}
                  className="w-full px-8 py-6 text-left flex justify-between items-center hover:bg-gray-50 transition-colors"
                >
                  <span className="font-semibold text-lg pr-8">{faq.question}</span>
                  <motion.div
                    animate={{ rotate: activeFAQ === index ? 45 : 0 }}
                    className="text-blue-600"
                  >
                    <X className="w-5 h-5" />
                  </motion.div>
                </button>
                
                <AnimatePresence>
                  {activeFAQ === index && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      className="overflow-hidden"
                    >
                      <div className="px-8 pb-8 text-gray-600 text-[15px] leading-relaxed">
                        {faq.answer}
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Final CTA */}
      <section className="py-24 bg-gradient-to-b from-blue-950 to-black text-white text-center">
        <div className="max-w-3xl mx-auto px-6">
          <div className="inline-block mb-8 text-blue-400">✨ START CREATING TODAY</div>
          <h2 className="text-6xl font-bold tracking-tighter mb-6">Ready to Remove Your First Background?</h2>
          <p className="text-xl text-blue-200 mb-10 max-w-md mx-auto">Join thousands of creators using BGRemover every day. It's fast, free, and works in seconds.</p>
          
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.98 }}
            onClick={() => scrollToSection('demo')}
            className="mx-auto flex items-center gap-4 bg-white text-black px-12 py-5 rounded-2xl font-bold text-xl shadow-2xl"
          >
            Start Removing Backgrounds Now
            <ArrowRight className="w-6 h-6" />
          </motion.button>
          
          <div className="mt-8 text-sm text-blue-400">No credit card required • No sign up • Unlimited free uses</div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-gray-950 text-gray-400 py-16">
        <div className="max-w-7xl mx-auto px-6 grid md:grid-cols-12 gap-y-12">
          <div className="md:col-span-5">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-9 h-9 bg-white rounded-xl flex items-center justify-center">
                <Sparkles className="w-5 h-5 text-black" />
              </div>
              <span className="text-white text-2xl font-bold tracking-tight">BGRemover</span>
            </div>
            
            <p className="max-w-sm text-lg">The fastest way to remove backgrounds from images. Powered by browser AI, free forever, no sign-up needed.</p>
            
            <div className="mt-8 flex gap-4">
              <a href="#" className="hover:text-white transition-colors">Twitter</a>
              <a href="#" className="hover:text-white transition-colors">Instagram</a>
              <a href="#" className="hover:text-white transition-colors">Discord</a>
            </div>
          </div>

          <div className="md:col-span-3">
            <div className="font-semibold text-white mb-4">Product</div>
            <div className="space-y-3 text-sm">
              <a href="#demo" className="block hover:text-white">Try the Demo</a>
              <a href="#features" className="block hover:text-white">Features</a>
              <a href="#how" className="block hover:text-white">How it Works</a>
              <a href="#faq" className="block hover:text-white">FAQ</a>
            </div>
          </div>

          <div className="md:col-span-4">
            <div className="font-semibold text-white mb-4">Legal & More</div>
            <div className="space-y-3 text-sm">
              <a href="#" className="block hover:text-white">Privacy Policy</a>
              <a href="#" className="block hover:text-white">Terms of Service</a>
              <a href="#" className="block hover:text-white">Support</a>
              <div className="pt-4 text-xs">© {new Date().getFullYear()} BGRemover. All rights reserved.</div>
              <div className="text-xs text-gray-500">Made with ❤️ for creators worldwide</div>
            </div>
          </div>
        </div>

        <div className="mt-16 border-t border-gray-800 pt-8 text-center text-xs text-gray-500">
          This is a demo website. Background removal is simulated using canvas-based color keying in the browser. For production, integrate with a real AI API.
        </div>
      </footer>

      {/* Floating Support Banner */}
      <div className="fixed bottom-6 right-6 z-50 hidden lg:block">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white border border-gray-200 shadow-xl rounded-2xl px-5 py-4 flex items-center gap-3 text-sm"
        >
          <div className="text-2xl">💙</div>
          <div>
            <div className="font-semibold text-gray-900">Love BGRemover?</div>
            <div className="text-xs text-gray-500">Ads fund our free service. Thanks!</div>
          </div>
          <a href="#faq" className="ml-2 text-xs bg-blue-600 text-white px-3 py-1 rounded-lg hover:bg-blue-700">Learn More</a>
        </motion.div>
      </div>

      {/* Success Modal */}
      <AnimatePresence>
        {showSuccess && (
          <div className="fixed inset-0 z-[60] flex items-center justify-center bg-black/60">
            <motion.div 
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              exit={{ scale: 0.9, opacity: 0 }}
              className="bg-white rounded-3xl p-10 max-w-sm text-center shadow-2xl"
            >
              <div className="mx-auto w-20 h-20 bg-emerald-100 rounded-full flex items-center justify-center mb-6">
                <Check className="w-10 h-10 text-emerald-600" />
              </div>
              <h3 className="text-3xl font-bold mb-3">Download Complete!</h3>
              <p className="text-gray-600 mb-8">Your transparent background PNG is saved. Enjoy creating!</p>
              <button 
                onClick={() => setShowSuccess(false)}
                className="bg-gray-900 text-white px-8 py-3 rounded-2xl font-semibold"
              >
                Awesome, Thanks!
              </button>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </div>
  );
}

export default App;
