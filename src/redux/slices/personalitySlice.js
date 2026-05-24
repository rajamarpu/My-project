import { createSlice } from '@reduxjs/toolkit'

const initialState = {
  selectedPersonality: null,
  favorites: [],
  personalities: [],
}

const personalitySlice = createSlice({
  name: 'personality',
  initialState,
  reducers: {
    setSelectedPersonality: (state, action) => {
      state.selectedPersonality = action.payload
    },
    toggleFavorite: (state, action) => {
      const id = action.payload
      if (state.favorites.includes(id)) {
        state.favorites = state.favorites.filter((favId) => favId !== id)
      } else {
        state.favorites.push(id)
      }
    },
    setPersonalities: (state, action) => {
      state.personalities = action.payload
    },
  },
})

export const { setSelectedPersonality, toggleFavorite, setPersonalities } = personalitySlice.actions
export default personalitySlice.reducer