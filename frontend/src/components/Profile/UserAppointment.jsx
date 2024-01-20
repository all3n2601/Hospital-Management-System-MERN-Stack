import React from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../assets/human6.jpg'
function UserAppointment() {

    const navLinkStyle = ({ isActive }) => {
        return {
          fontWeight: isActive ? '600' : '400',
          color: isActive ? 'white' : 'black',
          backgroundColor: isActive ? "black":"white",
          
        };
      };

  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
            <div className='bg-slate- h-full w-[18%] flex flex-col justify-between p-2 '>
                <div className='flex flex-col gap-16'>
                    <div className='w-full flex flex-col items-center gap-3'>
                        <img src={profiePic} className='size-24 rounded-full' alt="profile" />
                        <p>Name</p>
                    </div>
                    <div className='flex flex-col items-start w-full gap-4 '>
                        <NavLink style={navLinkStyle} className={'w-full   p-2 h-[40px] '} to="/user-profile">Settings</NavLink>
                        <NavLink style={navLinkStyle} className={'w-full  p-2 h-[40px] '} to="/user-appointments">History</NavLink>
                        <NavLink style={navLinkStyle}  className={'w-full p-2 h-[40px] '} to="/user-book-appointment">Book Appointment</NavLink>
                    </div>
                </div>
                <div className='w-full text-center  h-[80px] p-2'>
                    <button className='bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90 '>Sign Out</button>
                </div>
            </div>
            <div className='overflow-auto  w-[70%] ms-24 p-4 flex flex-col  '>
                {/* main content comes here */}
                
            </div>
        </div>
        
    </section>
  )
}

export default UserAppointment