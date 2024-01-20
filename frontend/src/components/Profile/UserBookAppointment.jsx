import React from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../assets/human6.jpg'
function UserBookAppointment() {

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
            <div className=' w-[70%] ms-24 p-4 flex flex-col justify-around '>
                    <p className='font-semibold text-3xl'>Book Appointment</p>
                    <form action="" className='flex flex-col h-[80%] justify-between'>
                        <div className='w-full flex justify-between'>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Your Name:</p>
                                <input
                                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Name"
                                ></input>
                            </div>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Your Email:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="email"
                                placeholder="Email"
                                ></input>
                            </div>
                        </div>
                        <div className='w-full flex justify-between'>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Your Phone:</p>
                                <input
                                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Phone"
                                ></input>
                            </div>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Appointment Date:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="date"
                                placeholder="Date Of Appointment"
                                ></input>
                            </div>
                        </div>
                
                        <div className='w-full flex justify-between'>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Your Gender:</p>
                                <input
                                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Male/Female/Others"
                                ></input>
                            </div>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Doctor Name:</p>
                                    <select
                                        id="doctors"
                                        className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                    >
                                        <option value="Choose you Consultant">Choose you Consultant</option>
                                        <option value="D1">Doctor 1</option>
                                        <option value="D2">Doctor 2</option>
                                        <option value="D3">Doctor 3</option>
                                    </select>
                            </div>
                        </div>
                        <div className='w-full flex justify-between'>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Reason:</p>
                                <input
                                className="flex h-10 w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Reason"
                                ></input>
                            </div>
                            <div className='flex flex-col w-[50%] justify-start'>
                                <p>Enter Your Address:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Address"
                                ></input>
                            </div>
                        </div>
                        <button className='bg-black text-white p-2 rounded-full'>Book Now</button>
                    </form>
                    
            </div>
        </div>
    </section>
  )
}

export default UserBookAppointment