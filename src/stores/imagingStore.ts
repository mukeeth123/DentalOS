import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { ImagingRecord } from "@/types";
import imagingData from "@/mock/imaging.json";

interface ImagingStore {
  images: ImagingRecord[];
}

export const useImagingStore = create<ImagingStore>()(
  persist(
    () => ({
      images: imagingData as ImagingRecord[],
    }),
    { name: "dental-imaging" }
  )
);
