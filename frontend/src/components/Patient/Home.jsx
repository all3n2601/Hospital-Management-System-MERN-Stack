
import banner from "../../assets/hero.png"
import service from "../../assets/services.png"
import human1 from "../../assets/human1.jpg"
import human4 from "../../assets/human4.jpg"
import human6 from "../../assets/human6.jpg"
import doct1 from "../../assets/doct1.jpg"
import doct2 from "../../assets/doct2.jpg"
import doct3 from "../../assets/doct3.jpg"
import doct4 from "../../assets/doct4.jpg"
import doct5 from "../../assets/doct5.jpg"
import feedback from "../../assets/feedback.png"
import review from "../../assets/review.jpg"
import Footer from '../Shared/Footer';
import {motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';
import axios from "axios"
import { useState } from "react"

import Swal from "sweetalert2";


function Home() {

    
    const { ref, inView } = useInView({
        triggerOnce: true, 
        threshold: 0.3, 
      });

    const [email , setEmail] = useState("");
    const handleNewsletter = async(e) =>{
        e.preventDefault(); 
        await axios.post("https://hmsmern.onrender.com/admin/new-letter", {email})
        .then(() =>{
            Swal.fire({
                title: "Success",
                icon: "success",
                confirmButtonText: "OK",
                text: "Thanks For Subscribing The Newletter!",
              });
        })
        .catch(() =>{
            Swal.fire({
                title: "Error",
                icon: "error",
                confirmButtonText: "OK",
                text: "Failed!",
              });
        })
    }

  return (
    <div className='bg-[#FEFAE0] '   >

        <section 
        
        >
            <div
            
            
            className='flex flex-col lg:flex-row h-screen w-screen justify-center items-center max-w-7xl m-auto'>
                <motion.div
                ref={ref}
                initial={{ opacity: 0 }} 
                animate={{ opacity: inView ? 1 : 0 }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}
                className='flex flex-col justify-center'> 
                    <p className='text-3xl font-semibold text-center'>The Power to Heal </p> 
                    <p className='text-lg text-center'>To Undertake Specialized And holistic healthcare
                        services of world standard and to provide them to all sections....
                    </p>
                </motion.div>
                <motion.div
                
                ref={ref}
                initial={{ opacity: 0, x: 50 }} 
                animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 50 }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}
                className='w-full md:w-[80%] lg:w-[100%]'><img src={banner} alt="hero"  className='h-[400px]  shadow-black'/></motion.div>
            </div>
        
        </section>
        <motion.section 
>

        
            <div 
        
        className='w-full h-full flex flex-col justify-center items-center'>
                <p className='font-semibold text-3xl'>Why Choose Us?</p>
                <div className='flex flex-col md:flex-row justify-center  items-center'>
                    <div className=' w-[350px] h-[300px] md:h-[350px] flex flex-col  justify-evenly md:justify-between'>
                                <motion.div  
                                ref={ref}
                initial={{ opacity: 0,}} 
                animate={{ opacity: inView ? 1 : 0,  }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}>
                            <div>
                                <div className='flex justify-start  gap-2 items-center '>
                                    
                                    <div className='bg-white w-12 rounded-full p-1'>
                                        <svg  className="size-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M8 3V5H6V9C6 11.2091 7.79086 13 10 13C12.2091 13 14 11.2091 14 9V5H12V3H15C15.5523 3 16 3.44772 16 4V9C16 11.9727 13.8381 14.4405 11.0008 14.9169L11 16.5C11 18.433 12.567 20 14.5 20C15.9973 20 17.275 19.0598 17.7749 17.7375C16.7283 17.27 16 16.2201 16 15C16 13.3431 17.3431 12 19 12C20.6569 12 22 13.3431 22 15C22 16.3711 21.0802 17.5274 19.824 17.8854C19.2102 20.252 17.0592 22 14.5 22C11.4624 22 9 19.5376 9 16.5L9.00019 14.9171C6.16238 14.4411 4 11.9731 4 9V4C4 3.44772 4.44772 3 5 3H8Z"></path></svg>
                                    </div>
                                    <p className='text-xl font-semibold'>Best Doctors</p>
                                </div>
                                <p className='text-sm'>Great doctors demonstrate professionalism through their ethical conduct, reliability, punctuality, and accountability</p>
                            </div>
                        </motion.div>
                                <motion.div  
                                ref={ref}
                initial={{ opacity: 0,  }} 
                animate={{ opacity: inView ? 1 : 0,  }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}>
                            <div>
                                <div className='flex justify-start gap-2 items-center'>
                                    <div className='bg-white w-12 rounded-full p-1'>
                                        <svg className='size-10'  xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M13.1962 2.26797L16.4462 7.89714C16.7223 8.37543 16.5584 8.98702 16.0801 9.26316L14.7806 10.0123L15.7811 11.7452L14.049 12.7452L13.0485 11.0123L11.75 11.7632C11.2717 12.0393 10.6601 11.8754 10.384 11.3971L8.5462 8.21466C6.49383 8.83736 5 10.7442 5 13C5 13.6254 5.1148 14.2239 5.32447 14.7757C6.0992 14.284 7.01643 14 8 14C9.68408 14 11.1737 14.8326 12.0797 16.1086L19.7681 11.6704L20.7681 13.4025L12.8898 17.951C12.962 18.2893 13 18.6402 13 19C13 19.3427 12.9655 19.6774 12.8999 20.0007L21 20V22L4.00054 22.0012C3.3723 21.1654 3 20.1262 3 19C3 17.9928 3.29782 17.0551 3.81021 16.2703C3.29276 15.2948 3 14.1816 3 13C3 10.0047 4.88131 7.44881 7.52677 6.44948L7.13397 5.76797C6.58169 4.81139 6.90944 3.58821 7.86603 3.03592L10.4641 1.53592C11.4207 0.983638 12.6439 1.31139 13.1962 2.26797Z"></path></svg>
                                    </div>
                                    <p className='text-xl font-semibold'>Better Research</p>
                                </div>
                            </div>
                            <p className='text-sm'>Quality in clinical research may be defined as compliance with requirements together with credibility and reliability of the data obtained.</p>
                        </motion.div>
                    </div>
                    <div className='hidden md:block'><img src={service} alt="services" className='h-[400px]' /></div>
                    <div className=' md:ms-3 w-[350px] h-[250px] md:h-[350px]  flex flex-col  justify-evenly md:justify-between'>
                                <motion.div  
                                ref={ref}
                initial={{ opacity: 0,  }} 
                animate={{ opacity: inView ? 1 : 0,  }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}>
                            <div>
                                <div className='flex justify-start  gap-2 items-center '>
                                    
                                    <div className='bg-white w-12 rounded-full p-1'>
                                    <svg className="size-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M14.9571 15.564C17.6154 16.6219 19.5726 19.0639 19.9387 22H4.0625C4.42862 19.0639 6.38587 16.6219 9.04417 15.564L12.0006 20L14.9571 15.564ZM18.0006 2V8C18.0006 11.3137 15.3143 14 12.0006 14C8.6869 14 6.00061 11.3137 6.00061 8V2H18.0006ZM16.0006 8H8.00061C8.00061 10.2091 9.79147 12 12.0006 12C14.2098 12 16.0006 10.2091 16.0006 8Z"></path></svg>
                                    </div>
                                    <p className='text-xl font-semibold'>Medical Staff</p>
                                </div>
                                <p className='text-sm'>Nurses are responsible for recognizing patients' symptoms, taking measures within their scope of practice to administer medications</p>
                            </div>
                        </motion.div>
                                <motion.div  
                                ref={ref}
                initial={{ opacity: 0 }} 
                animate={{ opacity: inView ? 1 : 0, }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}>
                            <div>
                                <div className='flex justify-start  gap-2 items-center '>
                                    
                                    <div className='bg-white w-12 rounded-full p-1'>
                                        <svg  className="size-10" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M8 3V5H6V9C6 11.2091 7.79086 13 10 13C12.2091 13 14 11.2091 14 9V5H12V3H15C15.5523 3 16 3.44772 16 4V9C16 11.9727 13.8381 14.4405 11.0008 14.9169L11 16.5C11 18.433 12.567 20 14.5 20C15.9973 20 17.275 19.0598 17.7749 17.7375C16.7283 17.27 16 16.2201 16 15C16 13.3431 17.3431 12 19 12C20.6569 12 22 13.3431 22 15C22 16.3711 21.0802 17.5274 19.824 17.8854C19.2102 20.252 17.0592 22 14.5 22C11.4624 22 9 19.5376 9 16.5L9.00019 14.9171C6.16238 14.4411 4 11.9731 4 9V4C4 3.44772 4.44772 3 5 3H8Z"></path></svg>
                                    </div>
                                    <p className='text-xl font-semibold'>Best Doctors</p>
                                </div>
                                <p className='text-sm'>Great doctors demonstrate professionalism through their ethical conduct, reliability, punctuality, and accountability</p>
                            </div>
                        </motion.div>
                    </div>
                </div>
            </div>
        </motion.section>
        <motion.section
        
        
        ref={ref}
        initial={{ opacity: 0 }} 
        animate={{ opacity: inView ? 1 : 0 }} 
        transition={{ duration: 1.5 }}
        whileInView={{ opacity: 1 }}
        >
            <div className='h-full max-w-7xl flex flex-col m-auto justify-center items-center overflow-auto'>
                <p className='font-semibold text-3xl pt-16'>Meet Our Specialist</p>
                <div className='flex flex-col gap-2'>
                    {/* from here */}

                    <div className='flex gap-3 '>
                    
                        <div className="w-[270px] h-[300px] border border-gray-200 rounded-lg bg-[#D4A373] shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={human1} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Rahul Singh</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>

                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={doct1} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Ramesh Chand</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={doct3} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Maxwell Honda</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={human4} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Selena Gomez</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    <div className='flex gap-3'>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={doct2} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Victor Suresh</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={human6} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Mahesh Dalla</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={doct4} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Sasuke Uchiha</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                        <div className="w-[270px] h-[300px] bg-[#D4A373] border border-gray-200 rounded-lg shadow flex justify-center">
                            <div className="flex flex-col items-center justify-center ">
                                <img className="w-24 h-24 mb-3 rounded-full shadow-lg" src={doct5} alt=""/>
                                <h5 className="mb-1 text-xl font-medium text-black">Dr.Miku Uzumaki</h5>
                                <span className="text-sm text-black">Surgeon</span>
                                <div className="flex mt-4 md:mt-6">
                                    
                                    <a href="/appointment" className="inline-flex items-center px-4 py-2 text-sm font-medium text-center text-gray-900 bg-white border border-gray-300 rounded-lg hover:bg-gray-100 focus:ring-4 focus:outline-none focus:ring-gray-200 dark:bg-gray-800 dark:text-white dark:border-gray-600 dark:hover:bg-gray-700 dark:hover:border-gray-700 dark:focus:ring-gray-700 ms-3">Book Appointment</a>
                                </div>
                            </div>
                        </div>
                    </div>
                    
                </div>
            </div>
        </motion.section>
        <section  
        
        

         >
            <div className=' max-w-7xl m-auto flex flex-col justify-center gap-8 items-center w-full h-full overflow-auto '>
                <motion.div
                ref={ref}
                initial={{ opacity: 0 }} 
                animate={{ opacity: inView ? 1 : 0 }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}
                 className='flex flex-col justify-center items-center'>
                    <p className='text-3xl font-semibold'>Our Patients Feedback About Us</p>
                    <p className='text-sm text-center'>A hospital is a healthcare institution providing patient treatment with specialized health science and auxiliary healthcare staff and medical equipment.</p>
                </motion.div>
                <motion.div
                ref={ref}
                initial={{ opacity: 0}} 
                animate={{ opacity: inView ? 1 : 0 }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}
                 className='flex items-center gap-4 '>
                    <img className='h-[300px] hidden md:block' src={feedback} alt="" />
                    <div className='flex flex-col items-start py-5 p-5 w-[450px] shadow-xl bg-[#E9EDC9] shadow-violet-400 rounded-lg'>
                        <div className='flex justify-center items-center'>
                            <img src={review} className='h-[90px] w-[110px] rounded-full' alt="profile" />
                            <div className='flex flex-col justify-center items-center ps-3'>
                                <p className='font-semibold'>Ms. Ariana Grande</p>
                                <div className='flex '>
                                    <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                    <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                    <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                    <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                    <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                </div>
                            </div>
                            
                        </div>
                    
                        <div>
                            <p className=''>I have visited many hospitals but HMS has to be one of the finest anywhere in the world. </p>
                            <p>From the International desk to the private executive room, service and hospitality has been excellent.</p>
                            <p> I would highly recommend HMS to all. Once again many thanks for your help.</p>
                        </div>
                    </div>
                </motion.div>
            </div>
            
        </section>
        <section
         >
            <div className='absolute lg:m-56 md:m-36 sm:m-24 m-20 overflow-hidden'>
                {/* newsletter */}
                <motion.div 
                ref={ref}
                initial={{ opacity: 0, x: -50 }} 
                animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : -50 }} 
                transition={{ duration: 1.5 }}
                whileInView={{ opacity: 1 }}
                 className="mx-auto max-w-7xl px-2 py-10 lg:px-0 z-10 ">
                            <div className="flex flex-col lg:flex-row lg:items-center lg:justify-between">
                                <div className="w-full md:w-2/3 lg:w-1/2">
                                <h2 className="text-3xl font-bold text-black">Sign up for our weekly newsletter</h2>
                                <p className="mt-4 text-gray-600">
                                Be sure to check out and subscribe to the newsletters of HMS to stay updated about the developments in healthcare field.  
                                </p>
                                <div className="mt-4">
                                    <p className="font-semibold text-gray-800">
                                    Trusted by over 100,000+ businesses and individuals
                                    </p>
                                    <div className="mt-2 flex items-center">
                                    <div className="flex space-x-1">
                                        <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                        <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                        <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                        <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="orange"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>    
                                        <svg  className="size-5" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="green"><path d="M11.9998 17L6.12197 20.5902L7.72007 13.8906L2.48926 9.40983L9.35479 8.85942L11.9998 2.5L14.6449 8.85942L21.5104 9.40983L16.2796 13.8906L17.8777 20.5902L11.9998 17Z"></path></svg>
                                    </div>
                                    <span className="ml-2 inline-block">
                                        <span className="text-sm font-semibold text-gray-800">4.8/5 . 3420 Reviews</span>
                                    </span>
                                    </div>
                                </div>
                                </div>
                                <div className="mt-10 w-full md:w-2/3 lg:mt-0 lg:w-1/2">
                                <form className="flex lg:justify-center">
                                    <div className="flex w-full max-w-md flex-col space-y-4">
                                    <input
                                        className="flex h-10 w-full rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
                                        type="email"
                                        placeholder="Email"
                                        onChange={(e) => setEmail(e.target.value)}
                                    ></input>
                                    <button
                                        type="button"
                                        onClick={handleNewsletter}
                                        className="w-full rounded-md bg-black px-3 py-2 text-sm  font-semibold text-white shadow-sm hover:bg-black/80 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-black"
                                    >
                                        Subscribe
                                    </button>
                                    </div>
                                </form>
                                <p className="mt-2 lg:text-center">
                                    <span className="text-sm text-gray-600">
                                    By signing up, you agree to our terms of service and privacy policy.
                                    </span>
                                </p>
                                </div>
                            </div>
                            </motion.div>

                {/* newsletter */}
            </div>
            <div className=' hidden lg:flex h-full  max-w-7xl m-auto flex-col items-center justify-end '>
                <Footer/>
            </div>
        </section>
    </div>
  )
}

export default Home