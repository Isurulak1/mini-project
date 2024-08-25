import React from 'react'
import './Contact.css'

const Contact = () => {
  return (
    <div className='contact container' id='Contact'>
       <div className='contact-head'>
        <h1>Contact</h1>
        <div className='line'></div>
        <div className='contactcolumn'>
          <div className='col-1'>
            <h2>Helo</h2>
            <p>fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf
            fsdfjsldjfskdfjsdkfjsdf

            </p>
            <ul>
              <li>Point 1</li>
              <li>Point 2</li>
              <li>Point 3</li>
            </ul>
          </div>
          <div className='col-2'>
            <form>
              <label>Your Name</label>
              <input type='text' name='name' placeholder='Enter name' required/>
              <label>Write Messege</label>
              <textarea name='messege' rows='6' placeholder='Enter description' required></textarea>
              <button type='submit' className='sbmt-btn'>Submit Now</button>
            </form>
          </div>
        </div>
      </div>
    </div>
  )
}

export default Contact
