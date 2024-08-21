// src/components/PhotographerDashboard.js
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, query, orderBy, deleteDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Switch, FormControlLabel, List, ListItem, ListItemButton, ListItemAvatar,ListItemText, Badge, Popover } from '@mui/material';
import Swal from 'sweetalert2';
import { Delete as DeleteIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';

function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const usernameRef = useRef();
  const shortDescriptionRef = useRef();
  const detailedDescriptionRef = useRef();
  const priceRef = useRef(); // New ref for price details
  const [profilePicture, setProfilePicture] = useState('');
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewImage, setViewImage] = useState('');
  const [contactedClients, setContactedClients] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notifications, setNotifications] = useState([]); // New state for notifications
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState('default');

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, 'users', currentUser.uid));
        const userData = userDoc.data();
        usernameRef.current.value = userData.username;
        shortDescriptionRef.current.value = userData.shortDescription || '';
        detailedDescriptionRef.current.value = userData.detailedDescription || '';
        priceRef.current.value = userData.price || ''; // Set price details
        setProfilePicture(userData.profilePicture);
        setPortfolioImages(userData.portfolioImages || []);
        
        setIsAvailable(userData.isAvailable || false);
      } catch (error) {
        Swal.fire('Error', 'Failed to load user data', 'error');
      }
    };

    fetchData();
  }, [currentUser]);

//--------------------##############################
useEffect(() => {
  const fetchNotifications = async () => {
    try {
      const notificationsQuery = query(
        collection(db, `users/${currentUser.uid}/notifications`),
        orderBy('timestamp', 'desc')
      );
      const querySnapshot = await getDocs(notificationsQuery);
      const notificationsList = querySnapshot.docs.map(doc => ({
        id: doc.id,
        ...doc.data(),
      }));
      console.log("Fetched Notifications:", notificationsList); // Debugging statement
      setNotifications(notificationsList);
    } catch (error) {
      console.error('Error fetching notifications:', error);
    }
  };

  fetchNotifications();
}, [currentUser.uid]);



