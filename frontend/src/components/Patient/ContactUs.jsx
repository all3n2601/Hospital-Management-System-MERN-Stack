import React, { useState, useEffect } from "react";
import Navbar from "../Shared/Navbar";
import axios from "axios";
import Swal from "sweetalert2";
import {motion } from "framer-motion";
import { useInView } from 'react-intersection-observer';

function ContactUs() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhoneNo] = useState("");
  const [message, setComment] = useState("");

  const resetForm = () => {
    setName("");
    setEmail("");
    setPhoneNo("");
    setComment("");
  };
  const { ref, inView } = useInView({
    triggerOnce: true, 
    threshold: 0.3, 
  });

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      await axios.post("https://hmsmern.onrender.com/user/add-contact-us", {
        name: name,
        phone: phone,
        email: email,
        message: message
      });
      Swal.fire({
        title: "Success",
        icon: "success",
        confirmButtonText: "Ok",
        text: "Message Sent Successfully! We will get back to you soon!",
      });
      resetForm();
    } catch (err) {
      Swal.fire({
        title: "Error",
        icon: "error",
        confirmButtonText: "Ok",
        text: "Error Sending Message! Please Try Again!",
      });
    }
  };

  return (
    <section
    
  
        
        className="h-screen w-screen bg-[#FEFAE0]">
      <Navbar />
      <motion.div 
      ref={ref}
      initial={{ opacity: 0 }} 
      animate={{ opacity: inView ? 1 : 0 }} 
      transition={{ duration: 1.5 }}
      whileInView={{ opacity: 1 }}
       className="h-screen w-screen flex justify-center items-center pt-24">
        <div className="flex gap-10 mx-14 py-14">
          <div className="flex-col hidden md:flex">
            <span className="text-zinc-650 text-4xl">Locate Us</span>
            <br />
            <span className="text-zinc-550 text-2xl">
              HMS Trivandrum - India
            </span>
            <span className="text-zinc-500 text-base">
              HMS, RandomAddress, ExampleBlah, Trivandrum – XXXXXX, Kerala,
              India
            </span>
            <br />
            <div className="flex gap-20 items-start">
              <div className="flex flex-col">
                <span className="text-zinc-650 text-2xl">Telephone</span>
                <span className="text-zinc-500 text-base">
                  +91 123 456 7890
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-650 text-2xl">Emergency</span>
                <span className="text-zinc-500 text-base">
                  +91 123 456 7890
                </span>
              </div>
              <div className="flex flex-col">
                <span className="text-zinc-650 text-2xl">
                  Corporate Enquiries
                </span>
                <span className="text-zinc-500 text-base">
                  +91 123 456 7890
                </span>
              </div>
            </div>
            <br />
            <div className="flex flex-col">
              <span className="text-zinc-650 text-2xl">Email</span>
              <span className="text-zinc-500 text-base">feedback@hms.org</span>
            </div>
          </div>
          <motion.div
          ref={ref}
          initial={{ opacity: 0, x: 50 }} 
          animate={{ opacity: inView ? 1 : 0, x: inView ? 0 : 50 }} 
          transition={{ duration: 1.5 }}
          whileInView={{ opacity: 1 }}
           className="flex flex-col w-[500px] h-4/5 p-4 justify-center items-center bg-[#FAEDCD] gap-10 border border-black broder-2 rounded-lg border-transparent shadow-xl shadow-slate-950">
            <span className="text-zinc-650 text-3xl font-medium">
              Get in touch
            </span>
            <input
              className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="text"
              placeholder="Name *"
              onChange={(e) =>
                setName(e.target.value)
              }
          
            />
            <input
              className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="number"
              placeholder="Phone / Mobile *"
              onChange={(e) =>
                setPhoneNo(e.target.value)
              }
       
            />
            <input
              className="flex h-10 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              type="email"
              placeholder="Email Address *"
              onChange={(e) =>
                setEmail(e.target.value)
              }

            />
            <textarea
              id="message"
              rows="4"
              className="flex h-30 w-2/3 rounded-md border border-black/30 bg-transparent px-3 py-2 text-sm placeholder:text-gray-600 focus:outline-none focus:ring-1 focus:ring-black/30 focus:ring-offset-1 disabled:cursor-not-allowed disabled:opacity-50"
              placeholder="Message *"
              onChange={(e) =>
                setComment(e.target.value)
              }

            ></textarea>
            <button
              onClick={handleSubmit}
              type="button"
              className="rounded-md bg-[#D4A373] px-10 py-3 text-lg font-semibold text-white shadow-sm hover:scale-105 duration-150 active:scale-90 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-blue-600"
            >
              Submit
            </button>
          </motion.div>
        </div>
      </motion.div>
    </section>
  );
}

export default ContactUs;
