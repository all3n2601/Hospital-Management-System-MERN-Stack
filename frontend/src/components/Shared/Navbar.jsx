import React, { useState } from 'react'
import { NavLink, useNavigate } from 'react-router-dom';

function Navbar() {

    const navLinkStyle = ({ isActive }) => {
        return {
          fontWeight: isActive ? '600' : '400',
        };
      };
    const navigate = useNavigate();
    const handleClick = ()=>{

        navigate('/sign-in');

    }

    const [isMobNav , setIsMobNav] = useState(false);
    const handleNav = ()=>{
        setIsMobNav(!isMobNav);
    }
    

  return (
    <div className='bg-slate-300 h-[80px] w-full'>
        <div className='flex max-w-7xl items-center justify-between m-auto h-full'>
            <div className='text-3xl'>HMS</div>
            <div className=' justify-center items-center gap-6 text-xl hidden md:flex'>
                <NavLink style={navLinkStyle} to="/home">Home</NavLink>
                <NavLink style={navLinkStyle} to="/appointment">Appointment</NavLink>
                <NavLink style={navLinkStyle} to="/about-us">About Us</NavLink>
                <NavLink style={navLinkStyle} to="/contact-us">Contact Us</NavLink>
                <button className='bg-slate-900 text-white p-1 rounded-lg hover:scale-110 duration-300 active:scale-90' onClick={handleClick}>LogIn</button>
            </div>
            <span className='z-50 text-4xl md:hidden cursor-pointer' onClick={handleNav}>⬅️</span>
            <div className={!isMobNav?'hidden':'flex flex-col absolute top-0 left-0 h-screen w-screen text-white text-xl justify-center items-center bg-black md:hidden '}>
                <NavLink className="py-6 text-3xl"  style={navLinkStyle} to="/home">Home</NavLink>
                <NavLink className="py-6 text-3xl" style={navLinkStyle} to="/appointment">Appointment</NavLink>
                <NavLink className="py-6 text-3xl"  style={navLinkStyle} to="/about-us">About Us</NavLink>
                <NavLink className="py-6 text-3xl"  style={navLinkStyle} to="/contact-us">Contact Us</NavLink>
                <NavLink className="py-6 text-3xl"  style={navLinkStyle} to="/sign-in">SignIn</NavLink>
                
            </div>
            
        </div>
    </div>
  )
}

export default Navbar