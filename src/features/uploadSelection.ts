import { create } from 'zustand';
export const useUploadSelection = create<{
  categoryId: string | null;
  choose: (id: string | null) => void;
}>((set) => ({ categoryId: null, choose: (categoryId) => set({ categoryId }) }));
