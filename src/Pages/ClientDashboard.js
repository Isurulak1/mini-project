import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoc, doc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions, Popover, Badge, Checkbox, CircularProgress } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link as LinkRouter } from 'react-router-dom';
import logo from '../Assets/Logo2.png';
import Footer from '../Components/Footer/Footer';
import * as tf from '@tensorflow/tfjs';


function ClientDashboard() {
  const { currentUser } = useAuth();
  const usernameRef = useRef();
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allPhotographers, setAllPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState();
  const [contactedPhotographers, setContactedPhotographers] = useState([]);
  const [viewPhotographer, setViewPhotographer] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewImage, setViewImage] = useState(''); // State for viewing an image
  const [openImageDialog, setOpenImageDialog] = useState(false); // State for opening the image dialog
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [currentPhotographer, setCurrentPhotographer] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(''); // Pending or Accepted
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sharedImages, setSharedImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState('search'); // 'search' or 'contactDetails'
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState('');
  const tensor = tf.tensor([1, 2, 3, 4]);
  


  useEffect(() => {
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
      const userData = userDoc.data();
      usernameRef.current.value = userData.username;
      setProfilePicture(userData.profilePicture);

      const photographersQuery = query(collection(db, 'users'), where('role', '==', 'photographer'));
      const querySnapshot = await getDocs(photographersQuery);
      const photographers = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id, // Add UID here
      }));
      setAllPhotographers(photographers);

      // Fetch contacted photographers
      const contacts = userData.contacts || [];
      setContactedPhotographers(contacts);
    };

    fetchData();
    
  }, [currentUser]);

  useEffect(() => {
    const fetchContactedPhotographers = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        if (userData && userData.contacts) {
          setContactedPhotographers(userData.contacts);
        }
      } catch (error) {
        console.error('Error fetching contacts:', error);
      }
    };
  
    fetchContactedPhotographers();
  }, [currentUser.uid]);

  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const fileRef = ref(storage, `profilePictures/${currentUser.uid}/${file.name}`);
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        profilePicture: downloadURL
      });

      setProfilePicture(downloadURL);
      Swal.fire('Success', 'Profile picture updated!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to upload profile picture: ${error.message}`, 'error');
    } finally {
      setLoading(false); // Ensure loading state is reset even if an error occurs
    }
  };


  const checkUsernameExists = async (username) => {
    const userCollection = collection(db, 'users');
    const q = query(userCollection, where('username', '==', username));
    const userSnapshot = await getDocs(q);
    return !userSnapshot.empty;
  };


  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newUsername = usernameRef.current.value;
      if (!newUsername) {
        Swal.fire('Error', 'Username cannot be empty', 'error');
        setLoading(false);
        return;
      }

      // Check if the username already exists
      const usernameExists = await checkUsernameExists(newUsername);
      if (usernameExists) {
        Swal.fire('Error', 'Username already taken', 'error');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: newUsername
      });

      Swal.fire('Success', 'Profile updated!', 'success');
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }

    setLoading(false);
  };

  const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);

    try {
      const photographersQuery = query(collection(db, 'users'), where('role', '==', 'photographer'));
      const querySnapshot = await getDocs(photographersQuery);
      const results = querySnapshot.docs
        .map(doc => doc.data())
        .filter(user => user.username.toLowerCase().includes(searchQuery.toLowerCase()));
      
      setSearchResults(results);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }

    setLoading(false);
  };

  const handleCloseSearchResults = () => {
    setSearchResults([]);
  };

  const handleViewDetails = (photographer) => {
    setViewPhotographer(photographer);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
  };

  const handleImageClick = (imageUrl) => {
    setViewImage(imageUrl);
    setOpenImageDialog(true);
  };

  const handleCloseImageDialog = () => {
    setOpenImageDialog(false);
  };


  
  
  const handleContact = async (photographer) => {
    if (!photographer.uid) {
      console.error('Photographer UID is missing');
      return;
    }
  
    const isAlreadyContacted = contactedPhotographers.find(contact => contact.username === photographer.username);
  
    if (isAlreadyContacted) {
      // Set the contact view and photographer directly if already contacted
      setSelectedContact(isAlreadyContacted);
      setViewMode('contactDetails');
      return;
    }
  
    Swal.fire({
      title: 'Are you sure?',
      text: `Do you want to contact ${photographer.username}?`,
      icon: 'warning',
      showCancelButton: true,
      confirmButtonColor: '#3085d6',
      cancelButtonColor: '#d33',
      confirmButtonText: 'Yes, contact them!',
      cancelButtonText: 'No, cancel'
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedContacts = [...contactedPhotographers, { ...photographer, status: 'pending' }];
        setContactedPhotographers(updatedContacts);
  
        // Generate a unique bookingId
        const bookingId = `${currentUser.uid}_${photographer.uid}_${new Date().getTime()}`;
  
        const bookingRequest = {
          bookingId: bookingId,
          status: 'pending',
          photographerId: photographer.uid,
          clientId: currentUser.uid,
          timestamp: new Date(),
          date: '', // Add booking date
          time: '', // Add booking time
          notes: '' // Add any additional notes
        };
  
        try {
          // Fetch current user details from Firestore if not available directly
          let username = currentUser.username;
          if (!username) {
            const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
            username = userDoc.exists() ? userDoc.data().username : 'a client';
          }
  
          // Update the contacts array in the main user document
          await updateDoc(doc(db, 'users', currentUser.uid), {
            contacts: updatedContacts
          });
  
          // Create a booking document in the client's subcollection
          const clientBookingRef = doc(db, `users/${currentUser.uid}/bookings/${bookingId}`);
          await setDoc(clientBookingRef, bookingRequest);
  
          // Create a booking document in the photographer's subcollection
          const photographerBookingRef = doc(db, `users/${photographer.uid}/bookings/${bookingId}`);
          await setDoc(photographerBookingRef, bookingRequest);
  
          // Add a notification for the client
          const clientNotificationRef = doc(db, `users/${currentUser.uid}/notifications/${bookingId}`);
          await setDoc(clientNotificationRef, {
            type: 'booking',
            message: `Booking request pending with ${photographer.username}`,
            status: 'pending',
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId
          });
  
          // Add a notification for the photographer
          const photographerNotificationRef = doc(db, `users/${photographer.uid}/notifications/${bookingId}`);
          await setDoc(photographerNotificationRef, {
            type: 'booking',
            message: `New booking request from ${username}`,
            status: 'pending',
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId
          });
  
          Swal.fire('Success', 'Booking request sent!', 'success');
          setSelectedContact({ ...photographer, status: 'pending' });
          setViewMode('contactDetails');
  
          // Listen for booking status updates in real-time
          const unsubscribe = onSnapshot(photographerBookingRef, async (docSnapshot) => {
            if (docSnapshot.exists()) {
              const updatedBooking = docSnapshot.data();
              if (updatedBooking.status === 'accepted') {
                // Update the client's notification when the status is "accepted"
                const clientNotificationUpdateRef = doc(db, `users/${currentUser.uid}/notifications/${bookingId}`);
                await updateDoc(clientNotificationUpdateRef, {
                  message: `Booking accepted by ${photographer.username}`,
                  status: 'accepted',
                  timestamp: new Date()
                });
  
                // Optionally: Refresh notifications in state for real-time updates
                fetchNotifications();
              }
            }
          });
  
          // Cleanup listener when done
          return () => unsubscribe();
        } catch (error) {
          Swal.fire('Error', error.message, 'error');
        }
      }
    });
  };
  
  
  
  
  
  

  
  
  
  
  useEffect(() => {
    const fetchData = async () => {
      const photographersQuery = query(collection(db, 'users'), where('role', '==', 'photographer'));
      const querySnapshot = await getDocs(photographersQuery);
      const photographers = querySnapshot.docs.map(doc => ({
        ...doc.data(),
        uid: doc.id, // Ensure uid is included
      }));
      setAllPhotographers(photographers);
    };
  
    fetchData();
  }, []);
  
  



  
  const handleContactClick = (photographer) => {
    setSelectedContact(photographer);
    setViewMode('contactDetails');
  };
  
  const handleBack = () => {
    setSelectedContact(null);
    setViewMode('search');
  };
  

  const handleDeleteContact = async (photographer) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete ${photographer.username} from your contacts?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel'
      });
  
      if (result.isConfirmed) {
        // Update local state
        const updatedContacts = contactedPhotographers.filter(contact => contact.username !== photographer.username);
        setContactedPhotographers(updatedContacts);
  
        // Save updated contacts to Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          contacts: updatedContacts
        });
  
        Swal.fire('Deleted!', `${photographer.username} has been removed from your contacts.`, 'success');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      Swal.fire('Error', `Failed to delete contact: ${error.message}`, 'error');
    }
  };




  const handleDelete = async (notificationId) => {
    try {
      await deleteDoc(doc(db, `users/${currentUser.uid}/notifications`, notificationId));
      setNotifications(prevNotifications =>
        prevNotifications.filter(notification => notification.id !== notificationId)
      );
    } catch (error) {
      console.error('Error deleting notification:', error);
    }
  };



  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
    setOpen(true);
    markNotificationsAsViewed(); // Mark notifications as viewed
  };
  
  const handleClose = () => {
    setOpen(false);
  };


  const markNotificationsAsViewed = async () => {
    try {
      const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
      const notificationsQuery = query(notificationsRef, where('viewed', '==', false));
      const querySnapshot = await getDocs(notificationsQuery);

      const updates = querySnapshot.docs.map(doc => {
        return updateDoc(doc.ref, { viewed: true });
      });

      await Promise.all(updates);
      setNotifications(prevNotifications =>
        prevNotifications.map(notification => ({ ...notification, viewed: true }))
      );
    } catch (error) {
      console.error('Error marking notifications as viewed:', error);
    }
  };











  
  const fetchBookingStatuses = async () => {
    try {
      const bookingsRef = collection(db, `users/${currentUser.uid}/bookings`);
      const bookingsQuery = query(bookingsRef);
      const querySnapshot = await getDocs(bookingsQuery);
  
      // Helper function to fetch photographer username
      const fetchPhotographerUsername = async (photographerId) => {
        try {
          const photographerRef = doc(db, `users/${photographerId}`);
          const photographerDoc = await getDoc(photographerRef);
  
          if (photographerDoc.exists()) {
            return photographerDoc.data().username;
          } else {
            console.error('No such photographer found!');
            return 'Unknown Photographer';
          }
        } catch (error) {
          console.error('Error fetching photographer username:', error);
          return 'Unknown Photographer';
        }
      };
  
      const bookingStatuses = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const booking = doc.data();
          const photographerUsername = await fetchPhotographerUsername(booking.photographerId);
  
          let message = '';
  
          if (booking.status === 'accepted') {
            message = `Booking accepted by ${photographerUsername}`;
          } else if (booking.status === 'pending') {
            message = `Booking request pending with ${photographerUsername}`;
          }
  
          const notification = {
            id: doc.id,
            message: message,
            timestamp: booking.timestamp,
            viewed: false, // Add this field
          };
  
          // Save the notification to Firestore under `notifications` collection
          const notificationsRef = doc(db, `users/${currentUser.uid}/notifications/${doc.id}`);
          await setDoc(notificationsRef, notification);
  
          return notification;
        })
      );
  
      // Set notifications to state
      setNotifications(bookingStatuses);
    } catch (error) {
      console.error('Error fetching booking statuses:', error);
    }
  };
  
  useEffect(() => {
    fetchBookingStatuses();
  }, [currentUser]);
  








  useEffect(() => {
    const fetchSharedImages = async () => {
      try {
        // Check if selectedPhotographer and currentUser are defined
        if (!selectedPhotographer || !selectedPhotographer.photographerId || !currentUser || !currentUser.uid) {
          console.log('Required data is missing');
          return;
        }

        // Reference to the shared document in Firestore
        const clientSharingRef = doc(db, `users/${currentUser.uid}/sharing/${selectedPhotographer.photographerId}`);
        const docSnap = await getDoc(clientSharingRef);

        if (docSnap.exists()) {
          // Extract the images from the document data
          const sharedData = docSnap.data();
          if (sharedData.images) {
            setSharedImages(sharedData.images); // Set the images in state
          }
        } else {
          console.log('No shared images found.');
        }
      } catch (error) {
        console.error('Error fetching shared images:', error);
      }
    };

    fetchSharedImages();
  }, [selectedPhotographer, currentUser]);








  const fetchNotifications = async () => {
    const notificationsRef = collection(db, `users/${currentUser.uid}/notifications`);
    const notificationsQuery = query(notificationsRef);
  
    onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data()
      }));
  
      setNotifications(notifications);
    });
  };
  
  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);





  useEffect(() => {
    if (!selectedContact || !currentUser) return;
  
    const fetchSharedImages = async () => {
      try {
        // Reference the specific sharing document
        const sharingDocRef = doc(db, `users/${currentUser.uid}/sharing/${selectedContact.uid}`);
        const docSnapshot = await getDoc(sharingDocRef);
  
        if (docSnapshot.exists()) {
          const imagesData = docSnapshot.data().images;
  
          if (imagesData) {
            // Extract image URLs and filter out duplicates using a Set
            const imageUrls = Array.from(new Set(
              Object.values(imagesData).map((image) => image.url)
            ));
  
            setSharedImages(imageUrls);
          }
        }
      } catch (error) {
        console.error("Error fetching shared images: ", error);
      }
    };
  
    fetchSharedImages();
  }, [selectedContact, currentUser]);



  const handleImageSelect = (url) => {
    setSelectedImages((prevSelected) =>
      prevSelected.includes(url)
        ? prevSelected.filter((image) => image !== url) // Unselect if already selected
        : [...prevSelected, url] // Add to selected images
    );
  };

  const handleSendImagesToPhotographer = async () => {
    if (selectedImages.length === 0) {
      Swal.fire('Warning', 'No images selected.', 'warning');
      return;
    }

    setLoading(true); // Start loading state

    try {
      const photographerId = selectedContact.uid; // Photographer's ID
      const clientId = currentUser.uid; // Client's ID
      const timestamp = new Date().toISOString();

      // Reference the documents for both the photographer and client
      const photographerReceivedImagesRef = doc(db, `users/${photographerId}/receivedImages/${clientId}`);
      const clientReceivedImagesRef = doc(db, `users/${clientId}/receivedImages/${photographerId}`);

      // Fetch the current images for the photographer
      const photographerDocSnapshot = await getDoc(photographerReceivedImagesRef);
      const photographerImagesData = photographerDocSnapshot.exists()
        ? photographerDocSnapshot.data().images || {}
        : {};

      // Fetch the current images for the client
      const clientDocSnapshot = await getDoc(clientReceivedImagesRef);
      const clientImagesData = clientDocSnapshot.exists()
        ? clientDocSnapshot.data().images || {}
        : {};

      // Convert existing images to a Set for easy duplicate checking
      const existingPhotographerUrls = new Set(Object.values(photographerImagesData).map((img) => img.url));
      const existingClientUrls = new Set(Object.values(clientImagesData).map((img) => img.url));

      selectedImages.forEach((url) => {
        if (!existingPhotographerUrls.has(url) && !existingClientUrls.has(url)) {
          const imageName = url.split('/').pop(); // Extract file name from URL
          const imageData = {
            fileName: imageName,
            url: url,
            timestamp: timestamp,
          };

          // Add the image to both photographer and client documents
          photographerImagesData[Object.keys(photographerImagesData).length] = imageData;
          clientImagesData[Object.keys(clientImagesData).length] = imageData;

          // Update the existing URL sets to avoid future duplicates
          existingPhotographerUrls.add(url);
          existingClientUrls.add(url);
        }
      });

      // Save the updated images to Firestore
      await Promise.all([
        setDoc(photographerReceivedImagesRef, { images: photographerImagesData }, { merge: true }),
        setDoc(clientReceivedImagesRef, { images: clientImagesData }, { merge: true }),
      ]);

      Swal.fire('Success', 'Selected images have been sent!', 'success');
      setSelectedImages([]); // Clear the selection after sending
    } catch (error) {
      console.error('Error sending images:', error);
      Swal.fire('Error', `Failed to send images: ${error.message}`, 'error');
    } finally {
      setLoading(false); // Ensure loading state is reset even if an error occurs
    }
  };
  

  let model;

  const loadModel = async () => {
    try {
      
    model = await tf.loadLayersModel('/model_tfjs/model.json');
    console.log('Model loaded successfully');
  } catch (error) {
    console.error('Error loading model:', error);
    Swal.fire('Error', `Failed to load model: ${error.message}`, 'error');
  }
  };

  useEffect(() => {
     loadModel();
   }, []);

  const [imageUrls, setImageUrls] = useState([]);
  const fetchImageUrls = async () => {
  const urls = [/* ...image URLs... */];
  setImageUrls(urls);
  };

  useEffect(() => {
    fetchImageUrls();
  }, []);

  
  const handleAutoSelectImages = async () => {
    if (!model) {
      Swal.fire('Error', 'Model not loaded yet.', 'error');
      return;
    }
  
    try {
      // Assuming you have an array of image URLs or image data called `imageUrls`
      const predictions = await Promise.all(
        imageUrls.map(async (url) => {
          const image = new Image();
          image.src = url;
          await new Promise((resolve) => (image.onload = resolve));
  
          // Preprocess the image as needed (resize, normalize, etc.)
          const tensor = tf.browser.fromPixels(image)
            .resizeNearestNeighbor([224, 224]) // Example resize
            .toFloat()
            .expandDims();
  
          const prediction = model.predict(tensor);
          const predictionResult = prediction.dataSync()[0]; // Example to get the first prediction result
  
          return { url, prediction: predictionResult };
        })
      );
  
      // Filter and auto-select images based on predictions
      const selected = predictions.filter(p => p.prediction > 0.5).map(p => p.url); // Example threshold
  
      setSelectedImages(selected);
      Swal.fire('Success', 'Images auto-selected !', 'success');
    } catch (error) {
      console.error('Error auto-selecting images:', error);
      Swal.fire('Error', `Failed to auto-select images: ${error.message}`, 'error');
    }
  };
  
  
  
  
  
  
  
  
  

  return (
    <>

      <div className='nav-section'>
        <nav className='navbar-dash'>
          <div className='logo-head'>
            <img src={logo} alt="" className='logo'/>
            <div className='logo-text'>
              <h2>ShutterShare</h2>
              <p>Future Photography</p>
            </div>
          </div>
          <ul style={{ display: 'flex', alignItems: 'center', listStyleType: 'none', padding: 0 }}>

            <li>
            <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <IconButton color="primary" onClick={handleClick}>
          <Badge badgeContent={notifications.filter(notification => !notification.viewed).length} color="error">
            <NotificationsIcon />
          </Badge>
        </IconButton>
      </Box>

      <Popover
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: '500px', maxHeight: 200, overflowY: 'auto' }}>
          <List>
            {notifications.length === 0 ? (
              <Typography>No notifications</Typography>
            ) : (
              notifications.map((notification) => (
                <ListItem key={notification.id} sx={{ display: 'flex', alignItems: 'center' }}>
                  <ListItemText 
                    primary={`${notification.message}`} 
                    secondary={notification.timestamp ? new Date(notification.timestamp.seconds * 1000).toLocaleString() : ''}
                  />
                  <IconButton 
                    color="error" 
                    onClick={() => handleDelete(notification.id)}
                  >
                    <DeleteIcon /> {/* Remove icon */}
                  </IconButton>
                </ListItem>
              ))
            )}
          </List>
        </Box>
      </Popover>
            </li>
            <li>
              <LinkRouter to="/login" style={{ textDecoration: 'none' }}>
                <Button variant="outlined" color="primary" sx={{ p: 1, width: '100px', border: 'solid', borderWidth: 2, '&:hover': { borderWidth: 2 } }}>
                  Logout
                </Button>
              </LinkRouter>
            </li>
            <li>
              <Avatar src={profilePicture} alt="Profile Picture" sx={{ width: 50, height: 50, margin: '0 auto' }} />
            </li>
          </ul>
        </nav>
      </div>



      <Container component="main" maxWidth="xl">
      
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, boxShadow: 3, mb: 4 }}>
              <CardContent>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Profile Details
                </Typography>
                <Box component="form" onSubmit={handleUpdate} noValidate>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    label="Username"
                    name="username"
                    autoComplete="username"
                    inputRef={usernameRef}
                    InputLabelProps={{shrink: true,}}
                  />
                  <Button
      type="submit"
      fullWidth
      variant="contained"
      color="primary"
      disabled={loading} // Disable button during loading
      sx={{ mt: 3, mb: 2, p: '12px 12px', position: 'relative' }} // Preserve button padding and size
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />
          Updating
        </Box>
      ) : (
        'Update Profile'
      )}
    </Button>
                </Box>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Avatar src={profilePicture} alt="Profile Picture" sx={{ width: 100, height: 100, margin: '0 auto' }} />
                  <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="upload-file" />
                  <label htmlFor="upload-file">
                    <Button variant="outlined" color="primary" component="span" fullWidth sx={{ mt: 2, p: '12px 12px' }}>
                      Choose Profile Picture
                    </Button>
                  </label>
                  <Button
      variant="contained"
      color="primary"
      fullWidth
      onClick={handleUpload}
      disabled={loading || !file} // Disable button if loading or no file is selected
      sx={{ mt: 2, p: '12px 12px', position: 'relative' }} // Preserve button padding and size
    >
      {loading ? (
        <Box sx={{ display: 'flex', alignItems: 'center' }}>
          <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />
          Uploading
        </Box>
      ) : (
        'Upload Profile Picture'
      )}
    </Button>
                </Box>
                {/* Messages Section */}
                <Box sx={{ mt: 4 }}>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Messages
                  </Typography>
                  <List>
                    {contactedPhotographers.map((photographer, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteContact(photographer)}>
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton onClick={() => handleContactClick(photographer)}>
                          <ListItemAvatar>
                            <Avatar src={photographer.profilePicture} alt={photographer.username} />
                          </ListItemAvatar>
                          <ListItemText primary={photographer.username} />
                        </ListItemButton>
                      </ListItem>
                    ))}
                  </List>
                </Box>
              </CardContent>
            </Card>
          </Grid>
          <Grid item xs={12} md={9}>
  {viewMode === 'search' && (
    <Card sx={{ p: 2, boxShadow: 3, mb: 4 }}>
      <CardContent>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
          Search Photographers
        </Typography>
        <Box sx={{ mb: 2, display: 'flex', alignItems: 'center' }}>
          <TextField
            fullWidth
            id="search"
            label="Search by Username"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
          <Button
            variant="contained"
            color="primary"
            onClick={handleSearch}
            disabled={loading}
            sx={{ ml: 2, p: '12px 12px' }}
          >
            Search
          </Button>
          {searchResults.length > 0 && (
            <IconButton color="secondary" onClick={handleCloseSearchResults}>
              <CloseIcon />
            </IconButton>
          )}
        </Box>
        <Grid container spacing={2}>
          {(searchResults.length > 0 ? searchResults : allPhotographers).map((photographer, index) => (
            <Grid item xs={12} sm={6} md={4} key={index}>
              <Card sx={{ boxShadow: 3 }}>
                <CardContent>
                  <Avatar
                    src={photographer.profilePicture}
                    alt={photographer.username}
                    sx={{ width: 80, height: 80, margin: '0 auto' }}
                  />
                  <Typography variant="h6" component="div" sx={{ textAlign: 'center', mt: 1 }}>
                    {photographer.username}
                  </Typography>
                  <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
                    {photographer.shortDescription}
                  </Typography>
                  <Typography
                    color="text.secondary"
                    sx={{ textAlign: 'center', color: photographer.isAvailable ? 'green' : 'red' }}
                  >
                    {photographer.isAvailable ? 'Available' : 'Not Available'}
                  </Typography>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    sx={{ mt: 2, p: '12px 12px' }}
                    onClick={() => handleContact(photographer)}
                  >
                    Contact
                  </Button>
                  <Button
                    variant="outlined"
                    color="primary"
                    fullWidth
                    sx={{ mt: 1, p: '12px 12px' }}
                    onClick={() => handleViewDetails(photographer)}
                  >
                    View Details
                  </Button>
                </CardContent>
              </Card>
            </Grid>
          ))}
        </Grid>
      </CardContent>
    </Card>
  )}

