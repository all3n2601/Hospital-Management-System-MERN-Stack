import React, { useEffect, useState } from 'react'
import { NavLink } from 'react-router-dom';
import profiePic from '../../assets/human6.jpg'
import axios from 'axios';
import Swal from 'sweetalert2';
import AdminSidebar from './AdminSidebar';

function AdminNurse() {

    const[nurses , setNurses] = useState([]);

    useEffect(()=>{

        const getNurses = async()=>{
            const data = await axios.get('http://localhost:4451/nurse/get-nurses')
            .then((response)=>{
                setNurses(response.data);
            })
            .catch((error)=>{
                Swal.fire({
                    icon: 'error',
                    title: 'Oops...',
                    text: error.message,
                })
            }); 
        }

        getNurses();

    },[])


      const [isCreate , setIsCreate] = useState(false);
    
      const handleCreate = ()=>{
          setIsCreate(!isCreate);
      }
  
      const handleGoBack = ()=>{
          setIsCreate(!isCreate);
      }

  return (
    <section className='bg-slate-300 flex justify-center items-center'>
        <div className='h-[80%] w-[80%] bg-white shadow-xl p-2 flex'>
        <AdminSidebar userName={"Admin"} profiePic={profiePic}/>
            <div className=' w-[70%] ms-24 p-4 flex flex-col justify-start gap-5 '>
                    <p className='font-semibold text-3xl'>Nurses</p>
                    <div className='w-full'>


                                <div className="relative overflow-auto shadow-md sm:rounded-lg">
                            <table className="w-full text-sm text-left rtl:text-right text-gray-500 dark:text-gray-400">
                                <thead className="text-xs text-gray-700 uppercase bg-gray-50 dark:bg-gray-700 dark:text-gray-400">
                                    <tr>
                                        <th scope="col" className="px-6 py-3">
                                            Nurse Name
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                        Nurse Id
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            Department
                                        </th>
                                        <th scope="col" className="px-6 py-3">
                                            <span className="sr-only">Edit</span>
                                        </th>
                                    </tr>
                                </thead>
                                <tbody>
                                    <tr className="bg-white border-b dark:bg-gray-800 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600">
                                        <th scope="row" className="px-6 py-4 font-medium text-gray-900 whitespace-nowrap dark:text-white">
                                            Ramesh
                                        </th>
                                        <td className="px-6 py-4">
                                            10012
                                        </td>
                                        <td className="px-6 py-4">
                                            Surgeon
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <button className="font-medium text-blue-600 dark:text-blue-500 hover:underline">Delete</button>
                                        </td>
                                    </tr>
                                    
                                </tbody>
                            </table>
                        </div>
                        
                    </div>
                    <button 
                    onClick={handleCreate}
                    className='bg-slate-900 p-2 w-[10%] rounded-full hover:scale-110 duration-200 active:scale-90  text-white'>Create</button>
            </div>
            {isCreate && <div className='absolute h-[78%] w-[79%] z-50 bg-white'>
                <form className='flex flex-col w-full h-full justify-center gap-4 items-center'>
                    <div className='flex flex-col w-[40%] items-center '>
                                <p className=''>Enter Nurse Name:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Nurse Name"
                                ></input>
                    </div>
                    <div className='flex flex-col w-[40%] items-center '>
                                <p className=''>Enter Nurse ID:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="ID"
                                ></input>
                    </div>
                    <div className='flex flex-col w-[40%] items-center '>
                                <p className=''>Enter Nurse Department:</p>
                                <input
                                className="flex h-10  w-[90%] rounded-md border border-gray-300 bg-transparent px-3 py-2 text-sm placeholder:text-gray-400 focus:outline-none focus:ring-1 focus:ring-gray-400 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                type="text"
                                placeholder="Department"
                                ></input>
                    </div>

                    <button 
                    className=' w-[35%] bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-110 duration-200 active:scale-90'
                    >Add Nurse</button>  
                    
                    <button onClick={handleGoBack}
                    className='bg-black text-white rounded-full text-md font-medium p-2 cursor-pointer hover:scale-105 duration-200 active:scale-90'
                    >{"<- Go back"}</button>  
                </form>
                  
                
            </div>}
        </div>
        
    </section>
  )
}

export default AdminNurse