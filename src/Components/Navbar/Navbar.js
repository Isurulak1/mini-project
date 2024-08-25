import React from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { Link as LinkScroll } from 'react-scroll'
import './Navbar.css'
import logo from '../../Assets/Logo2.png'
import { Button } from '@mui/material'


const Navbar = () => {
  
  return (
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
            <li><LinkScroll to="Hero" spy={true} smooth={true} offset={-100} duration={500} className='action'>Home</LinkScroll></li>
            <li><LinkScroll to="About" spy={true} smooth={true} offset={-100} duration={500} className='action'>About</LinkScroll></li>
            <li><LinkScroll to="Feature" spy={true} smooth={true} offset={-100} duration={500} className='action'>Feature</LinkScroll></li>
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
  )
}

export default Navbar
