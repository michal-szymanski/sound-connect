import { createContext, useContext, useRef, useCallback, useState, useEffect, type ReactNode } from 'react';
import type WaveSurfer from 'wavesurfer.js';
import { isServer } from '@/web/utils/env-utils';
import { appConfig } from '@sound-connect/common/app-config';

type MediaInstance = {
    type: 'audio' | 'video';
    instance: WaveSurfer | HTMLVideoElement;
};

type VolumeSettings = {
    volume: number;
    isMuted: boolean;
};

type MediaPlaybackContext = {
    register: (id: string, instance: WaveSurfer | HTMLVideoElement, type: 'audio' | 'video') => void;
    unregister: (id: string) => void;
    notifyPlay: (id: string) => void;
    volume: number;
    isMuted: boolean;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
};

const STORAGE_KEY = `${appConfig.appNameNormalized}-media-volume`;
const DEFAULT_SETTINGS: VolumeSettings = { volume: 1, isMuted: false };

const loadVolumeSettings = (): VolumeSettings => {
    if (isServer()) return DEFAULT_SETTINGS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch {
        // Ignore localStorage errors
    }
    return DEFAULT_SETTINGS;
};

const saveVolumeSettings = (settings: VolumeSettings) => {
    try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(settings));
    } catch {
        // Ignore localStorage errors
    }
};

const Context = createContext<MediaPlaybackContext | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export function MediaPlaybackProvider({ children }: Props) {
    const instancesRef = useRef<Map<string, MediaInstance>>(new Map());
    const [volumeSettings, setVolumeSettings] = useState<VolumeSettings>(() => loadVolumeSettings());

    const register = useCallback((id: string, instance: WaveSurfer | HTMLVideoElement, type: 'audio' | 'video') => {
        instancesRef.current.set(id, { type, instance });
    }, []);

    const unregister = useCallback((id: string) => {
        instancesRef.current.delete(id);
    }, []);

    const notifyPlay = useCallback((id: string) => {
        instancesRef.current.forEach((mediaInstance, instanceId) => {
            if (instanceId !== id) {
                if (mediaInstance.type === 'audio') {
                    const wavesurfer = mediaInstance.instance as WaveSurfer;
                    if (wavesurfer.isPlaying()) {
                        wavesurfer.pause();
                    }
                } else if (mediaInstance.type === 'video') {
                    const video = mediaInstance.instance as HTMLVideoElement;
                    if (!video.paused) {
                        video.pause();
                    }
                }
            }
        });
    }, []);

    const setVolume = useCallback((volume: number) => {
        setVolumeSettings((prev) => {
            const next = { ...prev, volume, isMuted: volume === 0 };
            saveVolumeSettings(next);
            return next;
        });
    }, []);

    const setMuted = useCallback((isMuted: boolean) => {
        setVolumeSettings((prev) => {
            const next = { ...prev, isMuted };
            saveVolumeSettings(next);
            return next;
        });
    }, []);

    return (
        <Context.Provider
            value={{
                register,
                unregister,
                notifyPlay,
                volume: volumeSettings.volume,
                isMuted: volumeSettings.isMuted,
                setVolume,
                setMuted
            }}
        >
            {children}
        </Context.Provider>
    );
}

export function useMediaPlayback(): MediaPlaybackContext {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useMediaPlayback must be used within a MediaPlaybackProvider');
    }
    return context;
}
