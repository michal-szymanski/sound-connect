import { useState, useRef } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/shared/components/ui/dialog';
import { Button } from '@/shared/components/ui/button';
import { Label } from '@/shared/components/ui/label';
import { Input } from '@/shared/components/ui/input';
import { Textarea } from '@/shared/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/shared/components/ui/select';
import { Progress } from '@/shared/components/ui/progress';
import { Alert, AlertDescription } from '@/shared/components/ui/alert';
import { usePresignedUpload } from '@/web/hooks/use-presigned-upload';
import { useCreateMusicSample } from '../hooks/use-music-samples';
import { InstrumentEnum, type Instrument } from '@sound-connect/common/types/profile-enums';
import { formatInstrument } from '../lib/profile-utils';
import { appConfig } from '@sound-connect/common/app-config';
import { CharacterCounter } from './character-counter';
import type { CreateMusicSample, MusicSampleMediaType } from '@sound-connect/common/types/music-samples';

type Props = {
    open: boolean;
    onOpenChange: (open: boolean) => void;
};

type ValidationError = {
    message: string;
};

const validateFile = (file: File): ValidationError | null => {
    const isAudio = file.type.startsWith('audio/');
    const isVideo = file.type.startsWith('video/');

    if (!isAudio && !isVideo) {
        return { message: 'Please select an audio or video file' };
    }

    if (isAudio) {
        if (!appConfig.allowedAudioTypes.includes(file.type as (typeof appConfig.allowedAudioTypes)[number])) {
            return { message: 'Invalid audio type. Use MP3, WAV, OGG, or WebM audio' };
        }
        if (file.size > appConfig.maxAudioSize) {
            const maxSizeMB = Math.round(appConfig.maxAudioSize / (1024 * 1024));
            return { message: `Audio file too large (${Math.round(file.size / (1024 * 1024))}MB). Max size: ${maxSizeMB}MB` };
        }
    }

    if (isVideo) {
        if (!appConfig.allowedVideoTypes.includes(file.type as (typeof appConfig.allowedVideoTypes)[number])) {
            return { message: 'Invalid video type. Use MP4, WebM, or MOV' };
        }
        if (file.size > appConfig.maxVideoSize) {
            const maxSizeMB = Math.round(appConfig.maxVideoSize / (1024 * 1024));
            return { message: `Video file too large (${Math.round(file.size / (1024 * 1024))}MB). Max size: ${maxSizeMB}MB` };
        }
    }

    return null;
};

