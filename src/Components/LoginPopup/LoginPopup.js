import React from 'react'
import { useState } from 'react'
import './LoginPopup.css'
import Closeicon from '../../Assets/CloseIcon.jpg'

const LoginPopup = ({setShowLogin}) => {
    
    const [currState,setCurrState] = useState ('Login')

  return (
    <div className='login-popup'>
      <form className='login-popup-container'>
        <div className='login-popup-title'>
            <h2>{currState}</h2>
            <img src={Closeicon} onClick={()=>setShowLogin(false)} alt=''/>
        </div>
        <div className='login-popup-input'>
            {currState==='Login'?<></>:<input type='text' placeholder='Name' required/>}
            <input type='email' placeholder='Email' required/>
            <input type='password' placeholder='Password' required/>
        </div>
        <button>{currState==='Signup'?'Signup':'Login'}</button>
        {currState==='Login'
        ?<p>Create a new account? <span onClick={()=>setCurrState("Signup")}>Click here</span></p>
        :<p>Already have an account? <span onClick={()=>setCurrState("Login")}>Login here</span></p>
        }
      </form>
      
    
    </div>

    
  )
}

export default LoginPopup
