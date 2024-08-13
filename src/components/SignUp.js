// src/components/Signup.js
import React, { useRef, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { createUserWithEmailAndPassword } from 'firebase/auth';
import { doc, setDoc } from 'firebase/firestore';
import { db, auth } from '../firebase';
import { TextField, Button, Container, Typography, Box, Card, CardContent, FormControl, Select, MenuItem } from '@mui/material';
import Swal from 'sweetalert2';

function Signup() {
  const { signup } = useAuth();
  const navigate = useNavigate();
  const emailRef = useRef();
  const passwordRef = useRef();
  const usernameRef = useRef();
  const [role, setRole] = useState('client');
  const [loading, setLoading] = useState(false);

  const handleRoleChange = (event) => {
    setRole(event.target.value);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (
      !usernameRef.current.value ||
      !emailRef.current.value ||
      !passwordRef.current.value ||
      !role
    ) {
      Swal.fire('Error', 'Please fill all the details', 'error');
      return;
    }

    setLoading(true);

    try {
      const userCredential = await createUserWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value);
      await setDoc(doc(db, 'users', userCredential.user.uid), {
        username: usernameRef.current.value,
        email: emailRef.current.value,
        profilePicture: '',
        role: role
      });

      Swal.fire('Success', 'Account created successfully!', 'success');
      navigate(`/${role}-dashboard`); // Navigate to client-dashboard or photographer-dashboard based on role
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }

    setLoading(false);
  };

  return (
    <Container component="main" maxWidth="xs">
      <Card sx={{ mt: 8, p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Sign Up
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
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
            <FormControl fullWidth sx={{ mt: 3 }}>
              <Typography variant="subtitle1" gutterBottom>
                Select your role
              </Typography>
              <Select
                value={role}
                onChange={handleRoleChange}
                displayEmpty
                inputProps={{ 'aria-label': 'Role' }}
              >
                <MenuItem value="client">Client</MenuItem>
                <MenuItem value="photographer">Photographer</MenuItem>
              </Select>
            </FormControl>
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, p: '12px 12px' }}
            >
              Sign Up
            </Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Already have an account? <Link to="/login" underline="none">Log In</Link>
          </Typography>
        </CardContent>
      </Card>
    </Container>
  );
}

export default Signup;
