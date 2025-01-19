import React, { useState } from 'react';
import { Button } from "@/components/ui/button"
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card"
import { Input } from "@/components/ui/input"
import DarkModeToggle from '../DarkModeToggle';
import { useDarkMode } from "../DarkModeContext";
import { X } from 'lucide-react';

interface ImageUploadModalProps {
  isOpen: boolean;
  onClose: () => void;
  onUpload: (imageUrl: string | null) => void;
}

const ImageUploadModal: React.FC<ImageUploadModalProps> = ({ isOpen, onClose, onUpload }) => {
    const { isDarkMode } = useDarkMode()
    const [errorMessage, setErrorMessage] = useState<string>('');
    const [imageUrl, setImageUrl] = useState<string>('');

    const handleUrlChange = (event: React.ChangeEvent<HTMLInputElement>) => {
        setImageUrl(event.target.value);
        setErrorMessage('');
    };
    
    const getDirectImageUrl = (url: string): string | null => {
        try {
          
            // Direct image URLs (ends with image extension)
            const imageExtensions = ['.jpg', '.jpeg', '.png', '.gif', '.webp'];
            if (imageExtensions.some(ext => url.toLowerCase().endsWith(ext))) {
                return url;
            }

            return null;
        } catch (error) {
            console.error('Invalid URL:', error);
            return null;
        }
    };

    const handleUpload = () => {
        if (!imageUrl) {
            setErrorMessage('Please enter an image URL.');
            return;
        }
        
        const directUrl = getDirectImageUrl(imageUrl);
        if (directUrl) {
            console.log(directUrl)
            onUpload(directUrl);
            setErrorMessage('');
            onClose();
        } else {
            setErrorMessage('Unable to process this URL. Please ensure it\'s a direct image link or from a supported hosting service.');
        }
    };

    if (!isOpen) return null;

    return (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <DarkModeToggle />
            <Card className={`rounded-xl shadow-md relative w-[500px] h-[400px] ${isDarkMode ? 'bg-neutral-800 text-white' : 'bg-white text-neutral-800 border-neutral-800'}`}>
                <button
                    className="absolute top-2 right-2 text-neutral-950 hover:text-gray-700"
                    onClick={() => { 
                        onClose(); 
                        setErrorMessage(""); 
                    }}
                >
                    <X className="w-6 h-6" />
                </button>

                <CardHeader>
                    <CardTitle className="text-lg font-bold">Welcome to the Library!</CardTitle>
                    <CardDescription>Enter a URL for your profile picture.</CardDescription>
                </CardHeader>

                <CardContent>
                    <Input
                        type="url"
                        placeholder="Enter image URL (e.g., https://imgur.com/abcdef)"
                        value={imageUrl}
                        onChange={handleUrlChange}
                        className="my-2"
                    />
                    {errorMessage && <p className="text-red-600 absolute top-52 text-2xl left-0 w-full text-center">{errorMessage}</p>}
                </CardContent>

                <div className="flex justify-between mt-44">
                    <Button
                        variant="outline"
                        onClick={() => { onUpload(""); onClose(); }}
                        className={`flex-1 ml-2 mr-2 border-neutral-800 ${isDarkMode ? 'hover-button-dark' : 'hover-button'}`}
                    >
                        Skip
                    </Button>
                    <Button
                        variant="outline"
                        onClick={handleUpload}
                        className={`flex-1 mr-2 border-neutral-800 ${isDarkMode ? 'hover-button-dark' : 'hover-button'}`}
                    >
                        Upload
                    </Button>
                </div>
            </Card>
        </div>
    );
};

export default ImageUploadModal;