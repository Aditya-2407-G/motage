import React, { createContext, useContext, useReducer } from 'react';

const MediaContext = createContext(null);

const initialState = {
  images: [],
  videos: [],
  audio: null,
  beatMarkers: [],
};

function mediaReducer(state, action) {
  switch (action.type) {
    case 'ADD_IMAGES':
      return { ...state, images: [...state.images, ...action.payload] };
    case 'ADD_VIDEOS':
      return { ...state, videos: [...state.videos, ...action.payload] };
    case 'SET_AUDIO':
      return { ...state, audio: action.payload };
    case 'SET_BEAT_MARKERS':
      return { ...state, beatMarkers: action.payload };
    case 'REMOVE_MEDIA':
      return {
        ...state,
        images: state.images.filter(img => img.id !== action.payload),
        videos: state.videos.filter(vid => vid.id !== action.payload)
      };
    default:
      return state;
  }
}

export function MediaProvider({ children }) {
  const [state, dispatch] = useReducer(mediaReducer, initialState);

  return (
    <MediaContext.Provider value={{ state, dispatch }}>
      {children}
    </MediaContext.Provider>
  );
}

export function useMedia() {
  const context = useContext(MediaContext);
  if (!context) {
    throw new Error('useMedia must be used within a MediaProvider');
  }
  return context;
  
}

