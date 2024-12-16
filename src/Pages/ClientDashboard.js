// src/components/ClientDashboard.js
import React, { useRef, useState, useEffect } from 'react';
import { useAuth } from '../context/AuthContext';
import { getDoc, doc, collection, query, where, getDocs, updateDoc, setDoc, addDoc, deleteDoc, onSnapshot } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { db, storage } from '../firebase';
import { TextField, Button, Container, Avatar, Typography, Box, Grid, Card, CardContent, IconButton, List, ListItem, ListItemAvatar, ListItemText, ListItemButton, Dialog, DialogTitle, DialogContent, DialogActions, Popover, Badge, Checkbox, CircularProgress, Divider } from '@mui/material';
import CloseIcon from '@mui/icons-material/Close';
import DeleteIcon from '@mui/icons-material/Delete';
import Swal from 'sweetalert2';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Link as LinkRouter } from 'react-router-dom';
import logo from '../Assets/Logo2.png';
import Footer from '../Components/Footer/Footer';

function ClientDashboard() {
  const { currentUser } = useAuth();
  const usernameRef = useRef();
  const [profilePicture, setProfilePicture] = useState("");
  const [loading, setLoading] = useState(false);
  const [file, setFile] = useState(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [searchResults, setSearchResults] = useState([]);
  const [allPhotographers, setAllPhotographers] = useState([]);
  const [selectedPhotographer, setSelectedPhotographer] = useState();
  const [contactedPhotographers, setContactedPhotographers] = useState([]);
  const [viewPhotographer, setViewPhotographer] = useState(null);
  const [openDialog, setOpenDialog] = useState(false);
  const [viewImage, setViewImage] = useState(""); // State for viewing an image
  const [openImageDialog, setOpenImageDialog] = useState(false); // State for opening the image dialog
  const [openBookingDialog, setOpenBookingDialog] = useState(false);
  const [currentPhotographer, setCurrentPhotographer] = useState(null);
  const [bookingStatus, setBookingStatus] = useState(""); // Pending or Accepted
  const [notifications, setNotifications] = useState([]);
  const [anchorEl, setAnchorEl] = useState(null);
  const [sharedImages, setSharedImages] = useState([]);
  const [open, setOpen] = useState(false);
  const [viewMode, setViewMode] = useState("search"); // 'search' or 'contactDetails'
  const [selectedContact, setSelectedContact] = useState(null);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedImage, setSelectedImage] = useState("");
  const [error, setError] = useState(null);

  // fetchData
  useEffect(() => {
    const fetchData = async () => {
      const userDoc = await getDoc(doc(db, "users", currentUser.uid));
      const userData = userDoc.data();
      usernameRef.current.value = userData.username;
      setProfilePicture(userData.profilePicture);

      const photographersQuery = query(
        collection(db, "users"),
        where("role", "==", "photographer")
      );
      const querySnapshot = await getDocs(photographersQuery);
      const photographers = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id,
      }));
      setAllPhotographers(photographers);

      // Fetch contacted photographers
      const contacts = userData.contacts || [];
      setContactedPhotographers(contacts);
    };

    fetchData();
  }, [currentUser]);

  // Fetch only photographer data from Firestore
  useEffect(() => {
    const fetchContactedPhotographers = async () => {
      setLoading(true);
      try {
        // Fetch the current user's document
        const userDocRef = doc(db, "users", currentUser.uid);
        const userDocSnapshot = await getDoc(userDocRef);
        const userData = userDocSnapshot.data();

        console.log("User Data:", userData); // Debugging line

        if (userData && Array.isArray(userData.contacts) && userData.contacts.length > 0) {
          const contacts = userData.contacts;

          console.log("Contacts Array:", contacts); // Debugging line

          // Fetch details for each contacted photographer
          const photographerDetails = await Promise.all(
            contacts.map(async (contact) => {
              console.log("Fetching details for contact:", contact); // Debugging line

              if (!contact.uid) {
                console.error("Contact object does not have a uid:", contact);
                return null;
              }

              const photographerDocRef = doc(db, "users", contact.uid);
              const photographerSnapshot = await getDoc(photographerDocRef);

              if (photographerSnapshot.exists()) {
                const photographerData = photographerSnapshot.data();
                return {
                  uid: photographerSnapshot.id,
                  username: photographerData.username,
                  email: photographerData.email,
                  role: photographerData.role,
                  status: photographerData.status,
                  profilePicture: photographerData.profilePicture || null,
                };
              } else {
                console.error("Photographer document does not exist:", contact.uid);
              }
              return null;
            })
          );

          // Filter out null values and update the state
          const validPhotographers = photographerDetails.filter((photographer) => photographer !== null);
          console.log("Fetched Photographers:", validPhotographers); // Debugging line
          setContactedPhotographers(validPhotographers);
        } else {
          console.warn("No contacts found for user or contacts array is empty.");
          setContactedPhotographers([]);
        }
      } catch (error) {
        console.error("Error fetching contacted photographers:", error);
        setError("Failed to fetch contacted photographer details. Please try again later.");
      }
      setLoading(false);
    };

    fetchContactedPhotographers();
  }, [currentUser.uid]);

  useEffect(() => {
    if (searchQuery.trim() === "") {
      setSearchResults(allPhotographers); // Show all photographers when search is empty
    } else {
      const filteredResults = allPhotographers.filter((photographer) =>
        photographer.username.toLowerCase().includes(searchQuery.toLowerCase())
      );

      setSearchResults(filteredResults);
    }
  }, [searchQuery, allPhotographers]);

  /* const handleSearch = async () => {
    if (!searchQuery) return;

    setLoading(true);

    try {
      const photographersQuery = query(
        collection(db, "users"),
        where("role", "==", "photographer")
      );
      const querySnapshot = await getDocs(photographersQuery);
      const results = querySnapshot.docs
        .map((doc) => doc.data())
        .filter((user) =>
          user.username.toLowerCase().includes(searchQuery.toLowerCase())
        );

      setSearchResults(results);
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }

    setLoading(false);
  }; */

  const handleCloseSearchResults = () => {
    setSearchQuery(""); // Clear the search input
    setSearchResults(allPhotographers); // Reset to show all photographers
  };

  useEffect(() => {
    const fetchData = async () => {
      const photographersQuery = query(
        collection(db, "users"),
        where("role", "==", "photographer")
      );
      const querySnapshot = await getDocs(photographersQuery);
      const photographers = querySnapshot.docs.map((doc) => ({
        ...doc.data(),
        uid: doc.id, // Ensure uid is included
      }));
      setAllPhotographers(photographers);
    };

    fetchData();
  }, []);

  // HandleFileChange
  const handleFileChange = (e) => {
    setFile(e.target.files[0]);
  };

  // Upload profile picture
  const handleUpload = async () => {
    if (!file) return;

    setLoading(true);

    try {
      const fileRef = ref(
        storage,
        `profilePictures/${currentUser.uid}/${file.name}`
      );
      await uploadBytes(fileRef, file);
      const downloadURL = await getDownloadURL(fileRef);

      await updateDoc(doc(db, "users", currentUser.uid), {
        profilePicture: downloadURL,
      });

      setProfilePicture(downloadURL);
      Swal.fire("Success", "Profile picture updated!", "success");
    } catch (error) {
      Swal.fire(
        "Error",
        `Failed to upload profile picture: ${error.message}`,
        "error"
      );
    } finally {
      setLoading(false); // Ensure loading state is reset even if an error occurs
    }
  };

  // Check username exists
  const checkUsernameExists = async (username) => {
    const userCollection = collection(db, "users");
    const q = query(userCollection, where("username", "==", username));
    const userSnapshot = await getDocs(q);
    return !userSnapshot.empty;
  };

  // Update user
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

      // Check if the username already exists
      const usernameExists = await checkUsernameExists(newUsername);
      if (usernameExists) {
        Swal.fire("Error", "Username already taken", "error");
        setLoading(false);
        return;
      }

      await updateDoc(doc(db, "users", currentUser.uid), {
        username: newUsername,
      });

      Swal.fire("Success", "Profile updated!", "success");
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }

    setLoading(false);
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
      console.error("Photographer UID is missing");
      return;
    }

    const isAlreadyContacted = contactedPhotographers.find(
      (contact) => contact.username === photographer.username
    );

    if (isAlreadyContacted) {
      // Set the contact view and photographer directly if already contacted
      setSelectedContact(isAlreadyContacted);
      setViewMode("contactDetails");
      return;
    }

    Swal.fire({
      title: "Are you sure?",
      text: `Do you want to contact ${photographer.username}?`,
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#3085d6",
      cancelButtonColor: "#d33",
      confirmButtonText: "Yes, contact them!",
      cancelButtonText: "No, cancel",
    }).then(async (result) => {
      if (result.isConfirmed) {
        const updatedContacts = [
          ...contactedPhotographers,
          { ...photographer, status: "pending" },
        ];
        setContactedPhotographers(updatedContacts);

        // Generate a unique bookingId
        const bookingId = `${currentUser.uid}_${
          photographer.uid
        }_${new Date().getTime()}`;

        const bookingRequest = {
          bookingId: bookingId,
          status: "pending",
          photographerId: photographer.uid,
          clientId: currentUser.uid,
          timestamp: new Date(),
          date: "", // Add booking date
          time: "", // Add booking time
          notes: "", // Add any additional notes
        };

        try {
          // Fetch current user details from Firestore if not available directly
          let username = currentUser.username;
          if (!username) {
            const userDoc = await getDoc(doc(db, "users", currentUser.uid));
            username = userDoc.exists() ? userDoc.data().username : "a client";
          }

          // Update the contacts array in the main user document
          await updateDoc(doc(db, "users", currentUser.uid), {
            contacts: updatedContacts,
          });

          // Create a booking document in the client's subcollection
          const clientBookingRef = doc(
            db,
            `users/${currentUser.uid}/bookings/${bookingId}`
          );
          await setDoc(clientBookingRef, bookingRequest);

          // Create a booking document in the photographer's subcollection
          const photographerBookingRef = doc(
            db,
            `users/${photographer.uid}/bookings/${bookingId}`
          );
          await setDoc(photographerBookingRef, bookingRequest);

          // Add a notification for the client
          const clientNotificationRef = doc(
            db,
            `users/${currentUser.uid}/notifications/${bookingId}`
          );
          await setDoc(clientNotificationRef, {
            type: "booking",
            message: `Booking request pending with ${photographer.username}`,
            status: "pending",
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId,
          });

          // Add a notification for the photographer
          const photographerNotificationRef = doc(
            db,
            `users/${photographer.uid}/notifications/${bookingId}`
          );
          await setDoc(photographerNotificationRef, {
            type: "booking",
            message: `New booking request from ${username}`,
            status: "pending",
            timestamp: new Date(),
            userId: currentUser.uid,
            bookingId: bookingId,
          });

          Swal.fire("Success", "Booking request sent!", "success");
          setSelectedContact({ ...photographer, status: "pending" });
          setViewMode("contactDetails");

          // Listen for booking status updates in real-time
          const unsubscribe = onSnapshot(
            photographerBookingRef,
            async (docSnapshot) => {
              if (docSnapshot.exists()) {
                const updatedBooking = docSnapshot.data();
                if (updatedBooking.status === "accepted") {
                  // Update the client's notification when the status is "accepted"
                  const clientNotificationUpdateRef = doc(
                    db,
                    `users/${currentUser.uid}/notifications/${bookingId}`
                  );
                  await updateDoc(clientNotificationUpdateRef, {
                    message: `Booking accepted by ${photographer.username}`,
                    status: "accepted",
                    timestamp: new Date(),
                  });

                  // Optionally: Refresh notifications in state for real-time updates
                  fetchNotifications();
                }
              }
            }
          );

          // Cleanup listener when done
          return () => unsubscribe();
        } catch (error) {
          Swal.fire("Error", error.message, "error");
        }
      }
    });
  };

  const handleContactClick = async (photographer) => {
    setSelectedContact(photographer);
    setViewMode("contactDetails");

    setLoading(true);

    try {
      const images = await fetchSharedImagesByPhotographer(photographer.id);
      setSharedImages(images);
    } catch (error) {
      console.error("Error fetching images:", error);
    } finally {
      setLoading(false);
    }
  };

  const handleBack = () => {
    setSelectedContact(null);
    setViewMode("search");
  };

  const handleDeleteContact = async (photographer) => {
    try {
      // Show confirmation dialog
      const result = await Swal.fire({
        title: "Are you sure?",
        text: `Do you want to delete ${photographer.username} from your contacts?`,
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
        cancelButtonText: "No, cancel",
      });

      if (result.isConfirmed) {
        // Update local state
        const updatedContacts = contactedPhotographers.filter(
          (contact) => contact.username !== photographer.username
        );
        setContactedPhotographers(updatedContacts);

        // Save updated contacts to Firestore
        await updateDoc(doc(db, "users", currentUser.uid), {
          contacts: updatedContacts,
        });

        Swal.fire(
          "Deleted!",
          `${photographer.username} has been removed from your contacts.`,
          "success"
        );
      }
    } catch (error) {
      console.error("Failed to delete contact:", error);
      Swal.fire("Error", `Failed to delete contact: ${error.message}`, "error");
    }
  };

  const handleDelete = async (notificationId) => {
    try {
      await deleteDoc(
        doc(db, `users/${currentUser.uid}/notifications`, notificationId)
      );
      setNotifications((prevNotifications) =>
        prevNotifications.filter(
          (notification) => notification.id !== notificationId
        )
      );
    } catch (error) {
      console.error("Error deleting notification:", error);
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
      const notificationsRef = collection(
        db,
        `users/${currentUser.uid}/notifications`
      );
      const notificationsQuery = query(
        notificationsRef,
        where("viewed", "==", false)
      );
      const querySnapshot = await getDocs(notificationsQuery);

      const updates = querySnapshot.docs.map((doc) => {
        return updateDoc(doc.ref, { viewed: true });
      });

      await Promise.all(updates);
      setNotifications((prevNotifications) =>
        prevNotifications.map((notification) => ({
          ...notification,
          viewed: true,
        }))
      );
    } catch (error) {
      console.error("Error marking notifications as viewed:", error);
    }
  };

  // fetchBookingStatuses
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
            console.error("No such photographer found!");
            return "Unknown Photographer";
          }
        } catch (error) {
          console.error("Error fetching photographer username:", error);
          return "Unknown Photographer";
        }
      };

      const bookingStatuses = await Promise.all(
        querySnapshot.docs.map(async (doc) => {
          const booking = doc.data();
          const photographerUsername = await fetchPhotographerUsername(
            booking.photographerId
          );

          let message = "";

          if (booking.status === "accepted") {
            message = `Booking accepted by ${photographerUsername}`;
          } else if (booking.status === "pending") {
            message = `Booking request pending with ${photographerUsername}`;
          }

          const notification = {
            id: doc.id,
            message: message,
            timestamp: booking.timestamp,
            viewed: false, // Add this field
          };

          // Save the notification to Firestore under `notifications` collection
          const notificationsRef = doc(
            db,
            `users/${currentUser.uid}/notifications/${doc.id}`
          );
          await setDoc(notificationsRef, notification);

          return notification;
        })
      );

      // Set notifications to state
      setNotifications(bookingStatuses);
    } catch (error) {
      console.error("Error fetching booking statuses:", error);
    }
  };

  useEffect(() => {
    fetchBookingStatuses();
  }, [currentUser]);

  // fetchSharedImages
  useEffect(() => {
    const fetchSharedImages = async () => {
      try {
        // Check if selectedPhotographer and currentUser are defined
        if (
          !selectedPhotographer ||
          !selectedPhotographer.photographerId ||
          !currentUser ||
          !currentUser.uid
        ) {
          console.log("Required data is missing");
          return;
        }

        // Reference to the shared document in Firestore
        const clientSharingRef = doc(
          db,
          `users/${currentUser.uid}/sharing/${selectedPhotographer.photographerId}`
        );
        const docSnap = await getDoc(clientSharingRef);

        if (docSnap.exists()) {
          // Extract the images from the document data
          const sharedData = docSnap.data();
          if (sharedData.images) {
            setSharedImages(sharedData.images); // Set the images in state
          }
        } else {
          console.log("No shared images found.");
        }
      } catch (error) {
        console.error("Error fetching shared images:", error);
      }
    };

    fetchSharedImages();
  }, [selectedPhotographer, currentUser]);

  // fetchNotifications
  const fetchNotifications = async () => {
    const notificationsRef = collection(
      db,
      `users/${currentUser.uid}/notifications`
    );
    const notificationsQuery = query(notificationsRef);

    onSnapshot(notificationsQuery, (snapshot) => {
      const notifications = snapshot.docs.map((doc) => ({
        id: doc.id,
        ...doc.data(),
      }));

      setNotifications(notifications);
    });
  };

  useEffect(() => {
    if (currentUser) {
      fetchNotifications();
    }
  }, [currentUser]);

  // fetchSharedImages
  useEffect(() => {
    if (!selectedContact || !currentUser) return;

    const fetchSharedImages = async () => {
      try {
        // Reference the specific sharing document
        const sharingDocRef = doc(
          db,
          `users/${currentUser.uid}/sharing/${selectedContact.uid}`
        );
        const docSnapshot = await getDoc(sharingDocRef);

        if (docSnapshot.exists()) {
          const imagesData = docSnapshot.data().images;

          if (imagesData) {
            // Extract image URLs and filter out duplicates using a Set
            const imageUrls = Array.from(
              new Set(Object.values(imagesData).map((image) => image.url))
            );

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
    setSelectedImages(
      (prevSelected) =>
        prevSelected.includes(url)
          ? prevSelected.filter((image) => image !== url) // Unselect if already selected
          : [...prevSelected, url] // Add to selected images
    );
  };

  const handleSendImagesToPhotographer = async () => {
    if (selectedImages.length === 0) {
      Swal.fire("Warning", "No images selected.", "warning");
      return;
    }

    setLoading(true); // Start loading state

    try {
      const photographerId = selectedContact.uid; // Photographer's ID
      const clientId = currentUser.uid; // Client's ID
      const timestamp = new Date().toISOString();

      // Reference the documents for both the photographer and client
      const photographerReceivedImagesRef = doc(
        db,
        `users/${photographerId}/receivedImages/${clientId}`
      );
      const clientReceivedImagesRef = doc(
        db,
        `users/${clientId}/receivedImages/${photographerId}`
      );

      // Fetch the current images for the photographer
      const photographerDocSnapshot = await getDoc(
        photographerReceivedImagesRef
      );
      const photographerImagesData = photographerDocSnapshot.exists()
        ? photographerDocSnapshot.data().images || {}
        : {};

      // Fetch the current images for the client
      const clientDocSnapshot = await getDoc(clientReceivedImagesRef);
      const clientImagesData = clientDocSnapshot.exists()
        ? clientDocSnapshot.data().images || {}
        : {};

      // Convert existing images to a Set for easy duplicate checking
      const existingPhotographerUrls = new Set(
        Object.values(photographerImagesData).map((img) => img.url)
      );
      const existingClientUrls = new Set(
        Object.values(clientImagesData).map((img) => img.url)
      );

      selectedImages.forEach((url) => {
        if (
          !existingPhotographerUrls.has(url) &&
          !existingClientUrls.has(url)
        ) {
          const imageName = url.split("/").pop(); // Extract file name from URL
          const imageData = {
            fileName: imageName,
            url: url,
            timestamp: timestamp,
          };

          // Add the image to both photographer and client documents
          photographerImagesData[Object.keys(photographerImagesData).length] =
            imageData;
          clientImagesData[Object.keys(clientImagesData).length] = imageData;

          // Update the existing URL sets to avoid future duplicates
          existingPhotographerUrls.add(url);
          existingClientUrls.add(url);
        }
      });

      // Save the updated images to Firestore
      await Promise.all([
        setDoc(
          photographerReceivedImagesRef,
          { images: photographerImagesData },
          { merge: true }
        ),
        setDoc(
          clientReceivedImagesRef,
          { images: clientImagesData },
          { merge: true }
        ),
      ]);

      Swal.fire("Success", "Selected images have been sent!", "success");
      setSelectedImages([]); // Clear the selection after sending
    } catch (error) {
      console.error("Error sending images:", error);
      Swal.fire("Error", `Failed to send images: ${error.message}`, "error");
    } finally {
      setLoading(false); // Ensure loading state is reset even if an error occurs
    }
  };

  const fetchSharedImagesByPhotographer = async (photographerId) => {
    try {
      const imagesRef = collection(db, "images");
      const q = query(imagesRef, where("photographerId", "==", photographerId));
      const querySnapshot = await getDocs(q);

      const images = querySnapshot.docs.map((doc) => doc.data());
      return images;
    } catch (error) {
      console.error("Error fetching images:", error);
      return [];
    }
  };

  return (
    <>
      {/*======================================  Navbar section  ======================================*/}
      <div className="nav-section" style={{ borderBottom: "1px solid #DADBDD" }}>
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
              gap: "0px",
            }}
          >
            <li>
              <Box sx={{ display: "flex", justifyContent: "flex-end" }}>
                <IconButton color="primary" onClick={handleClick}>
                  <NotificationsIcon />
                </IconButton>
              </Box>

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
                    border: "1px solid #e0e0e0", // Light border
                    borderRadius: "4px", // Rounded corners
                  },
                }}
              >
                <Box
                  sx={{ p: 2, width: 500, maxHeight: 300, overflowY: "auto" }}
                >
                  {/* Notifications Title with Icon */}
                  <Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
                    <NotificationsIcon sx={{ mr: 1, color: "#62646F" }} />
                    <Typography variant="h6" sx={{ color: "#62646F" }}>
                      Notifications
                    </Typography>
                  </Box>

                  {/* Divider after the title */}
                  <Divider sx={{ mb: 2 }} />

                  {/* Notification List */}
                  {notifications.length === 0 ? (
                    <Typography sx={{ color: "#62646F" }}>
                      No notifications
                    </Typography>
                  ) : (
                    <List>
                      {notifications.map((notification) => (
                        <React.Fragment key={notification.id}>
                          <ListItem
                            sx={{ display: "flex", alignItems: "center" }}
                          >
                            <ListItemText
                              primary={notification.message}
                              secondary={
                                notification.timestamp
                                  ? new Date(
                                      notification.timestamp.seconds * 1000
                                    ).toLocaleString()
                                  : ""
                              }
                            />
                            <IconButton
                              color="error"
                              onClick={() => handleDelete(notification.id)}
                            >
                              <DeleteIcon />
                            </IconButton>
                          </ListItem>
                          <Divider sx={{ my: 1 }} />
                        </React.Fragment>
                      ))}
                    </List>
                  )}
                </Box>
              </Popover>
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

      <Container component="main"
        maxWidth="xl"
        sx={{ backgroundColor: "#F5F5F5", p: 1 }}>
        <Grid container justifyContent="center" spacing={4} sx={{ mt: 0 }}>
        <Grid item xs={12} md={3} sx={{ flexBasis: "25%" }}>
  {/* Profile Details Card */}
  <Card
    sx={{
      p: 2,
      boxShadow: "none",
      mb: 4,
      border: "1px solid #DADBDD",
    }}
  >
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
          }}
        />
        <Button
          type="submit"
          fullWidth
          variant="contained"
          color="primary"
          disabled={loading} // Disable button during loading
          sx={{ mt: 3, mb: 2, p: "12px 12px", position: "relative", textTransform: "none" }} // Preserve button padding and size
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
        />
        <label htmlFor="upload-file">
          <Button
            variant="outlined"
            color="primary"
            component="span"
            fullWidth
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
          disabled={loading || !file} // Disable button if loading or no file is selected
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
    </CardContent>
  </Card>

  {/* Messages Section Card */}
  <Card
  sx={{
    p: 2,
    boxShadow: "none",
    mb: 4,
    border: "1px solid #DADBDD",
  }}
