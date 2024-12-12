// src/components/PhotographerDashboard.js
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoc, doc, updateDoc, arrayUnion, arrayRemove, getDocs, collection, query, orderBy, deleteDoc, setDoc,addDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL, deleteObject,getStorage, listAll } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, Dialog, DialogActions, DialogContent, DialogTitle, Switch, FormControlLabel, List, ListItem, ListItemButton, ListItemAvatar,ListItemText, Badge, Popover, CircularProgress, Divider, Drawer } from '@mui/material';
import Swal from 'sweetalert2';
import { Delete as DeleteIcon } from '@mui/icons-material';
import CloseIcon from '@mui/icons-material/Close';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { v4 as uuidv4 } from 'uuid';
import { Link as LinkRouter } from 'react-router-dom';
import logo from '../Assets/Logo2.png';
import Footer from '../Components/Footer/Footer';

function PhotographerDashboard() {
  const { currentUser } = useAuth();
  const usernameRef = useRef();
  const shortDescriptionRef = useRef();
  const detailedDescriptionRef = useRef();
  const priceRef = useRef(); // New ref for price details
  const [profilePicture, setProfilePicture] = useState("");
  const [portfolioImages, setPortfolioImages] = useState([]);
  const [files, setFiles] = useState([]);
  const [loading, setLoading] = useState(false);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewImage, setViewImage] = useState("");
  const [contactedClients, setContactedClients] = useState([]);
  const [isAvailable, setIsAvailable] = useState(false);
  const [notifications, setNotifications] = useState([]); // New state for notifications
  const [bookingNotifications, setBookingNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const open = Boolean(anchorEl);
  const [selectedContact, setSelectedContact] = useState(null);
  const [viewMode, setViewMode] = useState("default");
  const [filePreviews, setFilePreviews] = useState([]);
  const [previewUrls, setPreviewUrls] = useState([]);
  const [uploadedImages, setUploadedImages] = useState([]);
  const [clientSelectedImages, setClientSelectedImages] = useState([]);
  const [buttonText, setButtonText] = useState("Upload Images");
  const [removing, setRemoving] = useState(false);
  const [removeButtonText, setRemoveButtonText] = useState("Remove All Images");
  const [sending, setSending] = useState(false);
  const [sendButtonText, setSendButtonText] = useState("Send Images");

  


  
  

  useEffect(() => {
    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        usernameRef.current.value = userData.username;
        shortDescriptionRef.current.value = userData.shortDescription || "";
        detailedDescriptionRef.current.value =
          userData.detailedDescription || "";
        priceRef.current.value = userData.price || ""; // Set price details
        setProfilePicture(userData.profilePicture);
        setPortfolioImages(userData.portfolioImages || []);

        setIsAvailable(userData.isAvailable || false);
      } catch (error) {
        Swal.fire("Error", "Failed to load user data", "error");
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
          orderBy("timestamp", "desc")
        );
        const querySnapshot = await getDocs(notificationsQuery);
        const notificationsList = querySnapshot.docs.map((doc) => ({
          id: doc.id,
          ...doc.data(),
          timestamp: doc.data().timestamp?.toDate(), // Convert Firestore Timestamp to JavaScript Date
        }));
        console.log("Fetched Notifications:", notificationsList); // Debugging statement
        setNotifications(notificationsList);
      } catch (error) {
        console.error("Error fetching notifications:", error);
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
      Swal.fire("Warning", "No files selected", "warning");
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(
          storage,
          `profilePictures/${currentUser.uid}/${file.name}`
        );
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const downloadURLs = await Promise.all(uploadPromises);

      // Assuming we only update with the first file's URL
      await updateDoc(doc(db, "users", currentUser.uid), {
        profilePicture: downloadURLs[0],
      });

      setProfilePicture(downloadURLs[0]);
      Swal.fire("Success", "Profile picture updated!", "success");
    } catch (error) {
      Swal.fire(
        "Error",
        `Failed to upload profile picture: ${error.message}`,
        "error"
      );
    } finally {
      setLoading(false); // Ensure loading is stopped even if an error occurs
    }
  };

  const handleImageUpload = async () => {
    if (files.length === 0) {
      Swal.fire("Warning", "No images selected", "warning");
      return;
    }

    setLoading(true);

    try {
      const uploadPromises = files.map(async (file) => {
        const fileRef = ref(
          storage,
          `portfolio/${currentUser.uid}/${file.name}`
        );
        await uploadBytes(fileRef, file);
        return getDownloadURL(fileRef);
      });

      const downloadURLs = await Promise.all(uploadPromises);

      setPortfolioImages((prev) => [...prev, ...downloadURLs]);
      await updateDoc(doc(db, "users", currentUser.uid), {
        portfolioImages: arrayUnion(...downloadURLs),
      });

      Swal.fire("Success", "Images added to portfolio!", "success");
    } catch (error) {
      Swal.fire("Error", `Failed to upload images: ${error.message}`, "error");
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
      await updateDoc(doc(db, "users", currentUser.uid), {
        portfolioImages: arrayRemove(imageURL),
      });

      Swal.fire("Success", "Image removed from portfolio!", "success");
    } catch (error) {
      Swal.fire("Error", `Failed to remove image: ${error.message}`, "error");
    }

    setLoading(false);
  };

  const handleOpenDialog = (imageURL) => {
    setViewImage(imageURL);
    setOpenDialog(true);
  };

  const handleCloseDialog = () => {
    setOpenDialog(false);
    setViewImage("");
  };

  const checkUsernameExists = async (username) => {
    const usersQuerySnapshot = await getDocs(collection(db, "users"));
    const usernames = usersQuerySnapshot.docs.map((doc) => doc.data().username);
    return usernames.includes(username);
  };

  const handleUpdate = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const newUsername = usernameRef.current.value;
      if (!newUsername) {
        Swal.fire("Error", "Username cannot be empty", "error");
        setLoading(false);
        return;
      }

      // Check if the new username already exists
      if (await checkUsernameExists(newUsername)) {
        Swal.fire("Error", "Username already exists", "error");
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        username: newUsername,
      });

      Swal.fire("Success", "Profile updated!", "success");
    } catch (error) {
      Swal.fire("Error", `Failed to update profile: ${error.message}`, "error");
    } finally {
      setLoading(false); // Ensure loading is stopped even if an error occurs
    }
  };

  const handleUpdatedescription = async (e) => {
    e.preventDefault();
    setLoading(true);
  
    const shortDescription = shortDescriptionRef.current.value.trim();
    const detailedDescription = detailedDescriptionRef.current.value.trim();
    const price = priceRef.current.value.trim();
  
    // Ensure all fields are filled
    if (!shortDescription || !detailedDescription || !price) {
      setLoading(false); // Stop loading if validation fails
      Swal.fire("Error", "All fields must be filled!", "error");
      return;
    }
  
    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        shortDescription,
        detailedDescription,
        price, // Update price details
      });
  
      Swal.fire("Success", "Profile updated!", "success");
    } catch (error) {
      Swal.fire("Error", `Failed to update profile: ${error.message}`, "error");
    } finally {
      setLoading(false); // Ensure loading state is stopped even if an error occurs
    }
  };

  const handleAvailabilityChange = async (event) => {
    const newAvailability = event.target.checked;
    setIsAvailable(newAvailability);

    try {
      await updateDoc(doc(db, "users", currentUser.uid), {
        isAvailable: newAvailability,
      });
    } catch (error) {
      Swal.fire(
        "Error",
        `Failed to update availability: ${error.message}`,
        "error"
      );
    }
  };

  const handleDeleteContact = async (client) => {
    try {
      // Confirm the deletion
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete ${client.username} from your contacts?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel",
      });

      if (result.isConfirmed) {
        // Update local state
        const updatedContacts = contactedClients.filter(
          (contact) => contact.username !== client.username
        );
        setContactedClients(updatedContacts);

        // Update Firestore
        await updateDoc(doc(db, "users", currentUser.uid), {
          contactedClients: updatedContacts,
        });

        Swal.fire(
          "Deleted!",
          `${client.username} has been removed from your contacts.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
      Swal.fire("Error", `Failed to delete contact: ${error.message}`, "error");
    }
  };

  const handleContactClick = (client) => {
    setSelectedContact(client);
    setViewMode("contactDetails"); // Switch to contact details view
  };

  const handleAcceptBooking = async (notificationId, bookingId) => {
    try {
      console.log("Notification ID:", notificationId);

      // Fetch the notification document
      const notificationRef = doc(
        db,
        `users/${currentUser.uid}/notifications/${notificationId}`
      );
      const notificationDoc = await getDoc(notificationRef);

      if (!notificationDoc.exists()) {
        throw new Error("Notification not found.");
      }

      const notification = notificationDoc.data();
      console.log("Notification Data:", notification);

      const { userId } = notification; // Assuming the userId is the client's ID
      if (!userId) {
        throw new Error("User ID not found in notification.");
      }

      // Update booking status in the photographer's bookings collection
      const photographerBookingRef = doc(
        db,
        `users/${currentUser.uid}/bookings/${bookingId}`
      );
      await updateDoc(photographerBookingRef, { status: "accepted" });

      // Update booking status in the client's bookings collection
      const clientBookingRef = doc(db, `users/${userId}/bookings/${bookingId}`);
      await updateDoc(clientBookingRef, { status: "accepted" });

      // Fetch client data
      const clientRef = doc(db, "users", userId);
      const clientDoc = await getDoc(clientRef);
      if (!clientDoc.exists()) {
        throw new Error("Client data not found.");
      }

      const clientData = clientDoc.data();

      // Fetch photographer data
      const photographerRef = doc(db, "users", currentUser.uid);
      const photographerDoc = await getDoc(photographerRef);
      const photographerData = photographerDoc.data();

      // Update photographer's contacted clients list
      const updatedClients = [
        ...(photographerData.contactedClients || []),
        {
          username: clientData.username,
          profilePicture: clientData.profilePicture,
          clientId: userId,
        },
      ];

      await updateDoc(photographerRef, { contactedClients: updatedClients });

      // Update the client's notification status to "accepted"
      const clientNotificationRef = doc(
        db,
        `users/${userId}/notifications/${notificationId}`
      );
      await updateDoc(clientNotificationRef, {
        message: `Booking accepted by ${photographerData.username}`,
        status: "accepted",
        timestamp: new Date(),
      });

      // Delete the notification after processing
      await deleteDoc(notificationRef);

      // Update state
      setContactedClients(updatedClients);
      const updatedNotifications = notifications.filter(
        (notification) => notification.id !== notificationId
      );
      setNotifications(updatedNotifications);

      // Success message
      Swal.fire(
        "Success",
        "Booking accepted! Client added to your messages.",
        "success"
      );
    } catch (error) {
      console.error(error);
      Swal.fire("Error", `Failed to accept booking: ${error.message}`, "error");
    }
  };

  // Function to fetch and listen to contacted clients
  const fetchContactedClients = async () => {
    try {
      const photographerRef = doc(db, "users", currentUser.uid);
      const photographerDoc = await getDoc(photographerRef);

      if (!photographerDoc.exists()) {
        throw new Error("Photographer data not found.");
      }

      const photographerData = photographerDoc.data();
      const contactedClientsData = photographerData.contactedClients || [];

      // Listen to changes in the contactedClients list and update profile pictures in real-time
      contactedClientsData.forEach((client) => {
        const clientRef = doc(db, "users", client.clientId);

        // Listen for real-time updates to the client's profile picture
        onSnapshot(clientRef, (docSnapshot) => {
          if (docSnapshot.exists()) {
            const clientData = docSnapshot.data();
            setContactedClients((prevClients) =>
              prevClients.map((prevClient) =>
                prevClient.clientId === client.clientId
                  ? {
                      ...prevClient,
                      profilePicture:
                        clientData.profilePicture || "/default-avatar.png",
                    }
                  : prevClient
              )
            );
          }
        });
      });

      // Set initial contactedClients state with profile pictures fetched
      setContactedClients(contactedClientsData);

      setLoading(false);
    } catch (error) {
      console.error("Failed to fetch contacted clients:", error);
    }
  };

  useEffect(() => {
    if (currentUser) {
      fetchContactedClients();
    }
  }, [currentUser]);

  const handleRemoveNotification = async (notificationId) => {
    setLoading(true);
    try {
      // Remove the notification from Firestore
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/notifications`, notificationId)
      );

      // Update local state
      setNotifications((prev) =>
        prev.filter((notification) => notification.id !== notificationId)
      );
    } catch (error) {
      Swal.fire(
        "Error",
        `Failed to remove notification: ${error.message}`,
        "error"
      );
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
    setViewMode("default"); // Switch back to default view

    const fetchData = async () => {
      try {
        const userDoc = await getDoc(doc(db, "users", currentUser.uid));
        const userData = userDoc.data();
        usernameRef.current.value = userData.username;
        shortDescriptionRef.current.value = userData.shortDescription || "";
        detailedDescriptionRef.current.value =
          userData.detailedDescription || "";
        priceRef.current.value = userData.price || ""; // Update price details
      } catch (error) {
        Swal.fire("Error", "Failed to load user data", "error");
      }
    };
    fetchData();
  };

  const handleFileChangeSharing = (event) => {
    const selectedFiles = Array.from(event.target.files);
    setFiles((prevFiles) => [...prevFiles, ...selectedFiles]);

    // Generate preview URLs for the images
    const newPreviewUrls = selectedFiles.map((file) =>
      URL.createObjectURL(file)
    );
    setPreviewUrls((prevUrls) => [...prevUrls, ...newPreviewUrls]);
  };

  const handleRemoveAllImages = async () => {
    setRemoving(true);
    setRemoveButtonText("Removing..."); // Update button text during the process

    try {
      const storagePath = `sharedImages/${currentUser.uid}/${selectedContact.clientId}`;
      const firestoreCollectionPath = `users/${currentUser.uid}/sharedImages/${selectedContact.clientId}/images`;
      const sharingDocPathPhotographer = `users/${currentUser.uid}/sharing/${selectedContact.clientId}`;
      const sharingDocPathClient = `users/${selectedContact.clientId}/sharing/${currentUser.uid}`;

      // Step 1: Delete all images from Firebase Storage
      const storageRef = ref(storage, storagePath);
      const listResponse = await listAll(storageRef);
      const deletePromises = listResponse.items.map((itemRef) =>
        deleteObject(itemRef)
      );

      await Promise.all(deletePromises);

      // Step 2: Delete all related image records from Firestore
      const imagesCollectionRef = collection(db, firestoreCollectionPath);
      const imagesSnapshot = await getDocs(imagesCollectionRef);
      const firestoreDeletePromises = imagesSnapshot.docs.map((docSnapshot) =>
        deleteDoc(docSnapshot.ref)
      );

      await Promise.all(firestoreDeletePromises);

      // Step 3: Remove the sharing documents from both users' Firestore collections
      await Promise.all([
        deleteDoc(doc(db, sharingDocPathPhotographer)),
        deleteDoc(doc(db, sharingDocPathClient)),
      ]);

      Swal.fire(
        "Success",
        "All images and sharing information have been removed successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error removing all images:", error);
      Swal.fire("Error", `Failed to remove images: ${error.message}`, "error");
    } finally {
      setRemoving(false); // Reset loading state
      setRemoveButtonText("Remove All Images"); // Reset button text after the process
    }
  };

  const handleSendImages = async () => {
    try {
      if (!files.length) {
        Swal.fire("Warning", "No files selected for upload.", "warning");
        return;
      }

      setSending(true);
      setSendButtonText("Sending"); // Update button text to "Sending..."

      const photographerSharingId = selectedContact.clientId;
      const clientSharingId = currentUser.uid;

      const photographerSharingRef = doc(
        db,
        `users/${currentUser.uid}/sharing`,
        photographerSharingId
      );
      const clientSharingRef = doc(
        db,
        `users/${selectedContact.clientId}/sharing`,
        clientSharingId
      );

      const storage = getStorage();
      const uploadedFiles = await Promise.all(
        files.map(async (file) => {
          const fileId = uuidv4();
          const storageRef = ref(
            storage,
            `sentImages/${currentUser.uid}/${file.name}`
          );
          await uploadBytes(storageRef, file);

          const downloadURL = await getDownloadURL(storageRef);
          return { fileName: file.name, url: downloadURL };
        })
      );

      const sharingData = {
        sharedBy: currentUser.uid,
        sharedWith: selectedContact.clientId,
        timestamp: new Date(),
        images: uploadedFiles,
      };

      await setDoc(photographerSharingRef, sharingData);
      await setDoc(clientSharingRef, sharingData);

      Swal.fire("Success", "Images have been shared successfully!", "success");
      setFiles([]); // Clear files after successful upload
    } catch (error) {
      console.error("Error sharing images:", error);
      Swal.fire("Error", `Failed to share images: ${error.message}`, "error");
    } finally {
      setSending(false); // Stop loading
      setSendButtonText("Send Images"); // Reset button text
    }
  };

  const handleUploadImagesSharing = async () => {
    setLoading(true);
    setButtonText("Uploading"); // Change button text to "Uploading..."
    try {
      const storage = getStorage();
      const uploadPromises = files.map(async (file) => {
        const imageId = uuidv4();
        const imageRef = ref(
          storage,
          `sharedImages/${currentUser.uid}/${imageId}`
        );
        const uploadResult = await uploadBytes(imageRef, file);
        const imageUrl = await getDownloadURL(uploadResult.ref);

        const imageMetadata = {
          url: imageUrl,
          name: file.name,
          size: file.size,
          createdAt: new Date(),
        };

        const imagesPath = `users/${currentUser.uid}/sharedImages/${selectedContact.clientId}/images`;
        const imageRefInFirestore = doc(collection(db, imagesPath));
        await setDoc(imageRefInFirestore, imageMetadata);

        return imageMetadata;
      });

      const uploadedImages = await Promise.all(uploadPromises);
      setUploadedImages((prevImages) => [...prevImages, ...uploadedImages]);

      Swal.fire("Success", "Images uploaded successfully!", "success");
    } catch (error) {
      console.error("Failed to upload images:", error);
      Swal.fire("Error", `Failed to upload images: ${error.message}`, "error");
    } finally {
      setLoading(false);
      setButtonText("Upload Images"); // Reset button text after upload
    }
  };

  const fetchUploadedImages = async () => {
    if (!currentUser || !selectedContact) return;

    try {
      const imagesPath = `users/${currentUser.uid}/sharedImages/${selectedContact.clientId}/images`;
      const imagesRef = collection(db, imagesPath);
      const querySnapshot = await getDocs(imagesRef);

      const images = querySnapshot.docs.map((doc) => doc.data());
      setUploadedImages(images);
    } catch (error) {
      console.error("Failed to fetch uploaded images:", error);
    }
  };

  // Call this function when the selected contact changes or the current user updates
  useEffect(() => {
    if (selectedContact && currentUser) {
      fetchUploadedImages();
    }
  }, [selectedContact, currentUser]);

  const fetchUploadedImagesForClient = async () => {
    if (!selectedContact || !currentUser) return;

    try {
      // Define the path to fetch images from, based on the contact IDs
      const imagesRef = collection(
        db,
        `users/${selectedContact.clientId}/sharedImages/${currentUser.uid}`
      );
      const querySnapshot = await getDocs(imagesRef);

      // Map the documents to extract image data
      const clientImages = querySnapshot.docs.map((doc) => doc.data());
      setUploadedImages(clientImages);
    } catch (error) {
      console.error("Failed to fetch client uploaded images:", error);
    }
  };

  // Call this function when the selected contact changes or the current user updates
  useEffect(() => {
    if (selectedContact && currentUser) {
      fetchUploadedImagesForClient();
    }
  }, [selectedContact, currentUser]);

  const fetchClientSelectedImages = async () => {
    if (!selectedContact || !currentUser) {
      console.log("Selected contact or current user is missing.");
      return;
    }

    try {
      const clientSelectedImagesRef = doc(
        db,
        `users/${currentUser.uid}/receivedImages/${selectedContact.clientId}`
      );
      const clientDocSnapshot = await getDoc(clientSelectedImagesRef);

      if (clientDocSnapshot.exists()) {
        const imagesData = clientDocSnapshot.data().images || {};
        const imagesArray = Object.keys(imagesData).map(
          (key) => imagesData[key]
        );

        console.log("Fetched client selected images:", imagesArray);

        setClientSelectedImages(imagesArray);
      } else {
        console.log("No images found for the client.");
        setClientSelectedImages([]);
      }
    } catch (error) {
      console.error("Error fetching client's selected images: ", error);
    }
  };

  useEffect(() => {
    fetchClientSelectedImages();
  }, [selectedContact, currentUser]);

  const handleRemoveImages = async () => {
    if (!selectedContact || !currentUser || clientSelectedImages.length === 0) {
      Swal.fire(
        "No images to remove",
        "There are no images to delete.",
        "info"
      );
      return;
    }

    try {
      // Remove the images metadata from Firestore
      const clientSelectedImagesRef = doc(
        db,
        `users/${currentUser.uid}/receivedImages/${selectedContact.clientId}`
      );

      await updateDoc(clientSelectedImagesRef, {
        images: {}, // Clear out all the images metadata
      });

      // Update UI to reflect the removed images
      setClientSelectedImages([]);

      Swal.fire(
        "Success",
        "All selected images have been removed successfully!",
        "success"
      );
    } catch (error) {
      console.error("Error removing images:", error);
      Swal.fire("Error", `Failed to remove images: ${error.message}`, "error");
    }
  };

  return (
    <>
      <div className="nav-section" style={{borderBottom: "1px solid #DADBDD"}}>
        <nav className="navbar-dash">
          <div className="logo-head">
            <img src={logo} alt="" className="logo" />
            <div className="logo-text">
              <h2>ShutterShare</h2>
              <p>Future Photography</p>
            </div>
          </div>
          <ul
            style={{
              display: "flex",
              alignItems: "center",
              listStyleType: "none",
              padding: 0,
              margin: 0,
            }}
          >
            <li>
            <Box sx={{ display: "flex", justifyContent: "flex-end", p: 0 }}>
  <IconButton color="primary" onClick={handleClick}>
    <Badge badgeContent={notifications.length} color="error">
      <NotificationsIcon />
    </Badge>
  </IconButton>
  <Popover
    open={open}
    anchorEl={anchorEl}
    onClose={handleClose}
    anchorOrigin={{
      vertical: "bottom",
      horizontal: "right",
    }}
    transformOrigin={{
      vertical: "top",
      horizontal: "right",
    }}
    sx={{
      boxShadow: "none",
      "& .MuiPopover-paper": {
        boxShadow: "0px 4px 4px rgba(0, 0, 0, 0.09)", // Ensures popover paper has no shadow
        border: "1px solid #e0e0e0", // Add a light border
        borderRadius: "4px", // Optional: add rounded corners
      },
    }}
  >
    <Box sx={{ p: 2, width: 500, maxHeight: 300, overflowY: "auto" }}>
      {/* Notification Title with Icon */}
      <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
        <NotificationsIcon sx={{ mr: 1, color: "#62646F" }} />
        <Typography variant="h6" sx={{ color: "#62646F" }}>
          Notifications
        </Typography>
      </Box>
      
      {/* Divider after the title */}
      <Divider sx={{ mb: 2 }} />

      {/* Notification list */}
      {notifications.length > 0 ? (
        <List>
          {notifications.map((notification) => (
            <React.Fragment key={notification.id}>
              <ListItem
                secondaryAction={
                  <>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={() =>
                        handleAcceptBooking(
                          notification.id,
                          notification.bookingId
                        )
                      }
                      sx={{ mr: 1, boxShadow: "none" }}
                    >
                      Accept
                    </Button>
                    <IconButton
                      edge="end"
                      aria-label="delete"
                      color="error"
                      onClick={() =>
                        handleRemoveNotification(notification.id)
                      }
                    >
                      <DeleteIcon />
                    </IconButton>
                  </>
                }
              >
                <ListItemText
                  primary={
                    <Typography sx={{ color: "#62646F" }}>
                      {notification.message}
                    </Typography>
                  }
                  secondary={
                    <Typography sx={{ color: "#62646F", fontSize: "0.875rem" }}>
                      {notification.timestamp
                        ? notification.timestamp.toLocaleString()
                        : "No timestamp available"}
                    </Typography>
                  }
                />
              </ListItem>
              <Divider sx={{ my: 1 }} />
            </React.Fragment>
          ))}
        </List>
      ) : (
        <Typography sx={{ color: "#62646F" }}>No notifications</Typography>
      )}
    </Box>
  </Popover>
</Box>


            </li>
            <li>
              <LinkRouter to="/login" style={{ textDecoration: "none" }}>
                <Button
                  variant="outlined"
                  color="primary"
                  sx={{
                    p: 1,
                    width: "100px",
                    border: "solid",
                    borderWidth: 2,
                    "&:hover": { borderWidth: 2 },
                  }}
                >
                  Logout
                </Button>
              </LinkRouter>
            </li>
            <li>
              <Avatar
                src={profilePicture}
                alt="Profile Picture"
                sx={{ width: 50, height: 50, margin: "0 auto" }}
              />
            </li>
          </ul>
        </nav>
      </div>

      <Container component="main" maxWidth="xl" sx={{backgroundColor: "#F5F5F5", p:1,}}>
        <Grid container justifyContent="center" spacing={4} sx={{ mt: 0}}>
          <Grid item xs={12} md={3} sx={{ flexBasis: "25%" }}>
            <Card sx={{ p: 2, boxShadow: "none", mb: 4, border: "1px solid #DADBDD" }}>
              <CardContent>
                <Typography
                  component="h2"
                  variant="h5"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  Profile Details
                </Typography>
                <Box component="form" onSubmit={handleUpdate} noValidate>
                  <Typography
                    variant="subtitle1"
                    sx={{ color: "#62646F", fontWeight: "bold", mb: -1 }}
                  >
                    Username
                  </Typography>

                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="username"
                    name="username"
                    autoComplete="username"
                    inputRef={usernameRef}
                    InputLabelProps={{ shrink: true }}
                    sx={{
                      "& .MuiInputBase-root": {
                        color: "#62646F", // Change input text color
                      },
                    }} // Removed this because no label is used now
                  />
                  <FormControlLabel
                    control={
                      <Switch
                        checked={isAvailable}
                        onChange={handleAvailabilityChange}
                      />
                    }
                    label="Availability Status"
                    sx={{
                      "& .MuiFormControlLabel-label": {
                        color: "#62646F", // Change the font color
                        fontWeight: "400", // Change the font weight
                      },
                    }}
                  />
                  <Button
                    type="submit"
                    fullWidth
                    variant="contained"
                    color="primary"
                    disabled={loading} // Disable button during loading
                    sx={{
                      mt: 2,
                      mb: 3,
                      p: "12px 8px",
                      position: "relative",
                      boxShadow: "none",
                      textTransform: "none",
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={24}
                          sx={{ color: "inherit", mr: 1 }}
                        />
                        Updating
                      </Box>
                    ) : (
                      "Update Profile"
                    )}
                  </Button>
                </Box>
                <Divider sx={{ my: 2 }} />
                <Box sx={{ mt: 4, textAlign: "center" }}>
                  <Avatar
                    src={profilePicture}
                    alt="Profile Picture"
                    sx={{ width: 100, height: 100, margin: "0 auto" }}
                  />
                  <input
                    type="file"
                    onChange={handleFileChange}
                    style={{ display: "none" }}
                    id="upload-file"
                    multiple
                  />
                  <label htmlFor="upload-file">
                    <Button
                      variant="outlined"
                      color="primary"
                      fullWidth
                      component="span"
                      sx={{ mt: 2, p: "8px 16px", textTransform: "none" }}
                    >
                      Choose Profile Picture
                    </Button>
                  </label>
                  <Button
                    variant="contained"
                    color="primary"
                    fullWidth
                    onClick={handleUpload}
                    disabled={loading || files.length === 0} // Disable if loading or no files
                    sx={{
                      mt: 2,
                      mb: 3,
                      p: "8px 16px",
                      position: "relative",
                      textTransform: "none",
                    }}
                  >
                    {loading ? (
                      <Box sx={{ display: "flex", alignItems: "center" }}>
                        <CircularProgress
                          size={24}
                          sx={{ color: "inherit", mr: 1 }}
                        />
                        Uploading
                      </Box>
                    ) : (
                      "Upload Profile Picture"
                    )}
                  </Button>
                </Box>
                <Divider sx={{ mb: 1, mt: 2 }} />
                <Box sx={{ mt: 4 }}>
                  <Typography
                    component="h2"
                    variant="h6"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    Messages
                  </Typography>
                  <List>
                    {contactedClients.map((client, index) => (
                      <ListItem
                        key={index}
                        secondaryAction={
                          <IconButton
                            edge="end"
                            aria-label="delete"
                            onClick={() => handleDeleteContact(client)}
                          >
                            <DeleteIcon />
                          </IconButton>
                        }
                      >
                        <ListItemButton
                          onClick={() => handleContactClick(client)}
                        >
                          <ListItemAvatar>
                            <Avatar
                              src={client.profilePicture}
                              alt={client.username}
                            />
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

          <Grid item xs={12} md={8} sx={{ flexBasis: "75%" }}>
            <Card sx={{ p: 2, boxShadow: "none", mb: 4, border: "1px solid #DADBDD" }}>
              <CardContent sx={{ position: "relative" }}>
                {viewMode === "contactDetails" && selectedContact ? (
                  <>
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleBackClick}
                      sx={{
                        position: "absolute",
                        top: 0,
                        right: 0,
                        mt: 1,
                        mr: 2,
                      }}
                    >
                      Back
                    </Button>
                    <Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      Client Information
                    </Typography>

                    <Typography variant="body1" sx={{ mb: 2, fontWeight: "bold", color: "#62646F" }}>
  <span style={{ color: "black" }}>Name: </span>{selectedContact.username}
  <br />
  <span style={{ color: "black" }}>Email: </span>{selectedContact.email}
</Typography>

                    <Divider sx={{my: 3}}></Divider>
                    <Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: "bold", mb: 2 }}
                    >
                      Images for Client
                    </Typography>
                    <Box sx={{ mt: 2 }}>
                      <input
                        type="file"
                        accept="image/*"
                        onChange={handleFileChange}
                        style={{ display: "none" }}
                        id="add-images"
                        multiple
                      />
                      <label htmlFor="add-images">
                        <Button
                          variant="outlined"
                          color="primary"
                          component="span"
                          sx={{ mr: 1, p: "8px 16px", textTransform: "none", borderRadius: "4px" }}
                        >
                          Add Images
                        </Button>
                      </label>
                      <Button
                        variant="outlined"
                        color="primary"
                        onClick={handleUploadImagesSharing}
                        disabled={files.length === 0 || loading}
                        sx={{ mr: 1, p: "8px 16px", position: "relative", textTransform: "none", borderRadius: "4px" }}
                      >
                        {loading ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CircularProgress
                              size={24}
                              sx={{ color: "inherit", mr: 1 }}
                            />
                            {buttonText}
                          </Box>
                        ) : (
                          buttonText
                        )}
                      </Button>
                      <Button
                        variant="outlined"
                        color="error"
                        onClick={handleRemoveAllImages}
                        disabled={removing}
                        sx={{ mr: 1, p: "8px 16px", position: "relative", textTransform: "none", borderRadius: "4px" }} // Maintain consistent button padding and size
                      >
                        {removing ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CircularProgress
                              size={24}
                              sx={{ color: "inherit", mr: 1 }}
                            />
                            {removeButtonText}
                          </Box>
                        ) : (
                          removeButtonText
                        )}
                      </Button>
                      <Button
                        variant="contained"
                        color="primary"
                        onClick={handleSendImages}
                        disabled={sending || files.length === 0} // Disable when sending or no files are selected
                        sx={{ p: "8px 16px", position: "relative", textTransform: "none", borderRadius: "4px" }}
                      >
                        {sending ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CircularProgress
                              size={24}
                              sx={{ color: "inherit", mr: 1 }}
                            />
                            {sendButtonText}
                          </Box>
                        ) : (
                          sendButtonText
                        )}
                      </Button>
                    </Box>

                    <Box
                      sx={{
                        mt: 2,
                        maxHeight: "300px", // Limit height for scrollable area
                        overflowY: "auto", // Enable scrolling when content exceeds max height
                        border: "1px solid #ccc",
                        p: 2,
                        borderRadius: 2,
                        mb: 5
                      }}
                    >
                      <Grid container spacing={2}>
                        {previewUrls.map((url, index) => (
                          <Grid item xs={3} key={index}>
                            {" "}
                            {/* Each image takes up 3 out of 12 columns (4 images per row) */}
                            <Box
                              component="img"
                              src={url}
                              alt={`Preview ${index + 1}`}
                              sx={{
                                width: "100%",
                                height: "100%",
                                objectFit: "cover",
                                borderRadius: 1,
                              }}
                            />
                          </Grid>
                        ))}
                        {/* Display already uploaded images */}
                        {uploadedImages.length === 0 ? (
                          <Grid item xs={12}>
                            <Typography
                              variant="body2"
                              color="textSecondary"
                              sx={{ textAlign: "center" }}
                            >
                              No images uploaded.
                            </Typography>
                          </Grid>
                        ) : (
                          uploadedImages.map((image, index) => (
                            <Grid item xs={3} key={index + previewUrls.length}>
                              {" "}
                              {/* Offset index for unique keys */}
                              <Box
                                sx={{
                                  width: "100%",
                                  height: 0,
                                  paddingTop: "100%", // Maintains square aspect ratio
                                  position: "relative",
                                  overflow: "hidden",
                                  borderRadius: 1,
                                }}
                              >
                                <img
                                  src={image.url}
                                  alt={`Uploaded Image ${index + 1}`}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "5px",
                                  }}
                                />
                              </Box>
                            </Grid>
                          ))
                        )}
                      </Grid>
                    </Box>

                    <Divider sx={{my: 2}}></Divider>

                    {/* New Section for Client's Selected Images */}
                    <Box sx={{ mt: 4 }}>
                      <Typography
                        component="h2"
                        variant="h5"
                        sx={{ fontWeight: "bold", mb: 2 }}
                      >
                        Selected Images by Client
                      </Typography>

                      <Box
                        sx={{
                          maxHeight: "300px", // Limit height for scrollable area
                          overflowY: "auto", // Enable scrolling when content exceeds max height
                          border: "1px solid #ccc",
                          p: 2,
                          borderRadius: 2,
                          mb: 2, // Add some margin to separate the Remove button
                        }}
                      >
                        <Grid container spacing={2}>
                          {clientSelectedImages.length > 0 ? (
                            clientSelectedImages.map((image, index) => (
                              <Grid item xs={3} key={index}>
                                <Box
                                  sx={{
                                    width: "100%",
                                    height: 0,
                                    paddingTop: "100%", // Maintains square aspect ratio
                                    position: "relative",
                                    overflow: "hidden",
                                    borderRadius: 1,
                                  }}
                                >
                                  <img
                                    src={image.url} // Ensure 'url' is the correct property name
                                    alt={`Client Selected Image ${index + 1}`}
                                    style={{
                                      position: "absolute",
                                      top: 0,
                                      left: 0,
                                      width: "100%",
                                      height: "100%",
                                      objectFit: "cover",
                                      borderRadius: "5px",
                                    }}
                                  />
                                </Box>
                              </Grid>
                            ))
                          ) : (
                            <Grid item xs={12}>
                              <Typography
                                variant="body2"
                                color="textSecondary"
                                sx={{ textAlign: "center" }}
                              >
                                No images selected by the client.
                              </Typography>
                            </Grid>
                          )}
                        </Grid>
                      </Box>

                      {/* Remove All Images Button */}
                      {clientSelectedImages.length > 0 && (
                        <Button
                          variant="contained"
                          color="error"
                          onClick={handleRemoveImages}
                          sx={{boxShadow: "none", p: "11px 16px", textTransform: "none", borderRadius: "4px"}}
                        >
                          Remove All Images
                        </Button>
                      )}
                    </Box>
                  </>
                ) : (
                  <>
                    <Box>
                      {/* Short Description */}
                      <Box mb={2}>
                        <Typography
                          component="h2"
                          variant="h5"
                          sx={{ fontWeight: "bold", mb: 2 }}
                        >
                          Description
                        </Typography>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "#62646F", fontWeight: "bold", mb: -1 }}
                        >
                          Short Description
                        </Typography>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          id="shortDescription"
                          name="shortDescription"
                          autoComplete="short-description"
                          inputRef={shortDescriptionRef}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiInputBase-root": {
                              color: "#62646F", // Change input text color
                            },
                          }}
                        />
                      </Box>

                      {/* Detailed Description */}
                      <Box mb={2}>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "#62646F", fontWeight: "bold", mb: -1 }}
                        >
                          Detailed Description
                        </Typography>
                        <TextField
                          margin="normal"
                          required
                          fullWidth
                          id="detailedDescription"
                          name="detailedDescription"
                          autoComplete="detailed-description"
                          multiline
                          rows={14}
                          inputRef={detailedDescriptionRef}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiInputBase-root": {
                              color: "#62646F", // Change input text color
                            },
                          }}
                        />
                      </Box>

                      {/* Price Details */}
                      <Box mb={2}>
                        <Typography
                          variant="subtitle1"
                          sx={{ color: "#62646F", fontWeight: "bold", mb: -1 }}
                        >
                          Price Details
                        </Typography>
                        <TextField
                          margin="normal"
                          fullWidth
                          id="price"
                          name="price"
                          autoComplete="price"
                          inputRef={priceRef}
                          InputLabelProps={{ shrink: true }}
                          sx={{
                            "& .MuiInputBase-root": {
                              color: "#62646F", // Change input text color
                            },
                            mb: -1,
                          }}
                        />
                      </Box>

                      <Button
                        type="submit"
                        variant="contained"
                        color="primary"
                        onClick={handleUpdatedescription}
                        disabled={loading} // Disable button during loading
                        sx={{
                          mt: 3,
                          mb: 2,
                          p: "12px 12px",
                          position: "relative",
                          width: "250px",
                          boxShadow: "none",
                          textTransform: "none",
                        }} // Preserve button padding and size
                      >
                        {loading ? (
                          <Box sx={{ display: "flex", alignItems: "center" }}>
                            <CircularProgress
                              size={24}
                              sx={{ color: "inherit", mr: 1 }}
                            />
                            Saving
                          </Box>
                        ) : (
                          "Save Changes"
                        )}
                      </Button>
                    </Box>
                    
                    <Divider sx={{ my: 2 }} />
                    {/* Portfolio Showcase Section */}
                    <Box sx={{ backgroundColor: "white", borderRadius: 2 }}>
  <Typography component="h2" variant="h5" sx={{ fontWeight: "bold", mb: 1, mt: 3 }}>
    Portfolio Showcase
  </Typography>
  <Box sx={{ mb: 2 }}>
    <input
      type="file"
      accept="image/*"
      onChange={handleFileChange}
      style={{ display: "none" }}
      id="upload-images"
      multiple
    />
    <label htmlFor="upload-images">
      <Button
        variant="outlined"
        color="primary"
        component="span"
        sx={{ mt: 2, mr: 1, p: "8px 16px", textTransform: "none", borderRadius: "4px"}}
      >
        Add Images
      </Button>
    </label>
    <Button
      variant="contained"
      color="primary"
      onClick={handleImageUpload}
      disabled={loading || files.length === 0}
      sx={{ mt: 2, p: "8px 16px", boxShadow: "none", textTransform: "none", borderRadius: "4px" }}
    >
      Upload Images
    </Button>
  </Box>
  <Grid container spacing={2} sx={{ overflowY: "auto", maxHeight: "400px", mt: 2, }}>
    {portfolioImages.length > 0 &&
      portfolioImages.slice(1).map((imgURL, index) => (
        <Grid item xs={6} sm={3} key={index}>
          <Box
            sx={{
              position: "relative",
              paddingTop: "100%",
              overflow: "hidden",
              backgroundColor: "#f0f0f0",
            }}
          >
            <img
              src={imgURL}
              alt={`Portfolio ${index}`}
              style={{
                position: "absolute",
                top: "50%",
                left: "50%",
                width: "100%",
                height: "100%",
                transform: "translate(-50%, -50%)",
                objectFit: "cover",
                cursor: "pointer",
                borderRadius: "5px"
              }}
              onClick={() => handleOpenDialog(imgURL)}
            />
            <IconButton
              onClick={() => handleRemoveImage(imgURL)}
              sx={{
                position: "absolute",
                top: 8,
                right: 8,
                backgroundColor: "rgba(255, 255, 255, 0.7)",
                "&:hover": {
                  backgroundColor: "rgba(255, 255, 255, 1)",
                },
              }}
            >
              <DeleteIcon />
            </IconButton>
          </Box>
        </Grid>
      ))}
  </Grid>
</Box>

                  </>
                )}
              </CardContent>
            </Card>
          </Grid>
        </Grid>

        <Dialog
          open={openDialog}
          onClose={handleCloseDialog}
          maxWidth="md"
          fullWidth
        >
          <DialogTitle>
            View Image
            <IconButton
              edge="end"
              color="inherit"
              onClick={handleCloseDialog}
              aria-label="close"
              sx={{ position: "absolute", right: 8, top: 8, mr: 1 }}
            >
              <CloseIcon />
            </IconButton>
          </DialogTitle>
          <DialogContent>
            {viewImage && (
              <Box sx={{ display: "flex", justifyContent: "center" }}>
                <img
                  src={viewImage}
                  alt="View"
                  style={{ width: "100%", height: "auto" }}
                />
              </Box>
            )}
          </DialogContent>
          <DialogActions></DialogActions>
        </Dialog>
      </Container>
      <Footer />
    </>
  );
}

export default PhotographerDashboard;