//--------------------##############################

  const handleFileChange = (e) => {
    setFiles(Array.from(e.target.files));
  };

  const handleUpload = async () => {
    if (files.length === 0) {
      Swal.fire('Warning', 'No files selected', 'warning');
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `profilePictures/${currentUser.uid}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const downloadURLs = await Promise.all(uploadPromises);

      await updateDoc(doc(db, 'users', currentUser.uid), {
        profilePicture: downloadURLs[0]
      });

      setProfilePicture(downloadURLs[0]);
      Swal.fire('Success', 'Profile picture updated!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to upload profile picture: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const handleImageUpload = async () => {
    if (files.length === 0) {
      Swal.fire('Warning', 'No images selected', 'warning');
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(storage, `portfolio/${currentUser.uid}/${file.name}`);
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const downloadURLs = await Promise.all(uploadPromises);

      setPortfolioImages((prev) => [...prev, ...downloadURLs]);
      await updateDoc(doc(db, 'users', currentUser.uid), {
        portfolioImages: arrayUnion(...downloadURLs)
      });

      Swal.fire('Success', 'Images added to portfolio!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to upload images: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const handleRemoveImage = async (imageURL) => {
    setLoading(true);
    try {
      // Delete the image from storage
      const fileRef = ref(storage, imageURL);
      await deleteObject(fileRef);

      // Remove the image from the portfolio
      setPortfolioImages((prev) => prev.filter((img) => img !== imageURL));
      await updateDoc(doc(db, 'users', currentUser.uid), {
        portfolioImages: arrayRemove(imageURL)
      });

      Swal.fire('Success', 'Image removed from portfolio!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to remove image: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const handleOpenDialog = (imageURL) => {
    setViewImage(imageURL);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewImage('');
  };

  const checkUsernameExists = async (username) => {
    const usersQuerySnapshot = await getDocs(collection(db, 'users'));
    const usernames = usersQuerySnapshot.docs.map(doc => doc.data().username);
    return usernames.includes(username);
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

      // Check if the new username already exists
      if (await checkUsernameExists(newUsername)) {
        Swal.fire('Error', 'Username already exists', 'error');
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: newUsername,
      });

      Swal.fire('Success', 'Profile updated!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to update profile: ${error.message}`, 'error');
    }

    setLoading(false);
  };


  const handleUpdatedescription = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {  

      await updateDoc(doc(db, 'users', currentUser.uid), {
        shortDescription: shortDescriptionRef.current.value,
        detailedDescription: detailedDescriptionRef.current.value,
        price: priceRef.current.value, // Update price details
      });

      Swal.fire('Success', 'Profile updated!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to update profile: ${error.message}`, 'error');
    }

    setLoading(false);

  }


  const handleAvailabilityChange = async (event) => {
    const newAvailability = event.target.checked;
    setIsAvailable(newAvailability);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        isAvailable: newAvailability
      });
    } catch (error) {
      Swal.fire('Error', `Failed to update availability: ${error.message}`, 'error');
    }
  };




  const handleDeleteContact = async (client) => {
    try {
      // Confirm the deletion
      const result = await Swal.fire({
        title: 'Are you sure?',
        text: `Do you want to delete ${client.username} from your contacts?`,
        icon: 'warning',
        showCancelButton: true,
        confirmButtonColor: '#3085d6',
        cancelButtonColor: '#d33',
        confirmButtonText: 'Yes, delete it!',
        cancelButtonText: 'No, cancel'
      });
  
      if (result.isConfirmed) {
        // Update local state
        const updatedContacts = contactedClients.filter(contact => contact.clientId !== client.clientId);
        setContactedClients(updatedContacts);
  
        // Update Firestore
        await updateDoc(doc(db, 'users', currentUser.uid), {
          contactedClients: updatedContacts
        });
  
        Swal.fire('Deleted!', `${client.username} has been removed from your contacts.`, 'success');
      }
    } catch (error) {
      console.error('Failed to delete contact:', error);
      Swal.fire('Error', `Failed to delete contact: ${error.message}`, 'error');
    }
  };
  
  
  const handleContactClick = (client) => {
    setSelectedContact(client);
    setViewMode('contactDetails'); // Switch to contact details view
  };


  const handleAcceptBooking = async (notificationId, bookingId) => {
    try {
      console.log('Notification ID:', notificationId);
  
      // Fetch the notification document
      const notificationRef = doc(db, `users/${currentUser.uid}/notifications/${notificationId}`);
      const notificationDoc = await getDoc(notificationRef);
  
      if (!notificationDoc.exists()) {
        throw new Error('Notification not found.');
      }
  
      const notification = notificationDoc.data();
      console.log('Notification Data:', notification);
  
      const { userId } = notification; // Assuming the userId is the client's ID
      if (!userId) {
        throw new Error('User ID not found in notification.');
      }
  
      // Update booking status in the photographer's bookings collection
      const photographerBookingRef = doc(db, `users/${currentUser.uid}/bookings/${bookingId}`);
      await updateDoc(photographerBookingRef, { status: 'accepted' });
  
      // Update booking status in the client's bookings collection
      const clientBookingRef = doc(db, `users/${userId}/bookings/${bookingId}`);
      await updateDoc(clientBookingRef, { status: 'accepted' });
  
      // Fetch client data
      const clientRef = doc(db, 'users', userId);
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error('Client data not found.');
      }
  
      const clientData = clientDoc.data();
  
      // Fetch photographer data
      const photographerRef = doc(db, 'users', currentUser.uid);
      const photographerDoc = await getDoc(photographerRef);
      const photographerData = photographerDoc.data();
  
      // Update photographer's contacted clients list
      const updatedClients = [...(photographerData.contactedClients || []), {
        username: clientData.username,
        profilePicture: clientData.profilePicture,
        clientId: userId,
      }];
  
      await updateDoc(photographerRef, { contactedClients: updatedClients });
  
      // Delete the notification after processing
      await deleteDoc(notificationRef);
  
      // Update state
      setContactedClients(updatedClients);
      const updatedNotifications = notifications.filter(notification => notification.id !== notificationId);
      setNotifications(updatedNotifications);
  
      // Success message
      Swal.fire('Success', 'Booking accepted! Client added to your messages.', 'success');
    } catch (error) {
      console.error(error);
      Swal.fire('Error', `Failed to accept booking: ${error.message}`, 'error');
    }
  };
  
  

  const fetchContactedClients = async () => {
    try {
      const photographerRef = doc(db, 'users', currentUser.uid);
      const photographerDoc = await getDoc(photographerRef);
  
      if (!photographerDoc.exists()) {
        throw new Error('Photographer data not found.');
      }
  
      const photographerData = photographerDoc.data();
      setContactedClients(photographerData.contactedClients || []);
    } catch (error) {
      console.error('Failed to fetch contacted clients:', error);
    }
  };
  
  // Call this function when the user logs in or component mounts
  useEffect(() => {
    fetchContactedClients();
  }, [currentUser]);
  
  
  
  
  
  
  

  
  
  




  const handleRemoveNotification = async (notificationId) => {
  setLoading(true);
  try {
    // Remove the notification from Firestore
    await deleteDoc(doc(db, `users/${currentUser.uid}/notifications`, notificationId));

    // Update local state
    setNotifications(prev => prev.filter(notification => notification.id !== notificationId));

    
  } catch (error) {
    Swal.fire('Error', `Failed to remove notification: ${error.message}`, 'error');
    console.error("Error removing notification:", error);
  }
  setLoading(false);
};


  