export const UploadMusicSampleModal = ({ open, onOpenChange }: Props) => {
    const [formData, setFormData] = useState({
        title: '',
        description: '',
        instrument: '' as Instrument | ''
    });
    const [selectedFile, setSelectedFile] = useState<File | null>(null);
    const [validationError, setValidationError] = useState<ValidationError | null>(null);
    const [uploadedKey, setUploadedKey] = useState<string | null>(null);
    const fileInputRef = useRef<HTMLInputElement>(null);

    const createMutation = useCreateMusicSample();

    const { upload, progress, state, error, cancel } = usePresignedUpload({
        purpose: 'music-sample',
        onSuccess: (result: { publicUrl: string; key: string }) => {
            setUploadedKey(result.key);
            setValidationError(null);
        },
        onError: () => {
            setUploadedKey(null);
        }
    });

    const handleFileChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
        const file = event.target.files?.[0];
        if (!file) return;

        const validationResult = validateFile(file);
        if (validationResult) {
            setValidationError(validationResult);
            setSelectedFile(null);
            setUploadedKey(null);
            return;
        }

        setValidationError(null);
        setSelectedFile(file);
        setUploadedKey(null);

        await upload(file);
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();

        if (!uploadedKey || !selectedFile) {
            setValidationError({ message: 'Please upload a file first' });
            return;
        }

        if (!formData.title.trim()) {
            setValidationError({ message: 'Please enter a title' });
            return;
        }

        const mediaType: MusicSampleMediaType = selectedFile.type.startsWith('audio/') ? 'audio' : 'video';

        const payload: CreateMusicSample = {
            title: formData.title.trim(),
            description: formData.description.trim() || undefined,
            instrument: formData.instrument || undefined,
            mediaType,
            r2Key: uploadedKey,
            fileSize: selectedFile.size
        };

        createMutation.mutate(payload, {
            onSuccess: () => {
                setFormData({ title: '', description: '', instrument: '' });
                setSelectedFile(null);
                setUploadedKey(null);
                setValidationError(null);
                onOpenChange(false);
            }
        });
    };

    const handleCancel = () => {
        setFormData({ title: '', description: '', instrument: '' });
        setSelectedFile(null);
        setUploadedKey(null);
        setValidationError(null);
        cancel();
        onOpenChange(false);
    };

    const isUploading = state === 'uploading' || state === 'requesting' || state === 'confirming';
    const uploadComplete = uploadedKey !== null && !isUploading;
    const hasError = state === 'error' || validationError !== null;

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="z-dialog max-w-2xl">
                <DialogHeader>
                    <DialogTitle>Add Music Sample</DialogTitle>
                </DialogHeader>

                <form onSubmit={handleSubmit} className="space-y-4">
                    <div className="space-y-2">
                        <Label htmlFor="file-upload">Audio or Video File</Label>
                        <input
                            ref={fileInputRef}
                            id="file-upload"
                            type="file"
                            accept={[...appConfig.allowedAudioTypes, ...appConfig.allowedVideoTypes].join(',')}
                            onChange={handleFileChange}
                            className="hidden"
                            disabled={isUploading}
                        />

                        {selectedFile && (
                            <div className="text-sm">
                                <div className="font-medium">{selectedFile.name}</div>
                                <div className="text-muted-foreground">{Math.round(selectedFile.size / (1024 * 1024))}MB</div>
                            </div>
                        )}

                        {isUploading && (
                            <div className="space-y-2">
                                <Progress value={progress} className="h-2" />
                                <div className="flex items-center justify-between text-sm">
                                    <span className="text-muted-foreground">
                                        {state === 'requesting' && 'Preparing upload...'}
                                        {state === 'uploading' && `Uploading... ${progress}%`}
                                        {state === 'confirming' && 'Processing...'}
                                    </span>
                                    <Button type="button" variant="ghost" size="sm" onClick={cancel}>
                                        Cancel
                                    </Button>
                                </div>
                            </div>
                        )}

                        {uploadComplete && (
                            <Alert className="border-green-500 bg-green-50 dark:bg-green-950">
                                <AlertDescription className="text-green-700 dark:text-green-300">Upload successful!</AlertDescription>
                            </Alert>
                        )}

                        {hasError && (
                            <Alert variant="destructive">
                                <AlertDescription>{error || validationError?.message}</AlertDescription>
                            </Alert>
                        )}

                        {!isUploading && !uploadComplete && (
                            <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                                Choose File
                            </Button>
                        )}

                        {uploadComplete && (
                            <Button type="button" onClick={() => fileInputRef.current?.click()} variant="outline" className="w-full">
                                Choose Different File
                            </Button>
                        )}
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="title">Title</Label>
                            <CharacterCounter current={formData.title.length} max={100} />
                        </div>
                        <Input
                            id="title"
                            value={formData.title}
                            onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                            maxLength={100}
                            placeholder="e.g., Guitar Solo - Original Composition"
                            required
                        />
                    </div>

                    <div className="space-y-2">
                        <div className="flex items-center justify-between">
                            <Label htmlFor="description">Description (Optional)</Label>
                            <CharacterCounter current={formData.description.length} max={500} />
                        </div>
                        <Textarea
                            id="description"
                            value={formData.description}
                            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                            maxLength={500}
                            placeholder="Tell us about this piece..."
                            rows={3}
                        />
                    </div>

                    <div className="space-y-2">
                        <Label htmlFor="instrument">Instrument (Optional)</Label>
                        <Select value={formData.instrument} onValueChange={(value) => setFormData({ ...formData, instrument: value as Instrument })}>
                            <SelectTrigger id="instrument">
                                <SelectValue placeholder="Select instrument featured in this sample" />
                            </SelectTrigger>
                            <SelectContent className="z-popover">
                                {InstrumentEnum.map((instrument) => (
                                    <SelectItem key={instrument} value={instrument}>
                                        {formatInstrument(instrument)}
                                    </SelectItem>
                                ))}
                            </SelectContent>
                        </Select>
                    </div>

                    <div className="flex justify-end gap-2 pt-4">
                        <Button type="button" variant="outline" onClick={handleCancel}>
                            Cancel
                        </Button>
                        <Button
                            type="submit"
                            disabled={createMutation.isPending || !uploadComplete || !formData.title.trim()}
                            aria-busy={createMutation.isPending}
                        >
                            {createMutation.isPending ? 'Saving...' : 'Save Sample'}
                        </Button>
                    </div>
                </form>
            </DialogContent>
        </Dialog>
    );
};