{viewMode === 'contactDetails' && selectedContact && (
        <Card sx={{ p: 2, boxShadow: 3 }}>
          <CardContent>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold' }}>
                Chat with {selectedContact.username}
              </Typography>
              <Button variant="outlined" color="primary" onClick={handleBack}>
                Back
              </Button>
            </Box>
            <Box sx={{ mt: 2 }}>
            <Button
              variant="contained"
              color="primary"
              onClick={handleSendImagesToPhotographer}
              disabled={loading || selectedImages.length === 0} // Disable button during loading or if no images are selected
              sx={{ mt: 2, p: '8px 16px', position: 'relative', width: '250px' }} // Preserve button padding and size
            >
              {loading ? (
                <Box sx={{ display: 'flex', alignItems: 'center' }}>
                  <CircularProgress size={24} sx={{ color: 'inherit', mr: 1 }} />
                  Sending...
                </Box>
              ) : (
                'Send Selected Images'
              )}
            </Button>
            <Button
               variant="contained"
               color="secondary"
               onClick={handleAutoSelectImages}
               sx={{ mt: 2, p: '8px 16px', position: 'relative', width: '250px' }}
            >
             Auto Select Images
            </Button>

              <Grid container spacing={2}>
                {sharedImages.map((image, index) => (
                  <Grid item xs={12} sm={6} md={4} key={index}>
                    <img
                      src={image.url}
                      alt={image.fileName}
                      style={{ width: '100%', height: 'auto', borderRadius: '8px' }}
                    />
                  </Grid>
                ))}
              </Grid>
              <Box
                sx={{
                  maxHeight: '300px',
                  overflowY: 'auto',
                  border: '1px solid #ccc',
                  p: 2,
                  borderRadius: 2,
                }}
              >
                <Grid container spacing={2}>
                  {sharedImages.length > 0 ? (
                    sharedImages.map((url, index) => (
                      <Grid item xs={12} sm={6} md={3} key={index} sx={{ position: 'relative' }}>
                        <Box
                          sx={{
                            width: '100%',
                            height: 0,
                            paddingTop: '100%',
                            position: 'relative',
                            overflow: 'hidden',
                            borderRadius: 1,
                          }}
                        >
                          <img
                            src={url}
                            alt={`Shared Image ${index}`}
                            style={{
                              position: 'absolute',
                              top: 0,
                              left: 0,
                              width: '100%',
                              height: '100%',
                              objectFit: 'cover',
                              borderRadius: '5px',
                              cursor: 'pointer',
                            }}
                            onClick={() => handleImageClick(url)}
                          />
                          <Checkbox
                            checked={selectedImages.includes(url)}
                            onChange={() => handleImageSelect(url)}
                            sx={{
                              position: 'absolute',
                              top: 8,
                              right: 8,
                              borderRadius: '50%',
                              padding: '4px',
                              zIndex: 1,
                            }}
                          />
                        </Box>
                      </Grid>
                    ))
                  ) : (
                    <Grid item xs={12}>
                      <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'left', ml: 1 }}>
                        No images shared yet.
                      </Typography>
                    </Grid>
                  )}
                </Grid>
              </Box>
            </Box>
          </CardContent>
        </Card>
      )}

      
