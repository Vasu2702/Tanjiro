import React, { useState, useEffect, useRef } from 'react';
import ReactPlayer from 'react-player';
import ReactQuill from 'react-quill';
import 'react-quill/dist/quill.snow.css';
import "./App.css"

// Custom toolbar component
const CustomToolbar = () => (
  <div id="toolbar">
    <select className="ql-color" />
    <select className="ql-background" />
    <button className="ql-bold" />
    <button className="ql-italic" />
    <button className="ql-underline" />
    <button className="ql-strike" />
    {/* Add more buttons as needed */}
  </div>
);

const App = () => {
  const [videoID, setVideoID] = useState('1H_3akZopkg'); // Default video ID
  const [notes, setNotes] = useState([]);
  const [editorContent, setEditorContent] = useState('');
  const [isEditorOpen, setIsEditorOpen] = useState(false);
  const [editIndex, setEditIndex] = useState(null); // Track the index of the note being edited
  const playerRef = useRef(null); // Create a ref
  function getFormattedDate() {
    const today = new Date();
    const day = today.getDate();
    const month = today.toLocaleDateString("en-US", { month: "long" }).slice(0, 3); // Get first 3 letters of month
    const year = today.getFullYear();
    return `${day} ${month} '${year}`;
  }

  const secondsToMinutesAndSeconds = (elapsed) => {
    const seconds = Math.floor(elapsed ) % 60;
  const minutes = Math.floor(elapsed / (60)) % 60;
  const hours = Math.floor(elapsed / (60 * 60));

  // Format the time string based on hours
  if (hours > 0) {
    return `${hours} hr ${minutes} min ${seconds} sec`;
  } else {
    return `${minutes} min ${seconds} sec`;
  }

  };

  useEffect(() => {
    const getNotes = () => {
      const storedNotes = localStorage.getItem(`notes-${videoID}`);
      if (storedNotes) {
        setNotes(JSON.parse(storedNotes));
      }
    };

    getNotes();
  }, [videoID]); // Dependency array includes videoID

  const handleAddNote = () => {
    const currentTime = playerRef.current.getCurrentTime();
    const formattedTime = secondsToMinutesAndSeconds(currentTime);
    const currentDateElement = getFormattedDate();
    if (editorContent) {
      const newNote = {
        timestamp: formattedTime,
        totalSeconds: currentTime,
        content: editorContent,
        date:currentDateElement ,
        clickableTimestamp: `${formattedTime}`, // Formatted clickable timestamp
      };

      setNotes([...notes, newNote]);
      localStorage.setItem(`notes-${videoID}`, JSON.stringify([...notes, newNote]));
      setEditorContent('');
      setIsEditorOpen(false);
    }
  };

  const handleDeleteNote = (noteIndex) => {
    const newNotes = notes.filter((note, index) => index !== noteIndex);
    setNotes(newNotes);
    localStorage.setItem(`notes-${videoID}`, JSON.stringify(newNotes));
  };

  const handleEditNote = (noteIndex) => {
    setEditorContent(notes[noteIndex].content);
    setEditIndex(noteIndex);
    setIsEditorOpen(true);
  };

  const saveEditedNote = () => {
    const newNotes = notes.map((note, index) =>
      index === editIndex ? { ...note, content: editorContent } : note
    );
    setNotes(newNotes);
    localStorage.setItem(`notes-${videoID}`, JSON.stringify(newNotes));
    setEditorContent('');
    setIsEditorOpen(false);
    setEditIndex(null);
  };

  // Function to update video ID
  const updateVideo = (newVideoID) => {
    setVideoID(newVideoID);
  };

  const [videoTitle, setVideoTitle] = useState('TITLE'); // State for video title

  useEffect(() => {
    const fetchVideoTitle = async () => {
      const API_KEY = 'AIzaSyBCy9xaEBUS1bR_HueaCv7Z2ABKWYQA4cY'; // Replace with your API key
      const response = await fetch(`https://www.googleapis.com/youtube/v3/videos?part=snippet&id=${videoID}&key=${API_KEY}`);
      if (!response.ok) {
        console.error('Error fetching video title:', response.statusText);
        return; // Handle the error gracefully or set a default title
      }

      const data = await response.json();
      if (!data || !data.items || !data.items[0]) {
        console.error('Missing video data in response');
        return; // Handle the error or set a default title
      }

      setVideoTitle(data.items[0].snippet.title); // Extract title only if data is valid
    };

    fetchVideoTitle();
  }, [videoID]);

  const videoUrl = `https://www.youtube.com/watch?v=${videoID}`;

  return (
    <div className="video-player-container">
      <h1 className='vd'>{"Video Player With Notes"}</h1>
      <input type="text" placeholder="Enter YouTube Video ID" onChange={(e) => updateVideo(e.target.value)} />
      <br />
      <button className="cv" onClick={(e) => updateVideo(e.target.value)}>Change Video</button>
      <br />
      <div className="video-wrapper">
        <ReactPlayer ref={playerRef} url={videoUrl} controls width="900px" height="500px" />
      </div>
      <h2 className='title'>{videoTitle}</h2>
      <div className="notes-container">
      <h2>
          My Notes
          <button className="add-note-button" onClick={() => setIsEditorOpen(true)}>
            <span className="plus-icon-wrapper">
              <span className="plus-icon">+</span>
            </span>
            Add New Note
          </button>

        </h2>
        <p className='para'>All your notes at a single place.Click on any note to go to specific timestamp in the video</p>
        
        {isEditorOpen && (
          <div className="editor-container">
            <CustomToolbar />
            <ReactQuill
              value={editorContent}
              onChange={setEditorContent}
              modules={App.modules}
              formats={App.formats}
            />
            {editIndex === null ? (
              <button className="cv" onClick={handleAddNote}>Save Note</button>
            ) : (
              <button onClick={saveEditedNote}>Save Edited Note</button>
            )}
          </div>
        )}
        {notes.map((note, index) => (
          <div className="note" key={index}>
            <div className="note-content">
              <p className='para'>{note.date}</p>
              
              <p className='para'>{"Timestamp:"}</p>
              <a className="bl" href={`#${note.timestamp}`} onClick={() => playerRef.current.seekTo(note.totalSeconds)}>
                {note.clickableTimestamp}
              </a>
              <p dangerouslySetInnerHTML={{ __html: note.content }} />
            </div>
            <div className="note-actions">
              <button className='cv' onClick={() => handleDeleteNote(index)}>Delete</button>
              <button className='cv' onClick={() => handleEditNote(index)}>Edit</button>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// Quill modules and formats to include the custom toolbar and color options
App.modules = {
  toolbar: {
    container: "#toolbar",
    handlers: {
      // Custom handlers can be added here
    },
  },
};

App.formats = [
  'bold', 'italic', 'underline', 'strike', 'color', 'background'
];

export default App;
