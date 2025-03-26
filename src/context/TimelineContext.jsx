import React, { createContext, useContext, useReducer, useCallback } from 'react';

const TimelineContext = createContext(null);

const initialState = {
  items: [],
  audio: null,
  duration: 0,
  currentTime: 0,
  isPlaying: false,
  beatMarkers: [],
  wavesurfer: null,
  zoom: 1,
  audioControls: null,
};

function timelineReducer(state, action) {
  switch (action.type) {
    case 'ADD_ITEM':
      return {
        ...state,
        items: [...state.items, action.payload],
      };
    case 'SET_AUDIO':
      return {
        ...state,
        audio: action.payload,
      };
    case 'SET_DURATION':
      return {
        ...state,
        duration: action.payload,
        currentTime: Math.min(state.currentTime, action.payload)
      };
    case 'SET_CURRENT_TIME':
      // Prevent unnecessary updates
      if (Math.abs(state.currentTime - action.payload) < 16) { // ~1 frame at 60fps
        return state;
      }
      return {
        ...state,
        currentTime: Math.min(action.payload, state.duration)
      };
    case 'TOGGLE_PLAY':
      return {
        ...state,
        isPlaying: !state.isPlaying,
      };
    case 'CLEAR_ITEMS':
      return {
        ...state,
        items: [],
      };
    case 'UPDATE_ITEM':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id ? action.payload : item
        )
      };
    case 'REMOVE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    case 'UPDATE_ITEM_TIME':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, startTime: item.startTime + action.payload.startTime }
            : item
        )
      };
    case 'UPDATE_ITEM_DURATION':
      return {
        ...state,
        items: state.items.map(item =>
          item.id === action.payload.id
            ? { ...item, duration: action.payload.duration }
            : item
        )
      };
    case 'SET_BEAT_MARKERS':
      return {
        ...state,
        beatMarkers: action.payload.map(marker => ({
          ...marker,
          active: true // Add active property to each beat marker
        }))
      };
    case 'TOGGLE_BEAT_MARKER':
      return {
        ...state,
        beatMarkers: state.beatMarkers.map((marker, index) => 
          index === action.payload ? { ...marker, active: !marker.active } : marker
        )
      };
    case 'SET_WAVESURFER':
      if (state.wavesurfer === action.payload) {
        return state;
      }
      return { ...state, wavesurfer: action.payload };
    case 'SET_PLAYING':
      if (state.wavesurfer) {
        if (action.payload) {
          state.wavesurfer.play();
        } else {
          state.wavesurfer.pause();
        }
      }
      return { ...state, isPlaying: action.payload };
    case 'SET_ZOOM':
      return {
        ...state,
        zoom: action.payload
      };
    case 'SET_AUDIO_CONTROLS':
      return {
        ...state,
        audioControls: action.payload
      };
    case 'DELETE_ITEM':
      return {
        ...state,
        items: state.items.filter(item => item.id !== action.payload)
      };
    default:
      return state;
  }
}

export function TimelineProvider({ children }) {
  const [state, dispatch] = useReducer(timelineReducer, initialState);

  const memoizedDispatch = useCallback(dispatch, []);

  return (
    <TimelineContext.Provider value={{ state, dispatch: memoizedDispatch }}>
      {children}
    </TimelineContext.Provider>
  );
}

export function useTimeline() {
  return useContext(TimelineContext);
}