>
  <CardContent>
    <Typography
      component="h2"
      variant="h5"
      sx={{ fontWeight: "bold", mb: 2 }}
    >
      Contacts
    </Typography>

    <Divider />

    <List>
      {contactedPhotographers.map((photographer, index) => (
        <React.Fragment key={index}>
          <ListItem
            sx={{ width: "100%", px: 0, py: 1 }} // Ensure each ListItem takes full width
            secondaryAction={
              <IconButton
                edge="end"
                aria-label="delete"
                onClick={() => handleDeleteContact(photographer)}
              >
                <DeleteIcon />
              </IconButton>
            }
          >
            <ListItemButton
              onClick={() => handleContactClick(photographer)}
              sx={{ width: "100%" }}
            >
              <ListItemAvatar>
                <Avatar
                  src={photographer.profilePicture}
                  alt={photographer.username}
                />
              </ListItemAvatar>
              <ListItemText primary={photographer.username} />
            </ListItemButton>
          </ListItem>

          {/* Divider between each contact except the last one */}
          {index < contactedPhotographers.length - 1 && <Divider />}
        </React.Fragment>
      ))}
    </List>
  </CardContent>
</Card>

</Grid>
          <Grid item xs={12} md={8}>
            {viewMode === "search" && (
              <Card sx={{ p: 2, boxShadow: "none", mb: 4, border: "1px solid #DADBDD" }}>
                <CardContent>
                  <Typography
                    component="h2"
                    variant="h5"
                    sx={{ fontWeight: "bold", mb: 2 }}
                  >
                    Search Photographers
                  </Typography>
                  <Box sx={{ mb: 2, display: "flex", alignItems: "center" }}>
                    <TextField
                      fullWidth
                      id="search"
                      label="Search by Username"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                    />
                    {searchQuery && (
                      <IconButton
                        color="secondary"
                        onClick={handleCloseSearchResults}
                      >
                        <CloseIcon />
                      </IconButton>
                    )}
                  </Box>
                  
                  <Divider sx={{my: 4}}></Divider>

                  {/* Displaying search results or message */}
                  <Grid container spacing={2}>
                    {searchResults.length > 0
                      ? searchResults.map((photographer, index) => (
                          <Grid item xs={12} sm={6} md={4} key={index}>
                            <Card sx={{ boxShadow: 1, border: "1px solid #DADBDD" }}>
                              <CardContent>
                                <Avatar
                                  src={photographer.profilePicture}
                                  alt={photographer.username}
                                  sx={{
                                    width: 80,
                                    height: 80,
                                    margin: "0 auto",
                                  }}
                                />
                                <Typography
                                  variant="h6"
                                  component="div"
                                  sx={{ textAlign: "center", mt: 1 }}
                                >
                                  {photographer.username}
                                </Typography>
                                <Typography
                                  variant="body2"
                                  color="textSecondary"
                                  sx={{ textAlign: "center", mt: 1 }}
                                >
                                  {photographer.shortDescription}
                                </Typography>
                                <Typography
                                  color="text.secondary"
                                  sx={{
                                    textAlign: "center",
                                    color: photographer.isAvailable
                                      ? "green"
                                      : "red",
                                  }}
                                >
                                  {photographer.isAvailable
                                    ? "Available"
                                    : "Not Available"}
                                </Typography>
                                <Button
                                  variant="contained"
                                  color="primary"
                                  fullWidth
                                  sx={{ mt: 2, p: "12px 12px" }}
                                  onClick={() => handleContact(photographer)}
                                >
                                  Contact
                                </Button>
                                <Button
                                  variant="outlined"
                                  color="primary"
                                  fullWidth
                                  sx={{ mt: 1, p: "12px 12px" }}
                                  onClick={() =>
                                    handleViewDetails(photographer)
                                  }
                                >
                                  View Details
                                </Button>
                              </CardContent>
                            </Card>
                          </Grid>
                        ))
                      : searchQuery && (
                          <Grid item xs={12}>
                            <Typography
                              variant="h6"
                              sx={{ textAlign: "center", mt: 2, color: "red" }}
                            >
                              No matching results found.
                            </Typography>
                          </Grid>
                        )}
                  </Grid>
                </CardContent>
              </Card>
            )}

            {viewMode === "contactDetails" && selectedContact && (
              <Card sx={{ p: 2, boxShadow: "none", mb: 4, border: "1px solid #DADBDD" }}>
                <CardContent>
                  <Box
                    sx={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                    }}
                  >
                    <Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: "bold" }}
                    >
                      Photographer Information
                    </Typography>
                   
                    <Button
                      variant="outlined"
                      color="primary"
                      onClick={handleBack}
                    >
                      Back
                    </Button>
                    
                  </Box>
                  <Box sx={{ mt: 2 }}>
                  <Typography
      component="p"
      variant="body1"
      sx={{ fontWeight: "bold", color: "#62646F" }}
    >
      <span style={{ color: "black" }}>Name: </span>
      {selectedContact.username}
      <br />
      <span style={{ color: "black" }}>Email Address: </span>
      {selectedContact.email}
    </Typography>
