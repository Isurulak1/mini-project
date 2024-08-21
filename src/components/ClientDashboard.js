import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoc, doc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions, Popover, Badge } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import NotificationsIcon from '@mui/icons-material/Notifications';

function ClientDashboard() {
  const { currentUser } = useAuth();
  const usernameRef = useRef();
  const [profilePicture, setProfilePicture] = useState('');
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [allPhotographers, setAllPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState(null);
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
  
  const [open, setOpen] = useState(false);


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
      Swal.fire('Error', error.message, 'error');
    }

    setLoading(false);
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
      setSelectedPhotographer(isAlreadyContacted);
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
          bookingId: bookingId, // Include the bookingId here
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
          const clientNotificationRef = doc(db, `users/${currentUser.uid}/notifications/${new Date().getTime()}`);
          await setDoc(clientNotificationRef, {
            type: 'booking',
            message: `Booking request sent to ${photographer.username}`,
            status: 'pending',
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId // Include the bookingId in the notification
          });
  
          // Add a notification for the photographer
          const photographerNotificationRef = doc(db, `users/${photographer.uid}/notifications/${new Date().getTime()}`);
          await setDoc(photographerNotificationRef, {
            type: 'booking',
            message: `New booking request from ${username}`, // Now includes the fetched username
            status: 'pending',
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId // Include the bookingId in the notification
          });
  
          Swal.fire('Success', 'Booking request sent!', 'success');
          setSelectedPhotographer({ ...photographer, status: 'pending' });
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
  
  



  
  const handleBack = () => {
    setSelectedPhotographer(null);
  };
  
  const handleContactClick = (photographer) => {
    const existingContact = contactedPhotographers.find(contact => contact.username === photographer.username);
    if (existingContact) {
      setSelectedPhotographer(existingContact);
    } else {
      setSelectedPhotographer(photographer);
    }
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
          contactedPhotographers: updatedContacts
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
  
      const bookingStatuses = await Promise.all(querySnapshot.docs.map(async doc => {
        const booking = doc.data();
        const photographerUsername = await fetchPhotographerUsername(booking.photographerId);
  
        let message = '';
  
        if (booking.status === 'accepted') {
          message = `Booking accepted by ${photographerUsername}`;
        } else if (booking.status === 'pending') {
          message = `Booking request pending with ${photographerUsername}`;
        }
  
        return {
          id: doc.id,
          message: message,
          timestamp: booking.timestamp,
          viewed: false // Add this field
        };
      }));
  
      setNotifications(bookingStatuses);
    } catch (error) {
      console.error('Error fetching booking statuses:', error);
    }
  };
  
  
  

  useEffect(() => {
    fetchBookingStatuses();
  }, [currentUser]);
  

  return (
    <>
      <Container component="main" maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <IconButton color="inherit" onClick={handleClick}>
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
          <Typography variant="h6">Notifications</Typography>
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
        <Grid container spacing={4} sx={{ mt: 4 }}>
          <Grid item xs={12} md={3}>
            <Card sx={{ p: 2, boxShadow: 3 }}>
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
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={loading}
                    sx={{ mt: 3, mb: 2, p: '12px 12px' }}
                  >
                    Update Profile
                  </Button>
                </Box>
                <Box sx={{ mt: 4, textAlign: 'center' }}>
                  <Avatar src={profilePicture} alt="Profile Picture" sx={{ width: 100, height: 100, margin: '0 auto' }} />
                  <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="upload-file" />
                  <label htmlFor="upload-file">
                    <Button variant="contained" color="primary" component="span" sx={{ mt: 2 }}>
                      Choose Profile Picture
                    </Button>
                  </label>
                  <Button
                    variant="contained"
                    color="primary"
                    onClick={handleUpload}
                    disabled={loading || !file}
                    sx={{ mt: 2, p: '12px 12px' }}
                  >
                    Upload Profile Picture
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
            {!selectedPhotographer ? (
              <Card sx={{ p: 2, boxShadow: 3 }}>
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
                            <Avatar src={photographer.profilePicture} alt={photographer.username} sx={{ width: 80, height: 80, margin: '0 auto' }} />
                            <Typography variant="h6" component="div" sx={{ textAlign: 'center', mt: 1 }}>
                              {photographer.username}
                            </Typography>
                            <Typography variant="body2" color="textSecondary" sx={{ textAlign: 'center', mt: 1 }}>
                              {photographer.shortDescription}
                            </Typography>
                            <Typography color="text.secondary" sx={{ textAlign: 'center', color: photographer.isAvailable ? 'green' : 'red' }}>
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
            ) : (
              <Card sx={{ p: 2, boxShadow: 3 }}>
    <CardContent>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold' }}>
          Chat with {selectedPhotographer.username}
        </Typography>
        <Button variant="outlined" color="primary" onClick={handleBack}>
          Back
        </Button>
      </Box>
      <Box sx={{ mt: 2 }}>
      
        {/* Chat interface */}
      </Box>
    </CardContent>
    </Card>
            )}
          </Grid>
        </Grid>
      </Container>

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
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
            <Typography variant="body1" color="textPrimary" sx={{ mt: 2 }}>
              {viewPhotographer.detailedDescription}
            </Typography>
            <Box sx={{ mt: 4 }}>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Portfolio
              </Typography>
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
          </>
        )}
      </DialogContent>
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
