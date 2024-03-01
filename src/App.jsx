import { useState, useEffect, useRef } from 'react'
import { GoogleAuthProvider, onAuthStateChanged, signInWithPopup } from 'firebase/auth'
import { doc, setDoc, getFirestore, getDoc, onSnapshot, collection, addDoc, orderBy, query, serverTimestamp, deleteDoc } from 'firebase/firestore'
import './App.css'
import { auth, app } from './firebase'
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';



const db = getFirestore(app)
const storage = getStorage(app);

function App() {
  const [user, setUser] = useState(null)
  const [messages, setMessages] = useState([])
  const [newMessage, setNewMessage] = useState("")
  const [image, setImage] = useState(null);

  const [currentChannel, setCurrentChannel] = useState('messages'); // Zustand für den aktuellen Kanal
  const [newChannelName, setNewChannelName] = useState("");
  const [channels, setChannels] = useState([]);


  useEffect(() => {
    const q = query(
      collection(db, currentChannel),
      orderBy('timestamp')
    );
    const unsubscribe = onSnapshot(q, (snapshot) => {
      setMessages(
        snapshot.docs.map((doc) => ({
          id: doc.id,
          data: doc.data()
        }))
      );


    });
    return unsubscribe;
  }, [currentChannel]);

  useEffect(() => {
    // Abfrage der Kanäle aus der Firestore-Datenbank
    const unsubscribe = onSnapshot(collection(db, 'channels'), snapshot => {
      setChannels(snapshot.docs.map(doc => ({ id: doc.id, name: doc.data().name })));
    });

    return unsubscribe;
  }, []);

  const handleAddChannel = async () => {
    if (newChannelName.trim() !== "") {
      await addDoc(collection(db, 'channels'), { name: newChannelName });
      setNewChannelName(""); // Leert das Eingabefeld nach dem Hinzufügen des Kanals
    }
  };

  const handleDeleteChannel = async (channelId) => {
    try {
      await deleteDoc(doc(db, 'channels', channelId));
    } catch (error) {
      console.error('Error deleting channel: ', error);
    }
  };


  const handleChange = (e) => {
    setNewMessage(e.target.value);
    e.target.style.height = 'auto'; // Setze die Höhe auf 'auto', um die natürliche Höhe zu erhalten
    e.target.style.height = e.target.scrollHeight + 'px'; // Setze die Höhe basierend auf dem ScrollHeight des Elements
  };


  useEffect(() => {
    onAuthStateChanged(auth, user => {
      if (user) {
        setUser(user)
      } else {
        setUser(null)
      }
    })
  }, [])

  const sendMessage = async () => {
    if (image) {
      const imageRef = ref(storage, `images/${image.name}`);
      await uploadBytes(imageRef, image);
      const imageUrl = await getDownloadURL(imageRef);

      await addDoc(collection(db, currentChannel), { // Verwende den aktuellen Kanal
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        imageUrl,
        text: newMessage,
        timestamp: serverTimestamp()
      });

      setImage(null);
    } else {
      await addDoc(collection(db, currentChannel), { // Verwende den aktuellen Kanal
        uid: user.uid,
        photoURL: user.photoURL,
        displayName: user.displayName,
        text: newMessage,
        timestamp: serverTimestamp()
      });
    }
    setNewMessage("");
  };


  const handleGoogleLogin = async () => {
    const provider = new GoogleAuthProvider()

    try {
      const result = await signInWithPopup(auth, provider)
    } catch (error) {
      console.log(error);
    }
  }

  const handleImageChange = e => {
    if (e.target.files[0]) {
      setImage(e.target.files[0]);
    }
  };



  return (
    <>
      <div className='App'>


        {user ? (
          <>
            <div>
              <div className='header1'><img id='pic' src={"https://files.cults3d.com/uploaders/13940850/illustration-file/af3a9ca5-76dd-4f06-b86d-bd7d73495f40/1bcc0f0aefe71b2c8ce66ffe8645d365.png"} />
                <h2>Discom - Live-Chat</h2></div>

              <div className='header2'><button className='btnLO' onClick={() => auth.signOut()}>Ausloggen</button></div>
            </div>
            <div className='infoLI'>eingeloggt als {user.displayName}</div>

            {<button
              className="btn"
              onClick={() => setCurrentChannel('messages')} // Setzt den aktuellen Kanal auf "messages"
            >
              #general
            </button>}


            {channels.map(channel => (
              <div key={channel.id}>
                <button
                  className="btn"
                  onClick={() => setCurrentChannel(channel.name)} // Setzt den aktuellen Kanal auf den Kanalnamen
                >
                  {`#${channel.name}`}
                </button>

                <button onClick={() => handleDeleteChannel(channel.id)}>Löschen</button>
              </div>
            ))}

            {/* Benutzeroberfläche zum Hinzufügen eines neuen Kanals */}
            <div>
              <input
                type="text"
                value={newChannelName}
                onChange={(e) => setNewChannelName(e.target.value)}
                placeholder="Neuen Kanalnamen eingeben"
              />
              <button onClick={handleAddChannel}>Kanal hinzufügen</button>
            </div>
            <br />

            {/*Scroll Container*/}
            <div className="message-container">
              {messages.map(msg => (
                <div id="full_msg" className="message" key={msg.id}>

                  <div id='mesg1' className={`message ${msg.data.uid === user.uid ? 'current' : 'other'}`}>
                    <div style={{ display: 'flex', alignItems: 'center' }}> {/* Flexbox-Container */}
                      <img id='pic' src={msg.data.photoURL} alt="User" />
                      <div>
                        <b>{msg.data.displayName}</b>{" "}
                        <div id='time'>{msg.data.timestamp ? new Date((msg.data.timestamp.seconds) * 1000).toLocaleDateString("de-DE") : null}</div>{" "}
                        <div id='time'>{msg.data.timestamp ? new Date((msg.data.timestamp.seconds) * 1000).toLocaleTimeString("de-DE", { hour: '2-digit', minute: '2-digit' }) : null}</div>
                      </div>
                    </div>
                  </div>
                  <div id='mesg2'>

                    <div id='mesg2_1'>{msg.data.imageUrl && <img src={msg.data.imageUrl} alt='Uploaded' />}</div>

                    <div id='mesg2_2'>
                      {msg.data.text.startsWith("http://") || msg.data.text.startsWith("https://") ? (
                        <a href={msg.data.text} target="_blank" rel="noopener noreferrer">
                          {msg.data.text}
                        </a>
                      ) :


                        (
                          <span>{msg.data.text}</span>
                        )}
                    </div>


                  </div>

                </div>
              ))}
            </div>

            <input
              type='file'
              onChange={handleImageChange}
              style={{
                fontSize: '12px',
                color: 'white',
                backgroundColor: 'rgb(44, 47, 53)',
                border: '1px solid rgb(44, 47, 53)',
                padding: '5px 10px',
                borderRadius: '0px',
              }}
            />

            <textarea
              value={newMessage}
              onChange={handleChange}
              placeholder="Hier eingeben..."
              style={{
                minHeight: '40px',
                maxHeight: '200px',
                overflowY: 'auto',
                resize: 'none',
                width: '728px',
                borderColor: '#353b46',
                borderRadius: '0px',
                padding: '10px',
                fontFamily: 'Arial, Helvetica, sans-serif',
                fontSize: '16px',
                color: '#e5e5ea',
                backgroundColor: '#353b46',
              }}
            />

            <button className='btnSend' onClick={sendMessage}>Nachricht senden</button>


          </>) :
          <>
            <div className='header'><img id='pic' src={"https://files.cults3d.com/uploaders/13940850/illustration-file/af3a9ca5-76dd-4f06-b86d-bd7d73495f40/1bcc0f0aefe71b2c8ce66ffe8645d365.png"} />
              <h2>Discom - Login</h2></div>
            <button className='btnLI' onClick={handleGoogleLogin}>Einloggen mit Google</button>
          </>
        }
      </div>
    </>
  )


}

export default App
