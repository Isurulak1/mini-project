import React from 'react'
import './About.css'
import IMAGE1 from '../../Assets/About_Image.png'

const About = () => {
  return (
    <div className='about container' id='About'>
      <div className='about-left'>
        <img src={IMAGE1} alt='' className='about-img'/>
      </div>
      <div className='about-right'>
        <h1>About</h1>
        <div className='line'></div>
        <p>
        ShutterShare is a comprehensive web application revolutionizing the 
        connection between photographers and clients. It offers seamless communication, 
        advanced search and booking processes, machine learning-powered photo selection, 
        direct messaging, real-time notifications, portfolio showcase, secure cloud storage, 
        and a review and rating system, all in one place.
        </p>
      </div>  
        
    </div>
  )
}

export default About
