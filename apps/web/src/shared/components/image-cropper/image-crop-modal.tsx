import { useState, useCallback } from 'react';
import Cropper from 'react-easy-crop';
import type { Area, Point } from 'react-easy-crop';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Slider } from '@/shared/components/ui/slider';
import { Loader2 } from 'lucide-react';
import { getCroppedImage } from './get-cropped-image';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
    imageSrc: string;
    onCropComplete: (croppedBlob: Blob) => void;
    isUploading?: boolean;
};

export const ImageCropModal = ({ open, onOpenChange, imageSrc, onCropComplete, isUploading = false }: Props) => {
    const [crop, setCrop] = useState<Point>({ x: 0, y: 0 });
    const [zoom, setZoom] = useState(1);
    const [croppedAreaPixels, setCroppedAreaPixels] = useState<Area | null>(null);

    const onCropChange = (location: Point) => {
        setCrop(location);
    };

    const onZoomChange = (newZoom: number) => {
        setZoom(newZoom);
    };

    const onCropAreaComplete = useCallback((_croppedArea: Area, croppedAreaPixels: Area) => {
        setCroppedAreaPixels(croppedAreaPixels);
    }, []);

    const handleSave = async () => {
        if (!croppedAreaPixels) return;

        try {
            const croppedBlob = await getCroppedImage(imageSrc, croppedAreaPixels);
            onCropComplete(croppedBlob);
        } catch {
            console.error('Failed to crop image');
        }
    };

    const handleCancel = () => {
        setCrop({ x: 0, y: 0 });
        setZoom(1);
        setCroppedAreaPixels(null);
        onOpenChange(false);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-dialog sm:max-w-md">
                <DialogHeader>
                    <DialogTitle>Crop Profile Picture</DialogTitle>
                </DialogHeader>

                <div className="relative h-64 w-full overflow-hidden rounded-lg bg-black">
                    <Cropper
                        image={imageSrc}
                        crop={crop}
                        zoom={zoom}
                        aspect={1}
                        cropShape="round"
                        showGrid={false}
                        onCropChange={onCropChange}
                        onZoomChange={onZoomChange}
                        onCropComplete={onCropAreaComplete}
                    />
                </div>

                <div className="space-y-6">
                    <label htmlFor="zoom-slider" className="mb-3 block text-sm font-medium">
                        Zoom
                    </label>
                    <Slider
                        id="zoom-slider"
                        value={[zoom]}
                        min={1}
                        max={3}
                        step={0.1}
                        onValueChange={([value]) => setZoom(value)}
                        disabled={isUploading}
                    />
                </div>

                <DialogFooter className="gap-2 sm:gap-0">
                    <Button variant="outline" onClick={handleCancel} disabled={isUploading}>
                        Cancel
                    </Button>
                    <Button onClick={handleSave} disabled={isUploading || !croppedAreaPixels}>
                        {isUploading ? (
                            <>
                                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                                Uploading...
                            </>
                        ) : (
                            'Save'
                        )}
                    </Button>
                </DialogFooter>
            </DialogContent>
        </Dialog>
    );
};
