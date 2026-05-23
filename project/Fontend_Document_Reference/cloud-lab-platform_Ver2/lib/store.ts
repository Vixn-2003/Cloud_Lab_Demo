import { create } from 'zustand';
import { persist } from 'zustand/middleware';

interface EditorSettings {
  fontSize: number;
  tabSize: number;
  keyBindings: 'default' | 'vim' | 'emacs';
}

interface TerminalSettings {
  fontSize: number;
  cursorStyle: 'block' | 'underline' | 'bar';
  scrollback: number;
}

interface AppState {
  // Editor settings
  editorSettings: EditorSettings;
  setEditorSettings: (settings: Partial<EditorSettings>) => void;

  // Terminal settings
  terminalSettings: TerminalSettings;
  setTerminalSettings: (settings: Partial<TerminalSettings>) => void;

  // Last visited lab for "Continue Learning"
  lastLabId: string | null;
  setLastLabId: (id: string) => void;

  // Draft code storage (per lab)
  drafts: Record<string, string>;
  saveDraft: (labId: string, code: string) => void;
  getDraft: (labId: string) => string | undefined;
  clearDraft: (labId: string) => void;
}

export const useAppStore = create<AppState>()(
  persist(
    (set, get) => ({
      // Editor defaults
      editorSettings: {
        fontSize: 14,
        tabSize: 2,
        keyBindings: 'default',
      },
      setEditorSettings: (settings) =>
        set((state) => ({
          editorSettings: { ...state.editorSettings, ...settings },
        })),

      // Terminal defaults
      terminalSettings: {
        fontSize: 14,
        cursorStyle: 'block',
        scrollback: 1000,
      },
      setTerminalSettings: (settings) =>
        set((state) => ({
          terminalSettings: { ...state.terminalSettings, ...settings },
        })),

      // Last lab
      lastLabId: null,
      setLastLabId: (id) => set({ lastLabId: id }),

      // Drafts
      drafts: {},
      saveDraft: (labId, code) =>
        set((state) => ({
          drafts: { ...state.drafts, [labId]: code },
        })),
      getDraft: (labId) => get().drafts[labId],
      clearDraft: (labId) =>
        set((state) => {
          const { [labId]: _, ...rest } = state.drafts;
          return { drafts: rest };
        }),
    }),
    {
      name: 'cloud-lab-storage',
      partialize: (state) => ({
        editorSettings: state.editorSettings,
        terminalSettings: state.terminalSettings,
        lastLabId: state.lastLabId,
        drafts: state.drafts,
      }),
    }
  )
);