</Grid>
</Grid>

      </Container>
      <Footer/>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth 
      PaperProps={{
        sx: {
          borderRadius: '8px', // Set the border radius here
        },
      }}>
      <DialogTitle>
        Photographer Details
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleCloseDialog}
          aria-label="close"
          sx={{ position: 'absolute', right: 8, top: 8, mr: 1 }}
        >
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent>
        {viewPhotographer && (
          <>
            <Avatar
              src={viewPhotographer.profilePicture}
              alt={viewPhotographer.username}
              sx={{ width: 100, height: 100, margin: '0 auto' }}
            />
            <Typography variant="h6" component="div" sx={{ textAlign: 'center', mt: 1 }}>
              {viewPhotographer.username}
            </Typography>
            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
              {viewPhotographer.shortDescription}
            </Typography>
            <Typography variant="body1" color="textSecondary" align="center" sx={{ mt: 2 }}>
              {viewPhotographer?.price ? `Price: $${viewPhotographer?.price}` : 'Price not available'}
            </Typography>

            {/* Detailed Description Section with Border */}
            <Box sx={{ border: '1px solid #ccc', borderRadius: '8px', padding: 2, mt: 3 }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Description
              </Typography>
              <Typography variant="body1" color="textPrimary" sx={{ mt: 2 }}>
                {viewPhotographer.detailedDescription}
              </Typography>
            </Box>

            {/* Portfolio Section with Border and Scroll */}
            <Box sx={{ border: '1px solid #ccc', borderRadius: '8px', padding: 2, mt: 4 }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Portfolio
              </Typography>
              <Box sx={{ maxHeight: 400, overflowY: 'auto' }}> {/* Set the maximum height and enable scrolling */}
                <Grid container spacing={2}>
                  {viewPhotographer.portfolioImages && viewPhotographer.portfolioImages.length > 0 ? (
                    viewPhotographer.portfolioImages.slice(1).map((image, index) => (
                      <Grid item xs={6} sm={3} key={index}>
                        <Box
                          component="img"
                          src={image}
                          alt={`Portfolio Image ${index}`}
                          sx={{
                            width: '100%',
                            height: '200px',
                            objectFit: 'cover',
                            cursor: 'pointer',
                            borderRadius: '5px'
                          }}
                          onClick={() => handleImageClick(image)}
                        />
                      </Grid>
                    ))
                  ) : (
                    <Typography>No portfolio images available</Typography>
                  )}
                </Grid>
              </Box>
            </Box>
          </>
        )}
      </DialogContent>
      <Box sx={{ padding: '5px', width: '100%', backgroundColor: '#1976D2' }} />
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog open={openImageDialog} onClose={handleCloseImageDialog} maxWidth="md" fullWidth>
        <DialogTitle>View Image
        <IconButton
          edge="end"
          color="inherit"
          onClick={handleCloseImageDialog}
          aria-label="close"
          sx={{ position: 'absolute', right: 8, top: 8, mr: 1 }}
        >
          <CloseIcon />
        </IconButton>
        </DialogTitle>
        <DialogContent>
          {viewImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={viewImage} alt="Portfolio" style={{ width: '100%', height: 'auto' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          
        </DialogActions>
      </Dialog>
      
    </>
  );
}

export default ClientDashboard;
