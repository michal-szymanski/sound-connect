import { createContext, useContext, useRef, useCallback, type ReactNode } from 'react';
import type WaveSurfer from 'wavesurfer.js';

type MediaInstance = {
    type: 'audio' | 'video';
    instance: WaveSurfer | HTMLVideoElement;
};

type MediaPlaybackContext = {
    register: (id: string, instance: WaveSurfer | HTMLVideoElement, type: 'audio' | 'video') => void;
    unregister: (id: string) => void;
    notifyPlay: (id: string) => void;
};

const Context = createContext<MediaPlaybackContext | undefined>(undefined);

type Props = {
    children: ReactNode;
};

export function MediaPlaybackProvider({ children }: Props) {
    const instancesRef = useRef<Map<string, MediaInstance>>(new Map());

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

    return <Context.Provider value={{ register, unregister, notifyPlay }}>{children}</Context.Provider>;
}

export function useMediaPlayback(): MediaPlaybackContext {
    const context = useContext(Context);
    if (!context) {
        throw new Error('useMediaPlayback must be used within a MediaPlaybackProvider');
    }
    return context;
}
