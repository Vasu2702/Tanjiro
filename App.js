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

  const secondsToMinutesAndSeconds = (seconds) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = Math.floor(seconds % 60);
    return `${minutes}:${remainingSeconds < 10 ? '0' : ''}${remainingSeconds}`;
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
    if (editorContent) {
      const newNote = {
        timestamp: formattedTime,
        totalSeconds: currentTime,
        content: editorContent,
        date: new Date().toLocaleDateString(),
        clickableTimestamp: `[${formattedTime}]`, // Formatted clickable timestamp
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
      <h1>{"Video Player With Notes"}</h1>
      <input type="text" placeholder="Enter YouTube Video ID" onChange={(e) => updateVideo(e.target.value)} />
      <br />
      <button onClick={(e) => updateVideo(e.target.value)}>Change Video</button>
      <br />
      <ReactPlayer ref={playerRef} url={videoUrl} controls width="720px" height="405px" />
      <h2 className='title'>{videoTitle}</h2>
      <div className="notes-container">
        <h2>My Notes</h2>
        <button onClick={() => setIsEditorOpen(true)}>Add New Note</button>
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
              <button onClick={handleAddNote}>Save Note</button>
            ) : (
              <button onClick={saveEditedNote}>Save Edited Note</button>
            )}
          </div>
        )}
        {notes.map((note, index) => (
          <div className="note" key={index}>
            <p>
              {note.date}
              <a href={`#${note.timestamp}`} onClick={() => playerRef.current.seekTo(note.totalSeconds)}>
                <br />
                {"Timestamp-"}
                
                {note.clickableTimestamp}
              </a>
            </p>
            <p dangerouslySetInnerHTML={{ __html: note.content }} />
            <button className='del' onClick={() => handleDeleteNote(index)}>Delete</button>
            <button className='edit' onClick={() => handleEditNote(index)}>Edit</button>
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