const handleClick = (event) => {
  setAnchorEl(event.currentTarget);
};

const handleClose = () => {
  setAnchorEl(null);
};



const handleBackClick = () => {
  setSelectedContact(null);
  setViewMode('default'); // Switch back to default view
};


const handleRemoveAllImages = () => {

}

const handleSendImages = () => {
  
}

  return (
    <Container component="main" maxWidth="xl">
      <Box sx={{ display: 'flex', justifyContent: 'flex-end', p: 2 }}>
        <IconButton color="inherit" onClick={handleClick}>
          <Badge badgeContent={notifications.length} color="secondary">
            <NotificationsIcon />
          </Badge>
        </IconButton>
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
          <Box sx={{ p: 2, width: 500, maxHeight: 200, overflowY: 'auto'}}>
            {notifications.length > 0 ? (
              <List>
                {notifications.map((notification) => (
                  <ListItem key={notification.id} secondaryAction={
                    <>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleAcceptBooking(notification.id, notification.bookingId)}
                        sx={{ mr: 1 }}
                      >
                        Accept
                      </Button>
                      <IconButton
                        edge="end"
                        aria-label="delete"
                        color='error'
                        onClick={() => handleRemoveNotification(notification.id)}
                      >
                        <DeleteIcon />
                      </IconButton>
                    </>
                  }>
                    <ListItemText primary={notification.message} />
                  </ListItem>
                ))}
              </List>
            ) : (
              <Typography>No notifications</Typography>
            )}
          </Box>
        </Popover>
      </Box>
      <Grid container spacing={4} sx={{ mt: 4 }}>
        <Grid item xs={12} md={3} sx={{ flexBasis: '25%' }}>
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
                <FormControlLabel
                  control={<Switch checked={isAvailable} onChange={handleAvailabilityChange} />}
                  label="Available"
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
                <input type="file" onChange={handleFileChange} style={{ display: 'none' }} id="upload-file" multiple />
                <label htmlFor="upload-file">
                  <Button variant="outlined" color="primary" component="span" sx={{ mt: 2, p: '12px 12px' }}>
                    Choose Profile Picture(s)
                  </Button>
                </label>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleUpload}
                  disabled={loading || files.length === 0}
                  sx={{ mt: 2, p: '12px 12px' }}
                >
                  Upload Profile Picture(s)
                </Button>
              </Box>
              <Box sx={{ mt: 4 }}>
                <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                  Messages
                </Typography>
                <List>
                  {contactedClients.map((client, index) => (
                    <ListItem
                      key={index}
                      secondaryAction={
                        <IconButton edge="end" aria-label="delete" onClick={() => handleDeleteContact(client)}>
                          <DeleteIcon />
                        </IconButton>
                      }
                    >
                      <ListItemButton onClick={() => handleContactClick(client)}>
                        <ListItemAvatar>
                          <Avatar src={client.profilePicture} alt={client.username} />
                        </ListItemAvatar>
                        <ListItemText primary={client.username} />
                      </ListItemButton>
                    </ListItem>
                  ))}
                </List>
              </Box>

            </CardContent>
          </Card>
        </Grid>

        <Grid item xs={12} md={9} sx={{ flexBasis: '75%' }}>
        
          <Card sx={{ p: 2, boxShadow: 3,  }}>
            <CardContent sx={{ position: 'relative' }}>  
            {viewMode === 'contactDetails' && selectedContact ? (
                <>
                  <Button
                    variant="outlined"
                    color="primary"
                    onClick={handleBackClick}
                    sx={{
                      position: 'absolute',
                      top: 0,
                      right: 0,
                      mt: 1,
                      mr: 1,
                    }}
                  >
                    Back
                  </Button>
                  <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                    Contact Details
                  </Typography>
                  
                  <Typography variant="body1" sx={{ mb: 2 }}>
                    Contact with {selectedContact.username}
                  </Typography>
                  
                  <Box sx={{ mt: 2 }}>
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleFileChange}
                      style={{ display: 'none' }}
                      id="upload-images"
                      multiple
                    />
                    <label htmlFor="upload-images">
                      <Button
                        variant="outlined"
                        color="primary"
                        component="span"
                        sx={{ mr: 1, p: '8px 16px' }}
                      >
                        Upload Images
                      </Button>
                    </label>
                    <Button
                      variant="outlined"
                      color="error"
                      onClick={handleRemoveAllImages}
                      sx={{ mr: 1, p: '8px 16px' }}
                    >
                      Remove All Images
                    </Button>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSendImages}
                      disabled={files.length === 0}
                      sx={{ p: '8px 16px' }}
                    >
                      Send Images
                    </Button>
                  </Box>
                </>
              ) : (
                <>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Edit Descriptions
              </Typography>
              <Box component="form" onSubmit={handleUpdatedescription} noValidate>
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="shortDescription"
                  label="Short Description"
                  name="shortDescription"
                  autoComplete="short-description"
                  inputRef={shortDescriptionRef}
                />
                <TextField
                  margin="normal"
                  required
                  fullWidth
                  id="detailedDescription"
                  label="Detailed Description"
                  name="detailedDescription"
                  autoComplete="detailed-description"
                  multiline
                  rows={4}
                  inputRef={detailedDescriptionRef}
                />
                <TextField
                  margin="normal"
                  fullWidth
                  id="price"
                  label="Price Details"
                  name="price"
                  autoComplete="price"
                  inputRef={priceRef}
                />
                <Button
                  type="submit"
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, p: '12px 12px' }}
                >
                  Update Descriptions
                </Button>
              </Box>
          
          

          {/* Portfolio Showcase Section */}
          <Card sx={{ p: 2, boxShadow: 3, mt: 4 }}>
            <CardContent>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Portfolio Showcase
              </Typography>
              <Box sx={{ mb: 2 }}>
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleFileChange}
                  style={{ display: 'none' }}
                  id="upload-images"
                  multiple
                />
                <label htmlFor="upload-images">
                  <Button
                    variant="outlined"
                    color="primary"
                    component="span"
                    sx={{ mt: 2, mr: 1, p: '12px 12px' }}
                  >
                    Add Images
                  </Button>
                </label>
                <Button
                  variant="contained"
                  color="primary"
                  onClick={handleImageUpload}
                  disabled={loading || files.length === 0}
                  sx={{ mt: 2, p: '12px 12px' }}
                >
                  Upload Images
                </Button>
              </Box>
              <Grid container spacing={2} sx={{ overflowY: 'auto', maxHeight: '400px' }}>
                {portfolioImages.length > 0 && portfolioImages.slice(1).map((imgURL, index) => (
                  <Grid item xs={6} sm={3} key={index}>
                  <Box sx={{ position: 'relative', paddingTop: '100%', overflow: 'hidden', backgroundColor: '#f0f0f0' }}>
                    <img
                      src={imgURL}
                      alt={`Portfolio ${index}`}
                      style={{
                        position: 'absolute',
                        top: '50%',
                        left: '50%',
                        width: '100%',
                        height: '100%',
                        transform: 'translate(-50%, -50%)',
                        objectFit: 'cover',
                        cursor: 'pointer',
                      }}
                      onClick={() => handleOpenDialog(imgURL)}
                    />
                    <IconButton
                      onClick={() => handleRemoveImage(imgURL)}
                      sx={{
                        position: 'absolute',
                        top: 8,
                        right: 8,
                        backgroundColor: 'rgba(255, 255, 255, 0.7)',
                        '&:hover': { backgroundColor: 'rgba(255, 255, 255, 1)' },
                      }}
                    >
                      <DeleteIcon />
                    </IconButton>
                  </Box>
                </Grid>
                ))}
              </Grid>
            </CardContent>
          </Card>
          </>
        )}
        </CardContent>
        </Card>
        </Grid>
      </Grid>

      

      <Dialog open={openDialog} onClose={handleCloseDialog} maxWidth="md" fullWidth>
        <DialogTitle>View Image
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
          {viewImage && (
            <Box sx={{ display: 'flex', justifyContent: 'center' }}>
              <img src={viewImage} alt="View" style={{ width: '100%', height: 'auto' }} />
            </Box>
          )}
        </DialogContent>
        <DialogActions>
          
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PhotographerDashboard;
