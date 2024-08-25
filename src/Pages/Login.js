// src/components/Login.js
import React, { useRef, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { doc, getDoc } from 'firebase/firestore';
import { auth, db } from '../firebase';
import { TextField, Button, Container, Typography, Box, Card, CardContent } from '@mui/material';
import Swal from 'sweetalert2';
import { Link } from 'react-router-dom';
import Navbar from '../Components/Navbar/Navbar';
import Footer from '../Components/Footer/Footer';
import logo from '../Assets/Logo2.png';
import { Link as LinkRouter } from 'react-router-dom';

function Login() {
  const emailRef = useRef();
  const passwordRef = useRef();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);

    try {
      const userCredential = await signInWithEmailAndPassword(auth, emailRef.current.value, passwordRef.current.value);
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.uid));
      const userData = userDoc.data();
      const role = userData.role;

      Swal.fire('Success', 'Logged in successfully!', 'success');
      navigate(`/${role}-dashboard`);
    } catch (error) {
      Swal.fire('Error', error.message, 'error');
    }

    setLoading(false);
  };

  return (
    <>
    <div>
      <nav className='navbar'>
        <div className='logo-head'>
          <img src={logo} alt="" className='logo'/>
          <div className='logo-text'>
            <h2>ShutterShare</h2>
            <p>Future Photography</p>
          </div>
          
        </div>
        
        <ul>
        <li><LinkRouter to="/" className='action'>Home</LinkRouter></li>
            <LinkRouter to="/login" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" color="primary" sx={{mr: 2, ml: 2, p: 1, width:'100px', border:'solid', borderWidth:2, '&:hover':{borderWidth:2}}}>
                Login
              </Button>
            </LinkRouter>
            <LinkRouter to="/signup" style={{ textDecoration: 'none' }}>
              <Button variant="outlined" color="primary" sx={{p: 1, width:'100px', border:'solid', borderWidth:2, '&:hover':{borderWidth:2}}}>
                Signup
              </Button>
            </LinkRouter>
        </ul>
      </nav>
    </div>
    <Container component="main" maxWidth="xs" sx={{
          display: 'flex',
          flexDirection: 'column',
          justifyContent: 'center',
          alignItems: 'center',
          minHeight: 'calc(100vh - 50px)', // Adjusts for navbar and footer height
        }}>
      <Card sx={{ mt: 8, p: 2, boxShadow: 3 }}>
        <CardContent>
          <Typography component="h1" variant="h5" sx={{ fontWeight: 'bold', mb: 2 }}>
            Log In
          </Typography>
          <Box component="form" onSubmit={handleSubmit} noValidate>
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
            <Button
              type="submit"
              fullWidth
              variant="contained"
              color="primary"
              disabled={loading}
              sx={{ mt: 3, mb: 2, p: '12px 12px' }}
            >
              Log In
            </Button>
          </Box>
          <Typography variant="body2" align="center" sx={{ mt: 2 }}>
            Create an account. <Link to="/signup" underline="none">Signup</Link>
          </Typography>
        </CardContent>
      </Card>


    </Container>
    <Footer/>

    
    </>
  );
}

export default Login;