<Divider sx={{my: 2}}></Divider>
<Typography
                      component="h2"
                      variant="h5"
                      sx={{ fontWeight: "bold" }}
                    >
                      Images sent by the Photographer
                    </Typography>
                    <Button
                      variant="contained"
                      color="primary"
                      onClick={handleSendImagesToPhotographer}
                      disabled={loading || selectedImages.length === 0} // Disable button during loading or if no images are selected
                      sx={{
                        mt: 2,
                        p: "8px 16px",
                        position: "relative",
                        width: "250px",
                        boxShadow: 0,
                        textTransform: "none"
                      }} // Preserve button padding and size
                    >
                      {loading ? (
                        <Box sx={{ display: "flex", alignItems: "center" }}>
                          <CircularProgress
                            size={24}
                            sx={{ color: "inherit", mr: 1 }}
                          />
                          Sending...
                        </Box>
                      ) : (
                        "Send Selected Images"
                      )}
                    </Button>

                    <Grid container spacing={2}>
                      {sharedImages.map((image, index) => (
                        <Grid item xs={12} sm={6} md={4} key={index}>
                          <img
                            src={image.url}
                            alt={image.fileName}
                            style={{
                              width: "100%",
                              height: "auto",
                              borderRadius: "8px",
                            }}
                          />
                        </Grid>
                      ))}
                    </Grid>
                    <Box
                      sx={{
                        maxHeight: "300px",
                        overflowY: "auto",
                        border: "1px solid #ccc",
                        p: 2,
                        borderRadius: 2,
                        mt: sharedImages.length > 0 ? 0 : 4,
                      }}
                    >
                      <Grid container spacing={2}>
                        {sharedImages.length > 0 ? (
                          sharedImages.map((url, index) => (
                            <Grid
                              item
                              xs={12}
                              sm={6}
                              md={3}
                              key={index}
                              sx={{ position: "relative" }}
                            >
                              <Box
                                sx={{
                                  width: "100%",
                                  height: 0,
                                  paddingTop: "100%",
                                  position: "relative",
                                  overflow: "hidden",
                                  borderRadius: 1,
                                }}
                              >
                                <img
                                  src={url}
                                  alt={`Shared Image ${index}`}
                                  style={{
                                    position: "absolute",
                                    top: 0,
                                    left: 0,
                                    width: "100%",
                                    height: "100%",
                                    objectFit: "cover",
                                    borderRadius: "5px",
                                    cursor: "pointer",
                                  }}
                                  onClick={() => handleImageClick(url)}
                                />
                                <Checkbox
                                  checked={selectedImages.includes(url)}
                                  onChange={() => handleImageSelect(url)}
                                  sx={{
                                    position: "absolute",
                                    top: 8,
                                    right: 8,
                                    borderRadius: "50%",
                                    padding: "4px",
                                    zIndex: 1,
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

      <Footer />

      {/* Photographer Viewer Dialog */}
      <Dialog
        open={openDialog}
        onClose={handleCloseDialog}
        maxWidth="md"
        fullWidth
        PaperProps={{
          sx: {
            borderRadius: "8px", // Set the border radius here
          },
        }}
      >
        <DialogTitle>
          Photographer Information
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
          {viewPhotographer && (
            <>
              <Avatar
                src={viewPhotographer.profilePicture}
                alt={viewPhotographer.username}
                sx={{ width: 100, height: 100, margin: "0 auto" }}
              />
              <Typography
                variant="h6"
                component="div"
                sx={{ textAlign: "center", mt: 1 }}
              >
                {viewPhotographer.username}
              </Typography>
              <Typography
                variant="body2"
                color="textSecondary"
                sx={{ textAlign: "center", mt: 1 }}
              >
                {viewPhotographer.shortDescription}
              </Typography>
              <Typography
                variant="body1"
                color="textSecondary"
                align="center"
                sx={{ mt: 2 }}
              >
                {viewPhotographer?.price
                  ? `Price: $${viewPhotographer?.price}`
                  : "Price not available"}
              </Typography>

              {/* Detailed Description Section with Border */}
              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: 2,
                  mt: 3,
                }}
              >
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  Description
                </Typography>
                <Typography variant="body1" color="textPrimary" sx={{ mt: 2 }}>
  {(viewPhotographer.detailedDescription || "")
    .split("\n")
    .map((line, index) => (
      <span key={index}>
        {line}
        <br />
      </span>
    ))}
</Typography>

              </Box>

              {/* Portfolio Section with Border and Scroll */}
              <Box
                sx={{
                  border: "1px solid #ccc",
                  borderRadius: "8px",
                  padding: 2,
                  mt: 4,
                }}
              >
                <Typography
                  component="h2"
                  variant="h6"
                  sx={{ fontWeight: "bold", mb: 2 }}
                >
                  Portfolio
                </Typography>
                <Box sx={{ maxHeight: 400, overflowY: "auto" }}>
                  {" "}
                  {/* Set the maximum height and enable scrolling */}
                  <Grid container spacing={2}>
                    {viewPhotographer.portfolioImages &&
                    viewPhotographer.portfolioImages.length > 0 ? (
                      viewPhotographer.portfolioImages
                        .slice(1)
                        .map((image, index) => (
                          <Grid item xs={6} sm={3} key={index}>
                            <Box
                              component="img"
                              src={image}
                              alt={`Portfolio Image ${index}`}
                              sx={{
                                width: "100%",
                                height: "200px",
                                objectFit: "cover",
                                cursor: "pointer",
                                borderRadius: "5px",
                              }}
                              onClick={() => handleImageClick(image)}
                            />
                          </Grid>
                        ))
                    ) : (
                      <Typography sx={{ mt: 2, ml: 2 }}>
                        No portfolio images.
                      </Typography>
                    )}
                  </Grid>
                </Box>
              </Box>
            </>
          )}
        </DialogContent>
        <Box
          sx={{ padding: "5px", width: "100%", backgroundColor: "#1976D2" }}
        />
      </Dialog>

      {/* Image Viewer Dialog */}
      <Dialog
        open={openImageDialog}
        onClose={handleCloseImageDialog}
        maxWidth="md"
        fullWidth
      >
        <DialogTitle>
          View Image
          <IconButton
            edge="end"
            color="inherit"
            onClick={handleCloseImageDialog}
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
                alt="Portfolio"
                style={{ width: "100%", height: "auto" }}
              />
            </Box>
          )}
        </DialogContent>
        <DialogActions></DialogActions>
      </Dialog>
    </>
  );
}

export default ClientDashboard;
