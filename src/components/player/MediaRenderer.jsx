import React from 'react';
import { interpolate, useCurrentFrame } from 'remotion';

export default function MediaRenderer({ item }) {
  const frame = useCurrentFrame();

  if (item.type === 'image') {
    return (
      <div style={{
        position: 'absolute',
        width: '100%',
        height: '100%',
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        backgroundColor: '#000'
      }}>
        <img
          src={item.url}
          style={{
            maxWidth: '100%',
            maxHeight: '100%',
            objectFit: 'contain'
          }}
          alt=""
        />
      </div>
    );
  }

  return (
    <div style={{
      position: 'absolute',
      width: '100%',
      height: '100%',
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      backgroundColor: '#000'
    }}>
      <video
        src={item.url}
        style={{
          maxWidth: '100%',
          maxHeight: '100%',
          objectFit: 'contain'
        }}
        muted
      />
    </div>
  );
}