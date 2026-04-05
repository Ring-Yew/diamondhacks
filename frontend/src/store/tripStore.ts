import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  TripInput,
  CitySuggestion,
  ItineraryPlan,
  User,
  ChatMessage,
} from "@/types";

interface TripStore {
  // Auth
  user: User | null;
  setUser: (user: User | null) => void;

  // Trip wizard state
  tripInput: Partial<TripInput>;
  setTripInput: (input: Partial<TripInput>) => void;
  resetTripInput: () => void;

  // City suggestions
  citySuggestions: CitySuggestion[];
  setCitySuggestions: (suggestions: CitySuggestion[]) => void;
  acceptedSuggestions: string[];
  toggleSuggestion: (city: string) => void;

  // Generated plans
  itineraryPlans: ItineraryPlan[];
  setItineraryPlans: (plans: ItineraryPlan[]) => void;
  selectedPlanId: string | null;
  setSelectedPlanId: (id: string) => void;

  // Loading states
  isGenerating: boolean;
  setIsGenerating: (v: boolean) => void;

  // George chat
  georgeMessages: ChatMessage[];
  addGeorgeMessage: (msg: ChatMessage) => void;
  clearGeorgeMessages: () => void;
  isGeorgeOpen: boolean;
  setGeorgeOpen: (v: boolean) => void;
}

export const useTripStore = create<TripStore>()(
  persist(
    (set) => ({
      user: null,
      setUser: (user) => set({ user }),

      tripInput: {},
      setTripInput: (input) =>
        set((s) => ({ tripInput: { ...s.tripInput, ...input } })),
      resetTripInput: () => set({ tripInput: {} }),

      citySuggestions: [],
      setCitySuggestions: (citySuggestions) => set({ citySuggestions }),
      acceptedSuggestions: [],
      toggleSuggestion: (city) =>
        set((s) => ({
          acceptedSuggestions: s.acceptedSuggestions.includes(city)
            ? s.acceptedSuggestions.filter((c) => c !== city)
            : [...s.acceptedSuggestions, city],
        })),

      itineraryPlans: [],
      setItineraryPlans: (itineraryPlans) => set({ itineraryPlans }),
      selectedPlanId: null,
      setSelectedPlanId: (selectedPlanId) => set({ selectedPlanId }),

      isGenerating: false,
      setIsGenerating: (isGenerating) => set({ isGenerating }),

      georgeMessages: [],
      addGeorgeMessage: (msg) =>
        set((s) => ({ georgeMessages: [...s.georgeMessages, msg] })),
      clearGeorgeMessages: () => set({ georgeMessages: [] }),
      isGeorgeOpen: false,
      setGeorgeOpen: (isGeorgeOpen) => set({ isGeorgeOpen }),
    }),
    {
      name: "tripmind-store",
      partialize: (s) => ({
        user: s.user,
        georgeMessages: s.georgeMessages,
      }),
    }
  )
);
