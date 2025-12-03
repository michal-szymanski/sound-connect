import { create } from 'zustand';
import { devtools, persist } from 'zustand/middleware';
import { useShallow } from 'zustand/react/shallow';
import type WaveSurfer from 'wavesurfer.js';
import { isServer } from '@/utils/env-utils';
import { appConfig } from '@sound-connect/common/app-config';

type MediaInstance = {
    type: 'audio' | 'video';
    instance: WaveSurfer | HTMLVideoElement;
};

type VolumeSettings = {
    volume: number;
    isMuted: boolean;
};

type MediaPlaybackStore = {
    instances: Map<string, MediaInstance>;
    volume: number;
    isMuted: boolean;
    activeVolumePopoverId: string | null;
    register: (id: string, instance: WaveSurfer | HTMLVideoElement, type: 'audio' | 'video') => void;
    unregister: (id: string) => void;
    notifyPlay: (id: string) => void;
    pauseAll: () => void;
    setVolume: (volume: number) => void;
    setMuted: (muted: boolean) => void;
    setActiveVolumePopover: (idOrUpdater: string | null | ((current: string | null) => string | null)) => void;
};

const STORAGE_KEY = `${appConfig.appNameNormalized}-media-volume`;
const DEFAULT_SETTINGS: VolumeSettings = { volume: 1, isMuted: false };

const loadVolumeSettings = (): VolumeSettings => {
    if (isServer()) return DEFAULT_SETTINGS;
    try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) return JSON.parse(stored);
    } catch {}
    return DEFAULT_SETTINGS;
};

export const useMediaPlaybackStore = create<MediaPlaybackStore>()(
    devtools(
        persist(
            (set, get) => ({
                instances: new Map(),
                volume: loadVolumeSettings().volume,
                isMuted: loadVolumeSettings().isMuted,
                activeVolumePopoverId: null,
                register: (id, instance, type) =>
                    set((state) => {
                        const newInstances = new Map(state.instances);
                        newInstances.set(id, { type, instance });
                        return { instances: newInstances };
                    }),
                unregister: (id) =>
                    set((state) => {
                        const newInstances = new Map(state.instances);
                        newInstances.delete(id);
                        return { instances: newInstances };
                    }),
                notifyPlay: (id) => {
                    const { instances } = get();
                    instances.forEach((mediaInstance, instanceId) => {
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
                },
                pauseAll: () => {
                    const { instances } = get();
                    console.log('[pauseAll] Called, instances:', instances.size);
                    instances.forEach((mediaInstance, id) => {
                        console.log('[pauseAll] Instance:', id, 'type:', mediaInstance.type);
                        if (mediaInstance.type === 'audio') {
                            const wavesurfer = mediaInstance.instance as WaveSurfer;
                            console.log('[pauseAll] Audio isPlaying:', wavesurfer.isPlaying());
                            if (wavesurfer.isPlaying()) {
                                wavesurfer.pause();
                                console.log('[pauseAll] Audio paused');
                            }
                        } else if (mediaInstance.type === 'video') {
                            const video = mediaInstance.instance as HTMLVideoElement;
                            console.log('[pauseAll] Video paused:', video.paused);
                            if (!video.paused) {
                                video.pause();
                                console.log('[pauseAll] Video paused');
                            }
                        }
                    });
                },
                setVolume: (volume) =>
                    set({
                        volume,
                        isMuted: volume === 0
                    }),
                setMuted: (isMuted) => set({ isMuted }),
                setActiveVolumePopover: (idOrUpdater) =>
                    set((state) => ({
                        activeVolumePopoverId: typeof idOrUpdater === 'function' ? idOrUpdater(state.activeVolumePopoverId) : idOrUpdater
                    }))
            }),
            {
                name: STORAGE_KEY,
                partialize: (state) => ({
                    volume: state.volume,
                    isMuted: state.isMuted
                })
            }
        ),
        { name: 'MediaPlaybackStore' }
    )
);

export const useMediaPlayback = () =>
    useMediaPlaybackStore(
        useShallow((state) => ({
            volume: state.volume,
            isMuted: state.isMuted,
            activeVolumePopoverId: state.activeVolumePopoverId,
            register: state.register,
            unregister: state.unregister,
            notifyPlay: state.notifyPlay,
            pauseAll: state.pauseAll,
            setVolume: state.setVolume,
            setMuted: state.setMuted,
            setActiveVolumePopover: state.setActiveVolumePopover
        }))
    );
