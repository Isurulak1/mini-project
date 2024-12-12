// src/components/Signup.js
import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc, collection, query, where, getDocs } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TextField, Button, Container, Typography, Box, Card, CardContent, FormControl, Select, MenuItem, Grid, InputLabel } from '@mui/material';
import Swal from 'sweetalert2';
import { Link as LinkRouter } from 'react-router-dom';
import logo from '../Assets/Logo2.png';
import Footer from '../Components/Footer/Footer';


function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef();
  const passwordRef = useRef();
  const usernameRef = useRef();
  const [role, setRole] = useState("client");
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  // Check username already exists
  const checkUsernameExists = async (username) => {
    const userCollection = collection(db, "users");
    const q = query(userCollection, where("username", "==", username));
    const userSnapshot = await getDocs(q);
    return !userSnapshot.empty;
  };

  // Signup
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !usernameRef.current.value ||
      !emailRef.current.value ||
      !passwordRef.current.value ||
      !role
    ) {
      Swal.fire("Error", "Please fill all the details", "error");
      return;
    }

    // Check if the username already exists
    const usernameExists = await checkUsernameExists(usernameRef.current.value);
    if (usernameExists) {
      Swal.fire("Error", "Username already taken", "error");
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        emailRef.current.value,
        passwordRef.current.value
      );
      await setDoc(doc(db, "users", userCredential.user.uid), {
        username: usernameRef.current.value,
        email: emailRef.current.value,
        profilePicture: "",
        role: role,
      });

      Swal.fire("Success", "Account created successfully!", "success");
      navigate(`/${role}-dashboard`); // Navigate to client-dashboard or photographer-dashboard based on role
    } catch (error) {
      Swal.fire("Error", error.message, "error");
    }

    setLoading(false);
  };

  return (
    <>
      <div>
        <nav className="navbar">
          <div className="logo-head">
            <img src={logo} alt="" className="logo" />
            <div className="logo-text">
              <h2>ShutterShare</h2>
              <p>Future Photography</p>
            </div>
          </div>
          <ul>
            <li>
              <LinkRouter to="/" className="action">
                Home
              </LinkRouter>
            </li>
            <LinkRouter to="/login" style={{ textDecoration: "none" }}>
              <Button
                variant="outlined"
                color="primary"
                sx={{
                  mr: 2,
                  ml: 2,
                  p: 1,
                  width: "100px",
                  border: "solid",
                  borderWidth: 2,
                  "&:hover": { borderWidth: 2 },
                }}
              >
                Login
              </Button>
            </LinkRouter>
            <LinkRouter to="/signup" style={{ textDecoration: "none" }}>
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
                Signup
              </Button>
            </LinkRouter>
          </ul>
        </nav>
      </div>
      <Container
        component="main"
        maxWidth="xs"
        sx={{
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          minHeight: "calc(100vh - 50px)",
        }}
      >
        <Card sx={{ mt: 8, p: 2, boxShadow: 3, width: "600px" }}>
          <CardContent>
            <Typography
              component="h1"
              variant="h5"
              sx={{ fontWeight: "bold", mb: 2 }}
            >
              Sign Up
            </Typography>
            <Box component="form" onSubmit={handleSubmit} noValidate>
              <Grid container spacing={2}>
                <Grid item xs={12} sm={6}>
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
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    id="email"
                    label="Email Address"
                    name="email"
                    autoComplete="email"
                    inputRef={emailRef}
                  />
                </Grid>
                <Grid item xs={12} sm={6}>
                  <TextField
                    margin="normal"
                    required
                    fullWidth
                    name="password"
                    label="Password"
                    type="password"
                    id="password"
                    autoComplete="current-password"
                    inputRef={passwordRef}
                  />
                  <FormControl fullWidth margin="normal">
                    <InputLabel required>Select Role</InputLabel>
                    <Select
                      label="Select Role"
                      value={role}
                      required
                      onChange={handleRoleChange}
                      displayEmpty
                      inputProps={{ "aria-label": "Role" }}
                    >
                      <MenuItem value="client">Client</MenuItem>
                      <MenuItem value="photographer">Photographer</MenuItem>
                    </Select>
                  </FormControl>
                </Grid>
              </Grid>
              <Box>
                <Button
                  type="submit"
                  fullWidth
                  variant="contained"
                  color="primary"
                  disabled={loading}
                  sx={{ mt: 3, mb: 2, p: "12px 12px" }}
                >
                  Sign Up
                </Button>
              </Box>
            </Box>
            <Typography variant="body2" align="center" sx={{ mt: 2 }}>
              Already have an account?{" "}
              <Link to="/login" underline="none">
                Log In
              </Link>
            </Typography>
          </CardContent>
        </Card>
      </Container>
      <Footer />
    </>
  );
}

export default Signup;
