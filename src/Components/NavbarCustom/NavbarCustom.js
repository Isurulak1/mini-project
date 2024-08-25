import React from 'react'
import { Link as LinkRouter } from 'react-router-dom'
import { Link as LinkScroll } from 'react-scroll'
import './NavbarCustom.css'
import logo from '../../Assets/Logo2.png'
import profile from '../../Assets/Profile.png'


const NavbarCustom = () => {
  return (
    <div>
      <nav className='navbar-custom'>
        <div className='logo-head'>
          <img src={logo} alt="" className='logo'/>
          <div className='logo-text'>
            <h2>ShutterShare</h2>
            <p>Future Photography</p>
          </div>
          
        </div>
        
        
        <ul>
            <li><LinkScroll to="Hero" spy={true} smooth={true} offset={-100} duration={500} className='action'>Home</LinkScroll></li>
            <li><LinkScroll to="About" spy={true} smooth={true} offset={-100} duration={500} className='action'>Messages</LinkScroll></li>
            <li><LinkScroll to="Feature" spy={true} smooth={true} offset={-100} duration={500} className='action'>Notifications</LinkScroll></li>
            <img src={profile} alt='' className='profile-photo'/>
            
        </ul>
       
        

      </nav>

    </div>
  )
}

export default NavbarCustom
