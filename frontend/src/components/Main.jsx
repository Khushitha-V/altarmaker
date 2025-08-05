import React, { useState, useCallback, useRef } from "react";
import { v4 as uuidv4 } from "uuid";
import { useNavigate } from "react-router-dom";
import Header from "./Header";
import Sidebar from "./Sidebar";
import Canvas from "./Canvas";
import Room3D from "./Room3D";
import SessionModal from "./SessionModal";
import AlertModal from "./AlertModal";
import InputModal from "./InputModal";
import AdminPanel from "./AdminPanel";
import { API_BASE_URL } from '../config';
import "./Main.css";

// Helper to generate a random color (same as in Canvas.jsx)
function getRandomColor() {
  const letters = '0123456789ABCDEF';
  let color = '#';
  for (let i = 0; i < 6; i++) {
    color += letters[Math.floor(Math.random() * 16)];
  }
  return color;
}

const Main = ({ user, onLogout }) => {
  const navigate = useNavigate();
  const [elements, setElements] = useState([]);
  const [selectedElementId, setSelectedElementId] = useState(null);
  const [wallpaper, setWallpaper] = useState(null);
  const [canvasSize, setCanvasSize] = useState({ width: 900, height: 600 });
  const [canvasRef, setCanvasRef] = useState(null);
  const [isDownloadMode, setIsDownloadMode] = useState(false);
  const [roomType, setRoomType] = useState("");
  const [selectedWall, setSelectedWall] = useState("");
  const [roomDimensions, setRoomDimensions] = useState({
    length: 8,
    width: 8,
    height: 4
  });

  // 3D view state
  const [is3DView, setIs3DView] = useState(false);

  // Wall-specific design storage
  const [wallDesigns, setWallDesigns] = useState({
    front: { elements: [], wallpaper: null },
    back: { elements: [], wallpaper: null },
    left: { elements: [], wallpaper: null },
    right: { elements: [], wallpaper: null }
  });

  // Use ref to track current selectedWall without dependency issues
  const selectedWallRef = useRef(selectedWall);
  selectedWallRef.current = selectedWall;

  // Ensure selectedWallRef is always updated
  React.useEffect(() => {
    selectedWallRef.current = selectedWall;
  }, [selectedWall]);



  // Track loaded session key and name
  const [loadedSessionKey, setLoadedSessionKey] = React.useState(null);
  const [loadedSessionName, setLoadedSessionName] = React.useState(null);
  
  // Session modal state
  const [isSessionModalOpen, setIsSessionModalOpen] = React.useState(false);
  const [availableSessions, setAvailableSessions] = React.useState([]);
  const [isLoadingSessions, setIsLoadingSessions] = React.useState(false);

  // Alert modal state
  const [alertModal, setAlertModal] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    type: 'info',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel',
    showCancel: false
  });

  // Input modal state
  const [inputModal, setInputModal] = React.useState({
    isOpen: false,
    title: '',
    message: '',
    defaultValue: '',
    placeholder: '',
    onConfirm: null,
    onCancel: null,
    confirmText: 'OK',
    cancelText: 'Cancel'
  });

  // Helper functions for showing alerts and confirmations
  const showAlert = (title, message, type = 'info', onConfirm = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type,
      onConfirm: onConfirm || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      onCancel: () => setAlertModal(prev => ({ ...prev, isOpen: false })),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: false
    });
  };

  const showConfirmation = (title, message, onConfirm, onCancel = null) => {
    setAlertModal({
      isOpen: true,
      title,
      message,
      type: 'warning',
      onConfirm: () => {
        onConfirm();
        setAlertModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: onCancel || (() => setAlertModal(prev => ({ ...prev, isOpen: false }))),
      confirmText: 'OK',
      cancelText: 'Cancel',
      showCancel: true
    });
  };

  const showInputModal = (title, message, defaultValue = '', placeholder = '', onConfirm, onCancel = null) => {
    setInputModal({
      isOpen: true,
      title,
      message,
      defaultValue,
      placeholder,
      onConfirm: (value) => {
        onConfirm(value);
        setInputModal(prev => ({ ...prev, isOpen: false }));
      },
      onCancel: onCancel || (() => setInputModal(prev => ({ ...prev, isOpen: false }))),
      confirmText: 'Save',
      cancelText: 'Cancel'
    });
  };

  // Function to save wall designs to backend
  const saveWallDesignsToBackend = useCallback(async (designs) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/designs/wall-designs`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          wallDesigns: designs,
          roomType: roomType,
          roomDimensions: roomDimensions,
          selectedWall: selectedWall
        }),
      });

      if (!response.ok) {
        console.error('Failed to save wall designs to backend');
      }
    } catch (error) {
      console.error('Error saving wall designs to backend:', error);
    }
  }, [roomType, roomDimensions, selectedWall]);

  // Function to load wall designs from backend
  const loadWallDesignsFromBackend = useCallback(async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/designs/wall-designs`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        if (data.wallDesigns) {
          setWallDesigns(data.wallDesigns);
          setRoomType(data.roomType || "");
          setRoomDimensions(data.roomDimensions || { length: 8, width: 8, height: 4 });
          setSelectedWall(data.selectedWall || "");
        }
      }
    } catch (error) {
      console.error('Error loading wall designs from backend:', error);
    }
  }, []);

  // Load wall designs from backend on component mount
  React.useEffect(() => {
    loadWallDesignsFromBackend();
  }, [loadWallDesignsFromBackend]);

  // Save wall designs to backend whenever they change
  React.useEffect(() => {
    if (Object.keys(wallDesigns).length > 0) {
      // Debounce the save operation to prevent too many API calls
      const timeoutId = setTimeout(() => {
        saveWallDesignsToBackend(wallDesigns);
      }, 1000); // Wait 1 second before saving
      
      return () => clearTimeout(timeoutId);
    }
  }, [wallDesigns, saveWallDesignsToBackend]);

  // Function to fetch sessions from backend
  const fetchSessions = useCallback(async () => {
    setIsLoadingSessions(true);
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        console.log('Raw sessions data from backend:', data.sessions);
        
        const sessions = data.sessions.map(session => ({
          key: session._id,
          roomType: session.room_type || 'Unknown',
          saveDate: session.created_at,
          isUpdated: session.updated_at !== session.created_at,
          originalSaveDate: session.created_at,
          displayName: session.session_name || `${session.room_type || 'Unknown'} Room - ${new Date(session.created_at).toLocaleDateString()}`,
          sessionName: session.session_name || '',
          sessionData: session
        }));
        
        console.log('Processed sessions:', sessions);
        setAvailableSessions(sessions);
        return sessions;
      } else {
        console.error('Failed to fetch sessions:', response.status);
        return [];
      }
    } catch (error) {
      console.error('Error fetching sessions:', error);
      return [];
    } finally {
      setIsLoadingSessions(false);
    }
  }, []);

  // Function to save entire room design as session to backend
  const saveRoomDesign = useCallback(async () => {
    try {
      let sessionId = loadedSessionKey;
      let sessionName = loadedSessionName;
      let isUpdate = false;

      // If no session loaded, prompt for name and create new session
      if (!sessionId) {
        const defaultName = `${roomType || 'Room'} - ${new Date().toLocaleString()}`;
        
        showInputModal(
          'Save Session',
          'Enter a name for this session:',
          defaultName,
          'Enter session name...',
          (inputSessionName) => {
            if (!inputSessionName || !inputSessionName.trim()) {
              showAlert('Session Name Required', 'Session name is required. Save cancelled.', 'error');
              return;
            }
            sessionName = inputSessionName.trim();
            isUpdate = false;
            // Continue with the save operation
            saveRoomDesignWithName(sessionName, isUpdate);
          }
        );
        return; // Exit early, the save will continue in the callback
      } else {
        isUpdate = true;
        sessionName = loadedSessionName;
      }

      const sessionData = {
        session_name: sessionName.trim(),
        room_type: roomType,
        room_dimensions: roomDimensions,
        wall_designs: wallDesigns,
        selected_wall: selectedWall
      };

      let response;
      if (isUpdate) {
        // Update existing session
        response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(sessionData),
        });
      } else {
        // Create new session
        response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(sessionData),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (!isUpdate) {
          sessionId = data.session._id;
        }
        setLoadedSessionKey(sessionId);
        setLoadedSessionName(sessionName.trim());
        console.log(`Room design ${isUpdate ? 'updated' : 'saved'} as session successfully`);
        showAlert('Success', `Room design ${isUpdate ? 'updated' : 'saved'} as session!`, 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', `Error saving session: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving room design session:', error);
      showAlert('Error', 'Error saving room design session. Please try again.', 'error');
    }
  }, [roomType, selectedWall, roomDimensions, wallDesigns, loadedSessionKey, loadedSessionName]);

  // Helper function to save room design with a specific name
  const saveRoomDesignWithName = useCallback(async (sessionName, isUpdate) => {
    try {
      let sessionId = loadedSessionKey;

      const sessionData = {
        session_name: sessionName,
        room_type: roomType,
        room_dimensions: roomDimensions,
        wall_designs: wallDesigns,
        selected_wall: selectedWall
      };

      let response;
      if (isUpdate) {
        // Update existing session
        response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
          method: 'PUT',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(sessionData),
        });
      } else {
        // Create new session
        response = await fetch(`${API_BASE_URL}/api/sessions`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          credentials: 'include',
          body: JSON.stringify(sessionData),
        });
      }

      if (response.ok) {
        const data = await response.json();
        if (!isUpdate) {
          sessionId = data.session._id;
        }
        setLoadedSessionKey(sessionId);
        setLoadedSessionName(sessionName);
        console.log(`Room design ${isUpdate ? 'updated' : 'saved'} as session successfully`);
        showAlert('Success', `Room design ${isUpdate ? 'updated' : 'saved'} as session!`, 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', `Error saving session: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error saving room design session:', error);
      showAlert('Error', 'Error saving room design session. Please try again.', 'error');
    }
  }, [roomType, selectedWall, roomDimensions, wallDesigns, loadedSessionKey]);

  // Function to open session modal and load available sessions
  const openSessionModal = useCallback(async () => {
    try {
      const sessions = await fetchSessions();
      setIsSessionModalOpen(true);
    } catch (error) {
      console.error('Error loading sessions:', error);
      showAlert('Error', 'Error loading sessions. Please try again.', 'error');
    }
  }, [fetchSessions]);

  // Function to load a specific session from backend
  const loadSession = useCallback(async (session) => {
    try {
      console.log('Loading session:', session);
      
      // Use the session key (which is the _id from backend)
      const sessionId = session.key;
      
      if (!sessionId) {
        console.error('No session ID found');
        showAlert('Error', 'Error: No session ID found', 'error');
        return;
      }

      const response = await fetch(`${API_BASE_URL}/api/sessions/${sessionId}`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        const data = await response.json();
        const roomDesign = data.session;
        
        console.log('Loaded session data:', roomDesign);
        
        // Restore room state
        setRoomType(roomDesign.room_type || '');
        setSelectedWall(roomDesign.selected_wall || '');
        setRoomDimensions(roomDesign.room_dimensions || { length: 8, width: 8, height: 4 });
        
        // Restore wall designs
        if (roomDesign.wall_designs) {
        setWallDesigns(roomDesign.wall_designs);
        } else {
          // Set empty wall designs if none exist
          setWallDesigns({
            front: { elements: [], wallpaper: null },
            back: { elements: [], wallpaper: null },
            left: { elements: [], wallpaper: null },
            right: { elements: [], wallpaper: null }
          });
        }
        
        setLoadedSessionKey(sessionId);
        setLoadedSessionName(roomDesign.session_name || '');
        
        // Restore current wall elements and wallpaper
        if (roomDesign.selected_wall && roomDesign.wall_designs && roomDesign.wall_designs[roomDesign.selected_wall]) {
          const currentWallDesign = roomDesign.wall_designs[roomDesign.selected_wall];
          setElements(currentWallDesign.elements || []);
          setWallpaper(currentWallDesign.wallpaper || null);
        } else {
          setElements([]);
          setWallpaper(null);
        }
        
        console.log('Room design loaded from session successfully:', roomDesign);
        showAlert('Success', `Room design loaded successfully from session: ${session.displayName}`, 'success');
      } else {
        const errorData = await response.json();
        console.error('Error loading session:', errorData);
        showAlert('Error', `Error loading session: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error loading room design session:', error);
      showAlert('Error', 'Error loading room design session. Please try again.', 'error');
    }
  }, []);

  // Function to delete a session from backend
  const deleteSession = useCallback(async (session) => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/sessions/${session.key}`, {
        method: 'DELETE',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
      });

      if (response.ok) {
        // Remove from available sessions list
        setAvailableSessions(prev => prev.filter(s => s.key !== session.key));
        console.log('Session deleted successfully:', session.displayName);
        showAlert('Success', `Session "${session.displayName}" deleted successfully.`, 'success');
      } else {
        const errorData = await response.json();
        showAlert('Error', `Error deleting session: ${errorData.error || 'Unknown error'}`, 'error');
      }
    } catch (error) {
      console.error('Error deleting session:', error);
      showAlert('Error', 'Error deleting session. Please try again.', 'error');
    }
  }, []);

  // Function to create new session (clear all walls)
  const newSession = useCallback(() => {
    showConfirmation(
      'Start New Session',
      'Are you sure you want to start a new session? This will clear all current wall designs.',
      () => {
        // Reset room state to initial values
        setRoomType('');
        setSelectedWall('');
        setRoomDimensions({ length: 8, width: 8, height: 4 });
        // Clear all wall designs
        const emptyDesigns = {
          front: { elements: [], wallpaper: null },
          back: { elements: [], wallpaper: null },
          left: { elements: [], wallpaper: null },
          right: { elements: [], wallpaper: null }
        };
        setWallDesigns(emptyDesigns);
        // Clear current canvas
        setElements([]);
        setWallpaper(null);
        setLoadedSessionKey(null);
        setLoadedSessionName(null);
        console.log('New session started - all walls cleared');
        showAlert('Success', 'New session started! All walls have been cleared.', 'success');
      }
    );
  }, []);

  // Function to save as new session (force new session creation)
  const saveAsNewSession = useCallback(async () => {
    const defaultName = `${roomType || 'Room'} - ${new Date().toLocaleString()}`;
    
    showInputModal(
      'Save as New Session',
      'Enter a name for this new session:',
      defaultName,
      'Enter session name...',
      async (sessionName) => {
        if (!sessionName || !sessionName.trim()) {
          showAlert('Session Name Required', 'Session name is required. Save cancelled.', 'error');
          return;
        }

        try {
          const sessionData = {
            session_name: sessionName.trim(),
            room_type: roomType,
            room_dimensions: roomDimensions,
            wall_designs: wallDesigns,
            selected_wall: selectedWall
          };

          const response = await fetch(`${API_BASE_URL}/api/sessions`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json',
            },
            credentials: 'include',
            body: JSON.stringify(sessionData),
          });

          if (response.ok) {
            const data = await response.json();
            const sessionId = data.session._id;
            setLoadedSessionKey(sessionId);
            setLoadedSessionName(sessionName.trim());
            console.log('Room design saved as new session successfully');
            showAlert('Success', 'Room design saved as new session!', 'success');
          } else {
            const errorData = await response.json();
            showAlert('Error', `Error saving session: ${errorData.error || 'Unknown error'}`, 'error');
          }
        } catch (error) {
          console.error('Error saving room design as new session:', error);
          showAlert('Error', 'Error saving room design as new session. Please try again.', 'error');
        }
      }
    );
  }, [roomType, selectedWall, roomDimensions, wallDesigns]);

  // Callback to update canvas size from Canvas component
  const handleCanvasSize = useCallback((size) => {
    setCanvasSize(size);
  }, []);

  // Callback to get canvas ref from Canvas component
  const handleCanvasRef = useCallback((ref) => {
    setCanvasRef(ref);
  }, []);

  // Handle room type changes
  const handleRoomChange = useCallback((roomType) => {
    setRoomType(roomType);
  }, []);

  // Handle wall selection changes
  const handleWallChange = useCallback((wallType) => {
    console.log('=== WALL CHANGE DEBUG ===');
    console.log('Switching to wall:', wallType);
    console.log('Current wallDesigns state:', wallDesigns);
    
    setSelectedWall(wallType);
    
    // Only load design if a valid wall is selected
    if (wallType) {
      // Load the design for the selected wall
      const wallDesign = wallDesigns[wallType];
      console.log('Wall design for', wallType, ':', wallDesign);
      
      if (wallDesign && (wallDesign.elements.length > 0 || wallDesign.wallpaper)) {
        // Ensure elements is an array, not a function
        const actualElements = Array.isArray(wallDesign.elements) ? wallDesign.elements : [];
        console.log('Loading existing design with elements:', actualElements);
        setElements(actualElements);
        setWallpaper(wallDesign.wallpaper);
      } else {
        console.log('Loading fresh canvas for new wall');
        setElements([]);
        setWallpaper(null);
      }
    } else {
      // Empty wall selection - clear canvas
      console.log('Clearing canvas for empty wall selection');
      setElements([]);
      setWallpaper(null);
    }
  }, [wallDesigns]);

  // Handle dimension changes
  const handleDimensionsChange = useCallback((dimensions) => {
    setRoomDimensions(dimensions);
  }, []);

  // Save current design to wall storage
  const saveCurrentDesignToWall = useCallback(() => {
    console.log('Saving current design to wall:', selectedWall);
    console.log('Current elements:', elements);
    console.log('Current wallpaper:', wallpaper);
    
    setWallDesigns(prev => {
      const newDesigns = {
        ...prev,
        [selectedWall]: {
          elements: elements,
          wallpaper: wallpaper
        }
      };
      console.log('Updated wallDesigns:', newDesigns);
      return newDesigns;
    });
  }, [selectedWall, elements, wallpaper]);

  // Update elements and save to current wall
  const updateElements = useCallback((newElements) => {
    console.log('=== UPDATE ELEMENTS DEBUG ===');
    console.log('Updating elements for wall:', selectedWallRef.current);
    console.log('New elements:', newElements);
    
    // Ensure we're working with actual arrays, not functions
    const actualElements = typeof newElements === 'function' ? newElements(elements) : newElements;
    console.log('Actual elements to save:', actualElements);
    
    setElements(actualElements);
    // Auto-save to current wall using functional update to avoid dependency issues
    setWallDesigns(prev => {
      const updatedDesigns = {
        ...prev,
        [selectedWallRef.current]: {
          elements: actualElements,
          wallpaper: prev[selectedWallRef.current]?.wallpaper || null
        }
      };
      console.log('Updated wallDesigns after element change:', updatedDesigns);
      return updatedDesigns;
    });
  }, [elements]);

  // Update wallpaper and save to current wall
  const updateWallpaper = useCallback((newWallpaper) => {
    console.log('=== UPDATE WALLPAPER DEBUG ===');
    console.log('Updating wallpaper for wall:', selectedWallRef.current);
    console.log('New wallpaper:', newWallpaper);
    
    setWallpaper(newWallpaper);
    // Auto-save to current wall using functional update
    setWallDesigns(prev => {
      const updatedDesigns = {
        ...prev,
        [selectedWallRef.current]: {
          elements: prev[selectedWallRef.current]?.elements || [],
          wallpaper: newWallpaper
        }
      };
      console.log('Updated wallDesigns after wallpaper change:', updatedDesigns);
      return updatedDesigns;
    });
  }, []);

  // Update canvas size on window resize
  React.useEffect(() => {
    const handleResize = () => {
      setTimeout(() => setCanvasSize((prev) => ({ ...prev })), 100);
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  // Debug effect to track wallDesigns changes
  React.useEffect(() => {
    console.log('wallDesigns state changed:', wallDesigns);
  }, [wallDesigns]);

  // Debug effect to track elements changes
  React.useEffect(() => {
    console.log('Elements state changed:', elements);
    console.log('Elements length:', elements.length);
  }, [elements]);

  const STICKER_CATEGORIES = {
    Flowers: [
      "/images/flower1.png",
      "/images/flower2.png",
      "/images/flower3.png",
      "/images/flower4.png",
      "/images/flower5.png",
      "/images/flower6.png",
      "/images/flower7.png",
      "/images/flower8.png",
    ],
    Garlands: [
      "/images/garland1.png",
      "/images/garland2.png",
      "/images/garland3.png",
      "/images/garland4.png",
      "/images/garland5.png",
      "/images/garland6.png",
      "/images/garland7.png",
      "/images/garland8.png",
      "/images/garland9.png",
      "/images/garland10.png",
      "/images/garland11.png",
    ],
    Candles: [
      "/images/candle1.png",
      "/images/candle2.png",
      "/images/candle3.png",
      "/images/candle4.png",
    ],
    Incense: [
      "/images/Intensestick1.png",
      "/images/Intensestick2.png",
      "/images/Intensestick3.png",
      "/images/Intensestick4.png",
      "/images/Intensestick5.png",
    ],
    "Wall Decorations": [
      "/images/walldecor1.png",
      "/images/walldecor2.png",
      "/images/walldecor3.png",
      "/images/walldecor4.png",
      "/images/walldecor5.png",
      "/images/walldecor6.png",
      "/images/walldecor7.png",
      "/images/walldecor8.png",
      "/images/walldecor9.png",
      "/images/walldecor10.png",
      "/images/walldecor11.png",
      "/images/walldecor12.png",
      "/images/walldecor13.png",
      "/images/walldecor14.png",
      "/images/walldecor15.png",
      "/images/walldecor16.png",
    ],
    Tables: [
      "/images/table1.png",
      "/images/table2.png",
      "/images/table3.png",
      "/images/table4.png",
      "/images/table5.png",
      "/images/table6.png",
      "/images/table7.png",
    ],
  };
  const STICKER_CATEGORY_LIST = Object.keys(STICKER_CATEGORIES);

  const addImage = () => {
    const newElement = {
      id: uuidv4(),
      type: "image",
      content: "/sample1.jpg",
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    };
    updateElements([...elements, newElement]);
  };

  const addSticker = (stickerPath = "/marigold3.png") => {
    const newElement = {
      id: uuidv4(),
      type: "sticker",
      content: stickerPath,
      x: 50,
      y: 50,
      width: 200,
      height: 200,
    };
    console.log('Adding sticker:', newElement);
    updateElements([...elements, newElement]);
  };

  const addFrame = (frameType) => {
    const newElement = {
      id: uuidv4(),
      type: "frame",
      frameType,
      content: null,
      x: 100,
      y: 100,
      width: 200,
      height: 200,
      borderColor: getRandomColor(),
    };
    console.log('Adding frame:', newElement);
    updateElements([...elements, newElement]);
  };

  const handleLogout = () => {
    onLogout();
    navigate('/');
  };

  // Admin-specific functions
  const [isAdminPanelOpen, setIsAdminPanelOpen] = useState(false);

  const handleAdminPanel = () => {
    if (user.role === 'admin') {
      setIsAdminPanelOpen(true);
    } else {
      showAlert('Access Denied', 'Admin access required. Only admin users can access the admin panel.', 'error');
    }
  };

  return (
    <div className="app-container">
      <Header 
        loadRoomDesign={openSessionModal} 
        newSession={newSession} 
        user={user}
        onLogout={handleLogout}
        onAdminPanel={handleAdminPanel}
      />
      <div className="content-area">
        <div className="sidebar-container">
          <Sidebar
            addFrame={addFrame}
            addSticker={addSticker}
            stickers={STICKER_CATEGORIES}
            stickerCategories={STICKER_CATEGORY_LIST}
            setWallpaper={updateWallpaper}
            canvasWidth={canvasSize.width}
            canvasHeight={canvasSize.height}
            canvasRef={canvasRef}
            wallpaper={wallpaper}
            setIsDownloadMode={setIsDownloadMode}
            elements={elements}
            onRoomChange={handleRoomChange}
            onWallChange={handleWallChange}
            onDimensionsChange={handleDimensionsChange}
            selectedRoom={roomType}
            selectedWall={selectedWall}
            dimensions={roomDimensions}
            wallDesigns={wallDesigns}
            saveRoomDesign={saveRoomDesign}
            saveAsNewSession={saveAsNewSession}
          />
        </div>
        <div className="canvas-container">
          {/* 3D View Toggle Button */}
          <div style={{ 
            position: 'absolute', 
            top: '10px', 
            right: '10px', 
            zIndex: 1000,
            background: '#f8ac8c',
          }}>
            <button
              className="view-toggle-btn"
              onClick={() => setIs3DView(!is3DView)}
              style={{
                padding: '8px 16px',
                backgroundColor: '#6c5ce7 !important',
                background: '#6c5ce7 !important',
                color: 'black',
                border: 'none',
                borderRadius: '6px',
                fontSize: '14px',
                fontWeight: 'bold',
                cursor: 'pointer',
                boxShadow: '0 2px 4px rgba(0,0,0,0.2)',
                display: 'flex',
                alignItems: 'center',
                gap: '6px',
                transition: 'background-color 0.3s ease'
              }}
              onMouseEnter={(e) => {
                e.target.style.backgroundColor = '#5a4fcf';
                e.target.style.background = '#5a4fcf';
              }}
              onMouseLeave={(e) => {
                e.target.style.backgroundColor = '#6c5ce7';
                e.target.style.background = '#6c5ce7';
              }}
              title={is3DView ? 'Switch to 2D View' : 'Switch to 3D View'}
            >
              {is3DView ? '🖼️ 2D View' : '🏠 3D View'}
            </button>
          </div>
          
          {is3DView ? (
            <Room3D
              dimensions={roomDimensions}
              roomType={roomType}
              wallDesigns={wallDesigns}
            />
          ) : (
            <Canvas
              elements={elements}
              setElements={updateElements}
              selectedElementId={selectedElementId}
              setSelectedElementId={setSelectedElementId}
              wallpaper={wallpaper}
              onCanvasSize={handleCanvasSize}
              onCanvasRef={handleCanvasRef}
              isDownloadMode={isDownloadMode}
              roomType={roomType}
              selectedWall={selectedWall}
              roomDimensions={roomDimensions}
            />
          )}
        </div>
      </div>
      
      {/* Session Modal */}
      <SessionModal
        sessions={availableSessions}
        onLoadSession={loadSession}
        onDeleteSession={deleteSession}
        onClose={() => setIsSessionModalOpen(false)}
        isOpen={isSessionModalOpen}
        isLoading={isLoadingSessions}
      />

      {/* Admin Panel */}
      {isAdminPanelOpen && (
        <AdminPanel
          user={user}
          onClose={() => setIsAdminPanelOpen(false)}
        />
      )}

      {/* Alert Modal */}
      <AlertModal
        isOpen={alertModal.isOpen}
        title={alertModal.title}
        message={alertModal.message}
        type={alertModal.type}
        onConfirm={alertModal.onConfirm}
        onCancel={alertModal.onCancel}
        confirmText={alertModal.confirmText}
        cancelText={alertModal.cancelText}
        showCancel={alertModal.showCancel}
      />

      {/* Input Modal */}
      <InputModal
        isOpen={inputModal.isOpen}
        title={inputModal.title}
        message={inputModal.message}
        defaultValue={inputModal.defaultValue}
        placeholder={inputModal.placeholder}
        onConfirm={inputModal.onConfirm}
        onCancel={inputModal.onCancel}
        confirmText={inputModal.confirmText}
        cancelText={inputModal.cancelText}
      />
    </div>
  );
};

export default Main; 