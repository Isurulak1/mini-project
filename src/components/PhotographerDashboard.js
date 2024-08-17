// src/components/PhotographerDashboard.js
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { collection,getDocs,getDoc, doc, updateDoc, arrayUnion, arrayRemove,writeBatch } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Switch, FormControlLabel, CircularProgress } from '@mui/material';
import Swal from 'sweetalert2';
import { Delete as DeleteIcon, Add as AddIcon } from '@mui/icons-material';
import { serverTimestamp } from 'firebase/firestore';



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
  const [bookedClients, setBookedClients] = useState([]); // New state for booked clients
  const [isAvailable, setIsAvailable] = useState(false);
  const [confirmedClients, setConfirmedClients] = useState([]);
   

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
        setBookedClients(userData.bookedClients || []); // Fetch booked clients
        setIsAvailable(userData.isAvailable || false);
      } catch (error) {
        Swal.fire('Error', 'Failed to load user data', 'error');
      }
    };

    fetchData();
  }, [currentUser]);

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

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      await updateDoc(doc(db, 'users', currentUser.uid), {
        username: usernameRef.current.value,
        shortDescription: shortDescriptionRef.current.value,
        detailedDescription: detailedDescriptionRef.current.value,
        price: priceRef.current.value, // Update price details
        isAvailable: isAvailable
      });

      Swal.fire('Success', 'Profile updated!', 'success');
    } catch (error) {
      Swal.fire('Error', `Failed to update profile: ${error.message}`, 'error');
    }

    setLoading(false);
  };

  const handleViewClientChat = (client) => {
    // Implement the logic to view chat with the selected client
    console.log('View chat with client:', client);
  };
  
  const handleAvailabilityChange = (event) => {
    setIsAvailable(event.target.checked);
  };
  const handleConfirmOrder = async (client) => {
    try {
      const photographerRef = doc(db, 'users', currentUser.uid);
      const clientRef = doc(db, 'users', client.uid);
  
      const batch = writeBatch(db);
  
      batch.update(photographerRef, {
        bookedClients: bookedClients.map((c) =>
          c.uid === client.uid ? { ...c, confirmed: true } : c
        ),
      });
  
      batch.update(clientRef, {
        hiredPhotographers: arrayUnion({
          uid: currentUser.uid,
          confirmed: true,
        }),
      });
  
      await batch.commit();
  
      Swal.fire('Success', 'Order confirmed!', 'success');
  
      setBookedClients((prev) =>
        prev.map((c) => (c.uid === client.uid ? { ...c, confirmed: true } : c))
      );
      // Hide buttons and show "Order is completed"
      setConfirmedClients((prev) => [...prev, client.uid]);


      await updateDoc(clientRef, {
        notifications: arrayUnion({
          message: `Your hire request was confirmed by ${currentUser.username}.`,
          timestamp: new Date().toISOString(),
        }),
      });
      // Update client's UI to indicate confirmed status
      // Communicate with the client component to update UI (e.g., set green background)
    } catch (error) {
      Swal.fire('Error', `Failed to confirm order: ${error.message}`, 'error');
    }
  };
  
  const handleRejectOrder = async (client) => {
    try {
      const photographerRef = doc(db, 'users', currentUser.uid);
      const clientRef = doc(db, 'users', client.uid);
      
      const batch = writeBatch(db);
  
      batch.update(photographerRef, {
        bookedClients: bookedClients.filter(c => c.uid !== client.uid)
      });
  
      batch.update(clientRef, {
        hiredPhotographers: arrayRemove({
          uid: currentUser.uid
        })
      });
  
      // Delete the client's message from the message box
      const chatRef = collection(db, 'chats', `${currentUser.uid}_${client.uid}`, 'messages');
      const messagesSnapshot = await getDocs(chatRef);
  
      messagesSnapshot.forEach((doc) => {
        batch.delete(doc.ref);
      });
  
      await batch.commit();
  
      Swal.fire('Success', `Order rejected for ${client.username}.`, 'success');
  
      setBookedClients((prev) =>
        prev.filter((c) => c.uid !== client.uid)
      );

      await updateDoc(clientRef, {
        notifications: arrayUnion({
          message: `Your hire request was rejected by ${currentUser.username}.`,
          timestamp: new Date().toISOString(),
        }),
      });
    } catch (error) {
      Swal.fire('Error', `Failed to reject order: ${error.message}`, 'error');
    }
  };
  
  
  
  

  return (
    <Container component="main" maxWidth="xl">
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
                  control={
                    <Switch
                      checked={isAvailable}
                      onChange={handleAvailabilityChange}
                      name="availability"
                      color="primary"
                    />
                  }
                  label="Available for Booking"
                />
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, p: '12px 12px' }}
                >
                  
                  {loading ? <CircularProgress size={24} /> : 'Update Profile'}
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
                  Booked Clients
                </Typography>
                {bookedClients.length > 0 ? (
                  bookedClients.map((client, index) => (
                    <Box key={index} sx={{ mb: 4, p: 2, border: '1px solid #ccc', borderRadius: '8px' }}>
                       <Typography variant="h6" sx={{ mb: 1 }}>
                        {index + 1}. {client.username}
                       </Typography>
                   <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
                       <Avatar src={client.profilePicture} alt={client.username} sx={{ width: 40, height: 40, mr: 2 }} />
                   </Box>
                   <Box sx={{ display: 'flex', justifyContent: 'space-between', mt: 2 }}>
                     <Button
                        variant="contained"
                        color="primary"
                        onClick={() => handleViewClientChat(client)}
                        sx={{ p: '8px 16px', flex: 1, mr: 1 }}
                    >
                     View Chat
                     </Button>
                     {confirmedClients.includes(client.uid) ? (
                       <Typography variant="body1" sx={{ color: 'green', flex: 1, mx: 1 }}>
                         Order is completed
                    </Typography>
                       ) : (
                       <>
                     <Button
                       variant="contained"
                       color="primary"
                       onClick={() => handleConfirmOrder(client)}
                       sx={{ p: '8px 16px', flex: 1, mx: 1 }}
                     >
                      Confirm Order
                     </Button>
                     <Button
                       variant="contained"
                       color="secondary"
                       onClick={() => handleRejectOrder(client)}
                       sx={{ p: '8px 16px', flex: 1, ml: 1 }}
                      >
                        Reject Order
                    </Button>
                    </>
                    )}
                    </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body2">No clients booked yet.</Typography>
                )}
              </Box>
            </CardContent>
          </Card>
        </Grid>
        <Grid item xs={12} md={9} sx={{ flexBasis: '75%' }}>
          <Card sx={{ p: 2, boxShadow: 3 }}>
            <CardContent>
              <Typography component="h2" variant="h6" sx={{ fontWeight: 'bold', mb: 2 }}>
                Edit Descriptions
              </Typography>
              <Box component="form" onSubmit={handleUpdate} noValidate>
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
            </CardContent>
          </Card>

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
        </Grid>
      </Grid>

      {/* View Image Dialog */}
      <Dialog open={openDialog} onClose={handleCloseDialog}>
        <DialogTitle>View Image</DialogTitle>
        <DialogContent>
          <img src={viewImage} alt="View" style={{ width: '100%' }} />
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCloseDialog} color="primary">
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </Container>
  );
}

export default PhotographerDashboard;
