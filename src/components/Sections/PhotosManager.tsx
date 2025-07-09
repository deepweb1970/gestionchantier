import React, { useState, useEffect } from 'react';
import { 
  Image, Plus, Edit, Trash2, Download, Filter, Search, Calendar, 
  CheckCircle, X, Building2, Tag, Info, Upload, Eye, EyeOff, 
  ArrowLeft, ArrowRight, Maximize, Minimize, Copy, Link, Share2,
  AlertTriangle, Unlink
} from 'lucide-react';
import { useRealtimeSupabase } from '../../hooks/useRealtimeSupabase';
import { chantierService } from '../../services/chantierService';
import { Photo, Chantier } from '../../types';
import { Modal } from '../Common/Modal';
import { Button } from '../Common/Button';
import { supabase } from '../../lib/supabase';

export const PhotosManager: React.FC = () => {
  // Rest of the code remains unchanged...
};

// Function to download a photo
const downloadPhoto = (photo: Photo) => {
  // Create a download link
  const a = document.createElement('a');
  a.href = photo.url;
  a.download = photo.filename || `photo-${photo.id}.jpg`;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
};

// These components are defined here to avoid importing from lucide-react
// since they're not exported in the import statement at the top
const Grid: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <rect x="3" y="3" width="7" height="7" />
    <rect x="14" y="3" width="7" height="7" />
    <rect x="14" y="14" width="7" height="7" />
    <rect x="3" y="14" width="7" height="7" />
  </svg>
);

const List: React.FC<{ className?: string }> = ({ className }) => (
  <svg 
    xmlns="http://www.w3.org/2000/svg" 
    width="24" 
    height="24" 
    viewBox="0 0 24 24" 
    fill="none" 
    stroke="currentColor" 
    strokeWidth="2" 
    strokeLinecap="round" 
    strokeLinejoin="round" 
    className={className}
  >
    <line x1="8" y1="6" x2="21" y2="6" />
    <line x1="8" y1="12" x2="21" y2="12" />
    <line x1="8" y1="18" x2="21" y2="18" />
    <line x1="3" y1="6" x2="3.01" y2="6" />
    <line x1="3" y1="12" x2="3.01" y2="12" />
    <line x1="3" y1="18" x2="3.01" y2="18" />
  </svg>
);