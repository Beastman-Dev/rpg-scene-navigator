// @ts-nocheck
import { create } from 'zustand';
import type { Adventure, Scene, NPC, AppState } from '@/types';

interface AppStore extends AppState {
  // Actions
  setCurrentAdventure: (adventure: Adventure | undefined) => void;
  setCurrentScene: (scene: Scene | undefined) => void;
  setPlaying: (isPlaying: boolean) => void;
  setCurrentSession: (session: any) => void;
  updateSceneRunState: (sceneId: string, state: any) => void;
  reset: () => void;
}

export const useAppStore = create<AppStore>((set, get) => ({
  // Initial state
  currentAdventure: undefined,
  currentScene: undefined,
  isPlaying: false,
  currentSession: undefined,
  sceneRunStates: new Map(),

  // Actions
  setCurrentAdventure: (adventure) => set({ currentAdventure: adventure }),
  
  setCurrentScene: (scene) => set({ currentScene: scene }),
  
  setPlaying: (isPlaying) => set({ isPlaying }),
  
  setCurrentSession: (session) => set({ currentSession: session }),
  
  updateSceneRunState: (sceneId, state) => {
    const currentStates = get().sceneRunStates;
    const newStates = new Map(currentStates);
    newStates.set(sceneId, state);
    set({ sceneRunStates: newStates });
  },
  
  reset: () => set({
    currentAdventure: undefined,
    currentScene: undefined,
    isPlaying: false,
    currentSession: undefined,
    sceneRunStates: new Map()
  })
}));
